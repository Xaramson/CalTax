rgb(1, 7, 54)
rgb(13, 28, 66)
rgb(34, 57, 111)
rgb(252, 241, 208)# Caltax — independent business-management prototype


## Included modules

- Overview dashboard with sales metrics, low-stock alerts, recent transactions, and top products
- POS checkout with product search, category filters, cart quantity controls, customer selection, discounts, payment-method selection, and stock validation
- Product catalogue with product creation, SKU uniqueness checks, price/cost tracking, and CSV export
- Inventory table, stock value, reorder alerts, and stock adjustment tools
- Sales history, CSV export, and demo refund workflow that restores stock
- Customer directory and customer creation
- Expense ledger, expense creation, and CSV export
- Tax planning estimates for company and individual income tax, deductible/relief inputs, profit since last filing, and an in-app filing-date reminder
- Reports for revenue, cost of goods sold, gross profit, recorded expenses, and payment-method totals
- Store settings, configurable display fields, local demo data reset
- Responsive desktop/tablet/mobile layout
- Browser-local persistence using `localStorage`

## Requirements

- Node.js 20 or newer (Node 22 recommended)
- npm

## Run locally

```bash
npm install
npm run dev
```

Open the local URL Vite prints in the terminal.

To create a production build:

```bash
npm run build
npm run preview
```

## Important prototype limitations

This is a functional frontend prototype, not a production-ready cloud POS. Data is saved only in the current browser profile with `localStorage`; it does not sync across devices. Authentication, server-side authorization, multi-tenant isolation, real payment processing, filing/payment integration, double-entry accounting, server backups, audit-grade logs, and offline synchronization are not implemented. Tax figures are estimates based on locally recorded demo sales, product costs, expenses, and user-entered deductions; the app does not determine legal eligibility, create or submit tax returns, or send external filing reminders. Confirm current legislation, deductions, thresholds, and deadlines with the Nigeria Revenue Service or a qualified tax practitioner. Payment methods are recorded as demo labels only. Refunds update the demo sale status and restore inventory but do not initiate real money movement.

Before production, add a backend API, PostgreSQL database, secure authentication and role-based authorization, transaction-safe stock updates, immutable accounting/audit records, tested tax rules, payment-provider integration, and an offline sync protocol with idempotency and conflict handling.
