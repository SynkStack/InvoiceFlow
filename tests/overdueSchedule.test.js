const pool = require('../src/db/pool');
const { runMigrations } = require('../src/db/migrate');
const { markOverdueInvoices } = require('../src/jobs/overdueJob');

beforeAll(async () => { await runMigrations(); });
beforeEach(async () => {
  await pool.query('TRUNCATE customers RESTART IDENTITY CASCADE');
  await pool.query("INSERT INTO customers (name, email) VALUES ('Asha', 'asha@example.com')");
});
afterAll(async () => { await pool.end(); });

describe('overdue job with the real clock', () => {
  it('does not touch an invoice that is not due yet', async () => {
    // Due "next week" when this test was written (hard-coded)
    await pool.query(
      `INSERT INTO invoices (customer_id, status, due_date, subtotal_cents, tax_cents, total_cents)
       VALUES (1, 'sent', '2027-01-01', 1000, 180, 1180)`
    );
    expect(await markOverdueInvoices()).toBe(0); // uses today's real date
  });
});
