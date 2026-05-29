# SACFunDay

> A practical, production-oriented system for managing a church Fun Day / Sports Day.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Turso](https://img.shields.io/badge/Database-Turso-orange?style=flat)](https://turso.tech)

**SACFunDay** is a complete, real-world application built for running an annual church Fun Day. It is designed with both a low-friction experience for parents and participants, and practical, reliable tools for the organizing committee on the day of the event.

Originally created for **St. Augustine's Chapel**.

## Features

- **Parent & Adult Sign-up Portal** — 2–3 week open registration window
- **Master QR Code System** — One memorable QR per person for all their events
- **Station Check-in** — Camera QR scanning + manual entry with full participant visibility
- **Result Entry** — Fast, touch-friendly interface with paper + digital workflow support, undo, and audit trail
- **Admin Tools** — Events, participants, settings, and "Current Operator" management for the Organizing Committee ("The Stand")
- **Age-Group Events** — Supports children through adult categories (including dedicated 20-40, 40-60, and 60+ bands)

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Database**: Drizzle ORM + Turso (LibSQL) for production, local SQLite for development
- **Other**: QR code generation (`qrcode`), camera scanning (`html5-qrcode`)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/sacfunday.git
cd sacfunday

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database

By default, the app uses a local SQLite database (`sacfundday.db`).

For production, it is strongly recommended to use **Turso**:

```env
DATABASE_URL=libsql://your-db.turso.io
DATABASE_AUTH_TOKEN=your-auth-token
```

### Useful Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:push      # Push schema changes (use with caution in production)
npm run db:seed      # Seed the database with demo data (fictional)
npm run db:studio    # Open Drizzle Studio database browser
```

## Demo Data

The included seed script (`npm run db:seed`) creates a lightweight but realistic dataset:

- 9 age groups (Kindergarten through Ages 60+)
- 47 events
- 25 participants (15 children + 5 regular adults + 5 OC staff)
- All participants have Master QR codes

**Note**: All names and contact details in the seed data are fictional.

## Project Structure

```
app/
├── admin/              # Organizing Committee tools
│   ├── events/
│   ├── participants/
│   ├── results/        # Result entry with paper/digital support
│   ├── checkin/        # Station check-in (camera + manual)
│   └── settings/
├── portal/             # Public-facing pages
│   ├── signup/         # Parent/adult registration + immediate QR
│   └── retrieve/       # QR lookup for lost codes
└── layout.tsx

scripts/
└── seed.ts             # Database seeding script

lib/db/
├── client.ts
└── schema.ts
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for instructions on deploying with **Vercel + Turso**.

## Contributing

Contributions are welcome! Please open an issue first to discuss major changes.

When contributing:

- Follow the existing code style and component patterns.
- Keep mobile usability in mind (many day-of tasks happen on phones).
- Update documentation where relevant.

## License

MIT © Jesse H. Co

---

> Originally built for St. Augustine's Chapel's annual Fun Day. Maintained by Jesse H. Co.