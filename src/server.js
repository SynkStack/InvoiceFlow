require('dotenv').config(); // load .env before reading PORT
const app = require('./app');
const { startOverdueJob } = require('./jobs/overdueJob');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`InvoiceFlow listening on ${PORT}`));

startOverdueJob(); // runs daily in the background