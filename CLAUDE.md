# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

enakga — a community-driven product review platform for Indonesian consumers ("Barang beneran, review beneran"). Next.js App Router + TypeScript, PostgreSQL via Prisma, NextAuth v5, OpenAI (vision + embeddings), Vercel Blob for images, Resend for email.

## Commands

```bash
npm run dev              # start dev server (Turbopack)
npm run build             # production build (Turbopack)
npm start                 # run production build
npm run lint               # eslint (flat config, next/core-web-vitals + next/typescript)

npx prisma migrate dev     # apply/create migrations (also seeds via prisma.config.ts)
npx prisma generate        # regenerate the Prisma client after any schema.prisma change
npx tsx prisma/seed.ts               # seed categories/sample data directly
npx tsx prisma/backfill-embeddings.ts    # backfill OpenAI embeddings for products missing one
npx tsx prisma/backfill-descriptions.ts  # backfill product descriptions
```

There is no test suite in this repo (no test script, no test files). `npx tsc --noEmit` is the fastest way to check for type errors across the app.

## Prisma setup (non-standard paths)

- The schema file lives at `src/lib/schema.prisma`, **not** `prisma/schema.prisma`. Config (schema path, migrations path, seed command) is in `prisma.config.ts`, not the schema file.
- The client generates into `src/generated/prisma/` and this output **is committed to git** (not gitignored) — after editing `schema.prisma`, run `npx prisma generate` and commit the regenerated files.
- Two import paths both resolve to the generated client and are used interchangeably across the codebase:
  - `@/generated/prisma/client` (direct)
  - `@prisma/client` (aliased — `tsconfig.json` maps `@prisma/*` → `src/generated/prisma/*`; this is **not** the real `@prisma/client` npm package)
- The Prisma client (`src/lib/prisma.ts`) is instantiated with the `PrismaPg` driver adapter over `DATABASE_URL`, cached on `globalThis` in dev.

## Architecture

**Route structure** (`src/app`):
- `(public)/` and `(auth)/` — route groups for the homepage/about/feedback and signin/signup, no URL segment added.
- `[slug]/page.tsx` — the catch-all **product detail page**, keyed by `Product.slug`. There is no `/product/[id]` view page; a `RESERVED` slug set in this file must be updated whenever a new top-level static route is added, to avoid colliding with a product's slug.
- `product/create/` and `product/[productid]/edit/` — product create/edit forms. Both require a signed-in session (redirect to `/signin` otherwise, checked at the page level, not just in the server action); edit additionally requires `ADMIN`/`MODERATOR`.
- `r/[permalink]/page.tsx` — public reader view for a published `Ulasan` (blog post).
- `admin/*` — gated in `admin/layout.tsx` by `session.user.role` (`ADMIN` or `MODERATOR`); covers product moderation, category management, user management, reports, Ulasan (blog) CRUD, and bulk product upload (`admin/products/bulk`).
- `api/*` — only used where a real HTTP endpoint is needed: NextAuth handler, `recommendations` (GET, similarity scoring), `product-detect` (POST, vision-based product autofill), `ai-write` (AI-assisted Ulasan copy).
- `app/actions/*.ts` — all other mutations are Next.js **Server Actions** (`"use server"`), called directly from client/server components. There is no separate REST layer for CRUD; each action re-checks `auth()` and role itself (no shared middleware/guard — the same `role !== "ADMIN" && role !== "MODERATOR"` check is repeated per action/page).

**Auth** (`src/lib/auth.ts`): NextAuth v5 (beta) with `PrismaAdapter`, Google OAuth + Credentials providers. Credentials logins are forced onto **database sessions** via a custom `jwt.encode` override (it manually creates an adapter session and returns the session token in place of a JWT) so both providers end up with a DB-backed session row — don't "simplify" this by removing the encode override. Suspended users (`User.status === "SUSPENDED"`) are rejected both in `authorize()` and the `signIn` callback. Session typing (`role`, `id`) is augmented in `src/types/next-auth.d.ts`.

**Product moderation lifecycle**: `Product.status` is `PENDING | ACTIVE | INACTIVE` (default `PENDING`). `createproduct.ts` sets a new product to `ACTIVE` immediately when the creator's session role is `ADMIN`/`MODERATOR`, otherwise it stays `PENDING`. `changeProductStatus` (`src/app/actions/changeproductstatus.ts`) is the single choke point admins use to transition status, invoked from the admin product table (`statusbtn.tsx`) and from the public product page's approve button (`approveproductbutton.tsx`). Public-facing queries filter on `deletedAt: null` plus status — currently `ACTIVE`+`PENDING` are shown publicly (with a "pending moderation" badge) while sitemap generation, the recommendations engine, and Ulasan product-embed snippets restrict to `ACTIVE` only. `INACTIVE` is never shown publicly.

**Two unrelated "review" concepts — don't conflate them**:
- `Review` model — 1–5 star ratings + optional text on a `Product` (one per user per product, enforced by a unique constraint). Has its own `ReviewStatus` (`PENDING/APPROVED/REJECTED`), currently unused by any moderation UI.
- `Ulasan` model ("ulasan" is Indonesian for "review") — long-form blog/article content with a rich editor, AI-assisted writing (`ai-write` API), `DRAFT/PUBLISHED` status, managed under `admin/ulasan/*` and rendered publicly at `r/[permalink]`. This is editorial content, not a product rating.

**AI/embedding pipeline**: `src/lib/embeddings.ts` calls OpenAI `text-embedding-3-small` to embed `name + description` into a `Float[]` column on `Product` at creation time. Recommendations (`api/recommendations/route.ts`) are computed **in application code** via cosine similarity (`src/lib/similarity.ts`) over up to 100 `ACTIVE` candidate products fetched per request — there is no pgvector/vector index (a `$queryRaw` pgvector approach is commented out in `productlist.tsx` as a known TODO). The `gpt-4.1-mini` vision prompt that auto-fills name/description/categories from a packaging photo lives in `src/lib/productdetect.ts` (shared by `api/product-detect` for the single-product create/edit form, and by `bulkcreateproducts.ts` for admin bulk upload). Image upload to Vercel Blob is likewise shared via `src/lib/blob.ts`.

**Admin bulk product upload** (`admin/products/bulk`): lets an admin/moderator upload many packaging photos at once — one photo per product, no review step. Each photo is compressed client-side, then the server action runs AI detection, uploads the image, generates the embedding, matches AI-suggested categories, slugifies+dedupes the name into a unique slug, and creates the product as `ACTIVE` immediately (consistent with admin-created products always being pre-approved).

**Barcode display/contribution**: the product detail page renders `Product.upc` as a scannable barcode image (`jsbarcode`, client-side, CODE128 format) plus the raw UPC text. If a product has no UPC yet, only a **signed-in** user sees a "scan to add" affordance (camera scan via `@zxing/browser`, same pattern as the barcode scanner in the product form/search bar); signed-out visitors see nothing there. `addProductUpc` (`src/app/actions/addproductupc.ts`) re-checks the session server-side and only writes if the product still has no UPC (avoids a race between two concurrent scans).

**Reports/flags**: `Report` model covers both product and review reports (`ReportType: PRODUCT|REVIEW`), resolved by admins via `resolvereport.ts` and the `admin/reports` page.

**Role model**: `Role` is `USER | ADMIN | MODERATOR`; every admin-gated page/action treats `ADMIN` and `MODERATOR` as equivalent (no distinct permission is currently reserved for `MODERATOR`).
