# enakga

**Barang beneran, review beneran** — A community-driven product review platform for Indonesian consumers.

## Overview

enakga is a web application where users can discover, share, and review real products. It features AI-powered product detection, barcode scanning, semantic search, and a recommendation engine — all built for the Indonesian market.

## Features

- **Product Discovery** — Browse and search products with semantic similarity search powered by OpenAI embeddings
- **AI Image Detection** — Snap a photo of a product package; GPT-4.1-mini auto-fills product details
- **Barcode Scanning** — Scan barcodes (via ZXing.js) for quick product lookup
- **Review System** — Rate products 1–5 stars with optional written reviews; one review per user per product
- **Recommendations** — Top 4 semantically similar products on every product page using cosine similarity
- **Authentication** — Google OAuth and email/password login via Auth.js (NextAuth v5)
- **Role-based Access** — USER, ADMIN, and MODERATOR roles
- **Admin Notifications** — Email alerts on new registrations and product submissions via Resend

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + Radix UI + Lucide React |
| Database | PostgreSQL + Prisma ORM |
| Auth | Auth.js / NextAuth v5 (Google OAuth, credentials) |
| AI | OpenAI GPT-4.1-mini (vision) + text-embedding-3-small |
| Storage | Vercel Blob |
| Email | Resend |
| Validation | Zod |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key
- Google OAuth credentials (optional)
- Vercel Blob token
- Resend API key

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL=
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
OPENAI_API_KEY=
BLOB_READ_WRITE_TOKEN=
RESEND_API_KEY=
ADMIN_EMAIL=
```

### Database Setup

```bash
npx prisma migrate dev
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
/src
  /app          # Next.js routes and pages
  /components   # React components
  /lib
    auth.ts         # NextAuth configuration
    actions.ts      # Server actions
    embeddings.ts   # OpenAI embedding generation
    similarity.ts   # Cosine similarity for recommendations
    prisma.ts       # Prisma client
/prisma         # Schema and migrations
/public         # Static assets
```

## Deployment

Deploy on [Vercel](https://vercel.com) for the best experience with Next.js and Vercel Blob.
