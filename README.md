# InvoiceFlow
REST API for customers and invoices. Part of NovaStack Technologies.

## Run
```
npm install
cp .env.example .env
npm start
npm test
```

## Money rules
- All amounts are integer cents; never floats.
- Tax rate is in basis points (1800 = 18%).
- Tax is rounded once, on the invoice subtotal.