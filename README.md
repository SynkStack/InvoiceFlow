# InvoiceFlow
REST API for customers and invoices. Part of NovaStack Technologies.

## Run
```
docker compose up -d
docker compose exec db createdb -U invoiceflow invoiceflow_test
cp .env.example .env
npm install
npm run db:migrate
npm start
npm test
```

## Money rules
- All amounts are integer cents; never floats.
- Tax rate is in basis points (1800 = 18%).
- Tax is rounded once, on the invoice subtotal.

## Docker
```
docker compose up -d --build   # starts Postgres and the API on port 3000
curl http://localhost:3000/health
```

## CI
GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull request:
tests against a Postgres service, a dependency audit, and a Docker image build.