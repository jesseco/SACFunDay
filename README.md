# SACFunDay

> A practical, production-oriented system for managing a church Fun Day / Sports Day.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Turso](https://img.shields.io/badge/Database-Turso-orange?style=flat)](https://turso.tech)

**St. Augustine's Chapel Fun Day Management System**

A complete, real-world application for running an annual church Fun Day, designed with both parent experience and on-the-day operational needs in mind.

### Features

- Parent & Adult sign-up portal (2–3 week window)
- Master QR code per participant (one memorable code for all events)
- Station check-in with camera QR scanning
- Fast, touch-friendly result entry with paper + digital workflow support
- Admin tools for the Organizing Committee ("The Stand")
- Age-group based events (including dedicated adult categories)

Built for St. Augustine's Chapel.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript + Tailwind + shadcn/ui
- Drizzle ORM + Turso (LibSQL) or local SQLite
- QR code generation and scanning

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Local Development (SQLite)

```bash
# Clone the repo
git clone https://github.com/your-username/sacfunday.git
cd sacfunday

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database

- **Development**: Uses local `sacfundday.db` (SQLite) by default.
- **Production**: Recommended to use [Turso](https://turso.tech) (hosted LibSQL).

To use Turso, set these environment variables:

```env
DATABASE_URL=libsql://your-db.turso.io
DATABASE_AUTH_TOKEN=your-auth-token
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:push      # Push schema changes to database
npm run db:seed      # Seed the database with demo data
npm run db:studio    # Open Drizzle Studio
```

## Project Structure

- `/app/portal` — Public sign-up and QR retrieval
- `/app/admin` — Organizing Committee tools (events, participants, result entry, check-in, settings)
- `/scripts/seed.ts` — Database seeding script

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for instructions on deploying with Vercel + Turso.

## Contributing

Contributions are welcome. Please open an issue first to discuss any major changes.

When contributing:

1. Follow the existing code style and component patterns.
2. Update documentation where relevant.
3. Ensure the application remains usable on both desktop and mobile (important for field use).

## License

MIT © St. Augustine's Chapel

---

> This project was built to solve real operational needs for a church Fun Day, with a strong focus on low-friction parent experience and reliable day-of tools for the organizing committee.
