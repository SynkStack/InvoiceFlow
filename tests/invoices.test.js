const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');
const { runMigrations } = require('../src/db/migrate');

beforeAll(async () => { await runMigrations(); });
beforeEach(async () => {
  await pool.query('TRUNCATE customers RESTART IDENTITY CASCADE');
  await pool.query("INSERT INTO customers (name, email) VALUES ('Asha', 'asha@example.com')");
});
afterAll(async () => { await pool.end(); });

const validInvoice = {
  customer_id: 1,
  due_date: '2026-12-31',
  line_items: [
    { description: 'Design work', quantity: 2, unit_price_cents: 5000 },
    { description: 'Hosting', quantity: 1, unit_price_cents: 2500 },
  ],
};

describe('POST /invoices', () => {
  it('creates a draft invoice with calculated totals', async () => {
    const res = await request(app).post('/invoices').send(validInvoice);
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      customer_id: 1,
      status: 'draft',
      due_date: '2026-12-31',
      subtotal_cents: 12500,
      tax_cents: 2250,
      total_cents: 14750,
    });
    expect(res.body.line_items).toHaveLength(2);
  });

  it('ignores totals sent by the client', async () => {
    const res = await request(app).post('/invoices').send({ ...validInvoice, total_cents: 1 });
    expect(res.statusCode).toBe(201);
    expect(res.body.total_cents).toBe(14750);
  });

  it('rejects an empty line item list', async () => {
    const res = await request(app).post('/invoices').send({ ...validInvoice, line_items: [] });
    expect(res.statusCode).toBe(400);
  });

  it('rejects an impossible date', async () => {
    const res = await request(app).post('/invoices').send({ ...validInvoice, due_date: '2026-02-31' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects a float price', async () => {
    const bad = { ...validInvoice, line_items: [{ description: 'x', quantity: 1, unit_price_cents: 10.5 }] };
    const res = await request(app).post('/invoices').send(bad);
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for an unknown customer and saves nothing', async () => {
    const res = await request(app).post('/invoices').send({ ...validInvoice, customer_id: 999 });
    expect(res.statusCode).toBe(404);
    const { rows } = await pool.query('SELECT count(*) FROM invoices');
    expect(rows[0].count).toBe('0');
  });
});

describe('GET /invoices/:id', () => {
  it('returns an invoice with its line items', async () => {
    await request(app).post('/invoices').send(validInvoice);
    const res = await request(app).get('/invoices/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.line_items).toHaveLength(2);
  });

  it('returns 404 if missing and 400 for a bad id', async () => {
    expect((await request(app).get('/invoices/999')).statusCode).toBe(404);
    expect((await request(app).get('/invoices/abc')).statusCode).toBe(400);
  });
});