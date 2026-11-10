const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');
const { runMigrations } = require('../src/db/migrate');

const createInvoice = (customer_id, due_date) =>
  request(app).post('/invoices').send({
    customer_id,
    due_date,
    line_items: [{ description: 'Work', quantity: 1, unit_price_cents: 1000 }],
  });

beforeAll(async () => { await runMigrations(); });
beforeEach(async () => {
  await pool.query('TRUNCATE customers RESTART IDENTITY CASCADE');
  await pool.query(
    "INSERT INTO customers (name, email) VALUES ('Asha', 'asha@example.com'), ('Ravi', 'ravi@example.com')"
  );
  await createInvoice(1, '2026-12-31'); // invoice 1
  await createInvoice(1, '2026-06-30'); // invoice 2
  await createInvoice(2, '2026-12-31'); // invoice 3
  await request(app).patch('/invoices/2/status').send({ status: 'sent' });
});
afterAll(async () => { await pool.end(); });

describe('GET /invoices', () => {
  it('lists all invoices with paging info', async () => {
    const res = await request(app).get('/invoices');
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ total: 3, limit: 20, offset: 0 });
    expect(res.body.data).toHaveLength(3);
  });

  it('filters by status', async () => {
    const res = await request(app).get('/invoices').query({ status: 'sent' });
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].id).toBe(2);
  });

  it('filters by customer', async () => {
    const res = await request(app).get('/invoices').query({ customer_id: 2 });
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].id).toBe(3);
  });

  it('filters by due date', async () => {
    const res = await request(app).get('/invoices').query({ due_before: '2026-07-01' });
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].id).toBe(2);
  });

  it('paginates', async () => {
    const res = await request(app).get('/invoices').query({ limit: 2, offset: 2 });
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(3);
  });

  it('rejects an unknown status with 400', async () => {
    const res = await request(app).get('/invoices').query({ status: 'archived' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects a limit above 100 with 400', async () => {
    const res = await request(app).get('/invoices').query({ limit: 1000 });
    expect(res.statusCode).toBe(400);
  });
});