const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');
const { runMigrations } = require('../src/db/migrate');

beforeAll(async () => { await runMigrations(); });
beforeEach(async () => { await pool.query('TRUNCATE customers RESTART IDENTITY CASCADE'); });
afterAll(async () => { await pool.end(); });

const asha = { name: 'Asha', email: 'asha@example.com' };

describe('customers API', () => {
  it('creates a customer', async () => {
    const res = await request(app).post('/customers').send(asha);
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ id: 1, ...asha });
  });

  it('rejects invalid input with 400', async () => {
    const res = await request(app).post('/customers').send({ name: '', email: 'nope' });
    expect(res.statusCode).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/customers').send(asha);
    const res = await request(app).post('/customers').send(asha);
    expect(res.statusCode).toBe(409);
  });

  it('lists customers', async () => {
    await request(app).post('/customers').send(asha);
    const res = await request(app).get('/customers');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('gets one customer, 404 if missing, 400 if bad id', async () => {
    await request(app).post('/customers').send(asha);
    expect((await request(app).get('/customers/1')).statusCode).toBe(200);
    expect((await request(app).get('/customers/999')).statusCode).toBe(404);
    expect((await request(app).get('/customers/abc')).statusCode).toBe(400);
  });

  it('updates a customer', async () => {
    await request(app).post('/customers').send(asha);
    const res = await request(app).put('/customers/1').send({ name: 'Asha K', email: 'asha@example.com' });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Asha K');
  });

  it('deletes a customer', async () => {
    await request(app).post('/customers').send(asha);
    expect((await request(app).delete('/customers/1')).statusCode).toBe(204);
    expect((await request(app).get('/customers/1')).statusCode).toBe(404);
  });
});