const pool = require('../src/db/pool');
const { runMigrations } = require('../src/db/migrate');
const { markOverdueInvoices } = require('../src/jobs/overdueJob');

beforeAll(async () => { await runMigrations(); });
beforeEach(async () => {
  await pool.query('TRUNCATE customers RESTART IDENTITY CASCADE');
  await pool.query("INSERT INTO customers (name, email) VALUES ('Asha', 'asha@example.com')");
});
afterAll(async () => { await pool.end(); });

// Inserts an invoice directly, so each test controls status and due date
const insertInvoice = (status, due) =>
  pool.query(
    `INSERT INTO invoices (customer_id, status, due_date, subtotal_cents, tax_cents, total_cents)
     VALUES (1, $1, $2, 1000, 180, 1180)`,
    [status, due]
  );

const statuses = async () =>
  (await pool.query('SELECT status FROM invoices ORDER BY id')).rows.map((r) => r.status);

describe('markOverdueInvoices', () => {
  it('marks past-due sent invoices as overdue', async () => {
    await insertInvoice('sent', '2026-01-01');
    expect(await markOverdueInvoices('2026-06-01')).toBe(1);
    expect(await statuses()).toEqual(['overdue']);
  });

  it('leaves sent invoices that are not due yet', async () => {
    await insertInvoice('sent', '2026-12-31');
    expect(await markOverdueInvoices('2026-06-01')).toBe(0);
    expect(await statuses()).toEqual(['sent']);
  });

  it('does not mark an invoice that is due today', async () => {
    await insertInvoice('sent', '2026-06-01');
    expect(await markOverdueInvoices('2026-06-01')).toBe(0);
  });

  it('ignores draft and paid invoices', async () => {
    await insertInvoice('draft', '2026-01-01');
    await insertInvoice('paid', '2026-01-01');
    expect(await markOverdueInvoices('2026-06-01')).toBe(0);
    expect(await statuses()).toEqual(['draft', 'paid']);
  });
});