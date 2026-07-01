# SIDIKBank — Digital Banking Simulator

A full-featured digital banking simulator built with TanStack Start, Netlify Identity, and Netlify Database. Simulates real bank operations including transfers, QRIS payments, transaction history, fraud detection, and account management.

## Features

- **Login & Registration** — Email/password authentication via Netlify Identity
- **Dashboard** — Balance overview, quick actions, and recent transactions
- **Transfer Simulator** — Real-time account lookup and fund transfers with fraud detection
- **QRIS Payment** — Animated QR code simulator with merchant selection
- **Transaction History** — Filterable, searchable full transaction log
- **Profile Management** — Editable user profile with security status

## Tech Stack

- **Framework**: TanStack Start (React + Vite, SSR)
- **Auth**: Netlify Identity (`@netlify/identity`)
- **Database**: Netlify Database (Postgres) via Drizzle ORM (`drizzle-orm@beta`)
- **Styling**: Tailwind CSS + inline styles (dark navy banking theme)
- **Charts**: lucide-react icons

## Local Development

```bash
npm install
netlify dev --port 8889
```

> **Note**: Netlify Identity authentication only works when deployed to a Netlify environment. It does not function on localhost.

## Deploy

Push to your Netlify-connected repository. The database migrations run automatically at deploy time.
