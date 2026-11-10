const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');
const { runMigrations } = require('../src/db/migrate');

beforeAll(async () => { await runMigrations(); });
beforeEach(async () => {
  await pool.query('TRUNCATE customers RESTART IDENTITY CASCADE');
  await pool.query("INSERT INTO customers (name, email) VALUES ('Asha', 'asha@example.com')");
  // Every test starts with one draft invoice (id 1)
  await request(app).post('/invoices').send({
    customer_id: 1,
    due_date: '2026-12-31',
    line_items: [{ description: 'Design work', quantity: 1, unit_price_cents: 5000 }],
  });
});
afterAll(async () => { await pool.end(); });

const setStatus = (id, status) =>
  request(app).patch(`/invoices/${id}/status`).send({ status });

describe('PATCH /invoices/:id/status', () => {
  it('moves draft -> sent', async () => {
    const res = await setStatus(1, 'sent');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('sent');
  });

  it('follows draft -> sent -> paid', async () => {
    await setStatus(1, 'sent');
    const res = await setStatus(1, 'paid');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('paid');
  });

  it('follows sent -> overdue -> paid', async () => {
    await setStatus(1, 'sent');
    expect((await setStatus(1, 'overdue')).body.status).toBe('overdue');
    expect((await setStatus(1, 'paid')).body.status).toBe('paid');
  });

  it('rejects draft -> paid with 409 and keeps the status', async () => {
    const res = await setStatus(1, 'paid');
    expect(res.statusCode).toBe(409);
    const check = await request(app).get('/invoices/1');
    expect(check.body.status).toBe('draft');
  });

  it('rejects any change once paid', async () => {
    await setStatus(1, 'sent');
    await setStatus(1, 'paid');
    expect((await setStatus(1, 'sent')).statusCode).toBe(409);
  });

  it('rejects an unknown status with 400', async () => {
    expect((await setStatus(1, 'archived')).statusCode).toBe(400);
  });

  it('returns 404 for a missing invoice', async () => {
    expect((await setStatus(999, 'sent')).statusCode).toBe(404);
  });

  it('returns 400 for a bad id', async () => {
    expect((await setStatus('abc', 'sent')).statusCode).toBe(400);
  });
});