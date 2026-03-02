# Checkout API

**Checkout API** is a NestJS-based backend service for managing products, transactions, payments and deliveries. It exposes a clean set of REST endpoints and uses Prisma/ PostgreSQL for persistence. The codebase includes comprehensive unit tests covering controllers and services.

---

## 🔍 Overview

- **Framework:** NestJS (v11)
- **Language:** TypeScript
- **Database:** PostgreSQL via Prisma ORM
- **Payment Provider:** (external API integration)
- **Test runner:** Jest with ts‑jest
- **Architecture:** Modular (transactions, payments, delivery, products, external-api)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 16 or newer
- npm (or yarn) installed globally
- PostgreSQL database accessible (connection string via `DATABASE_URL`)

### Installation

```bash
npm ci        # install dependencies and run postinstall prisma generate
```

### Database setup

```bash
# generate Prisma client
npm run prisma:generate

# run migrations (development)
npm run start:dev  # will deploy migrations automatically before starting

# or manually
npx prisma migrate dev --name init
npm run seed      # optional, seeds example data
```

### Environment Variables

Create a `.env` file with at least:

```
DATABASE_URL="postgresql://user:pass@localhost:5432/checkout?schema=public"
WOMPI_API_URL=https://api-sandbox.co.uat.wompi.dev/v1
WOMPI_PRIVATE_KEY=your_private
WOMPI_PUBLIC_KEY=your_public
WOMPI_INTEGRITY_SECRET=your_secret
```

---

## 🏃 Running the App

```bash
# development (with hot reload)
npm run start:dev

# build + run
npm run build && npm run start:prod
```

The server listens on port `3000` by default. Adjust via `PORT` env var.

---

## ✅ Testing

Unit tests are located alongside implementation files (`*.spec.ts`).

```bash
# run all unit tests
npm run test

# watch mode
npm run test:watch

# e2e suite
npm run test:e2e

# coverage report
npm run test:cov
```

All unit tests pass out of the box (33 tests currently).

---

## 📦 Project Structure

```
src/
  app.module.ts          # root module
  main.ts                # bootstrap
  prisma/                # prisma helper and service
  products/              # CRUD products
  transactions/          # create/process transactions
  payments/              # webhook & SSE
  delivery/              # delivery listing
  external-api/          # integration with Wompi API
  ...
```

---

## 🔗 API Endpoints (selected)

| Path                                | Method | Description                     |
|-------------------------------------|--------|---------------------------------|
| `/products`                         | GET    | list all products               |
| `/transactions`                     | POST   | create a new transaction        |
| `/transactions/:id`                 | GET    | fetch transaction by ID         |
| `/transactions/:id/process`         | POST   | process payment using tokens    |
| `/payments/webhook`                 | POST   | Wompi webhook receiver          |
| `/payments/acceptance-data`         | GET    | fetch token for frontend        |
| `/payments/transactions/:id/events` | GET    | Server-Sent Events (SSE) stream |
| `/delivery`                         | GET    | list delivery records           |

Refer to controllers for full request/response shapes.

---

## 📦 Deployment

Build with `npm run build`. Use any container provider or server. Ensure environment variables and database are configured. Migrations run automatically on startup.

---

## 🛠 Support & Resources

- [NestJS docs](https://docs.nestjs.com)
- [Prisma docs](https://www.prisma.io/docs)
- [Wompi API docs](https://developers.wompi.co/en/)

For community help, join the NestJS Discord or open issues in this repo.

---

## 📄 License

This project is MIT licensed. See the [LICENSE](./LICENSE) file for details.

