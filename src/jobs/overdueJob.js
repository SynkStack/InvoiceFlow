const cron = require('node-cron');
const pool = require('../db/pool');

const todayString = () => new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

// Marks sent invoices whose due date has passed as overdue.
// "today" is a parameter so tests can use a fixed date.
async function markOverdueInvoices(today = todayString()) {
  const { rowCount } = await pool.query(
    `UPDATE invoices SET status = 'overdue'
     WHERE status = 'sent' AND due_date < $1`,
    [today]
  );
  return rowCount;
}

// Schedules the job: every day at 01:00 (minute hour day month weekday)
function startOverdueJob() {
  return cron.schedule('0 1 * * *', async () => {
    try {
      const count = await markOverdueInvoices();
      console.log(`Overdue job: marked ${count} invoice(s) overdue`);
    } catch (err) {
      console.error('Overdue job failed', err);
    }
  });
}

module.exports = { markOverdueInvoices, startOverdueJob };