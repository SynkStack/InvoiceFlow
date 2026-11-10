require('dotenv').config();
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgres://invoiceflow:invoiceflow@localhost:5432/invoiceflow_test';