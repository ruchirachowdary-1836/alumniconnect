# BVRITH Alumni Mentorship Portal

Next.js 16 alumni portal for BVRITH with:

- Google sign-in / sign-up through Clerk
- alumni and student profile claim flow based on imported Excel data
- mentorship request creation from student to alumni
- acceptance / rejection workflow on the alumni dashboard
- student email updates when alumni respond
- alumni email notifications when a new request is submitted

## Project location

`C:\Users\ruchi\Documents\Codex\2026-04-18-files-mentioned-by-the-user-decentralized\bvrith-alumni-portal`

## Stack

- Next.js App Router
- Clerk for authentication
- Prisma with SQLite for local development
- Resend for transactional email

## Environment setup

1. Copy `.env.example` to `.env`.
2. Fill in the Clerk keys.
3. In the Clerk dashboard, enable Google as a social connection.
4. Fill in `RESEND_API_KEY` and `EMAIL_FROM`.
5. Run `npm install`.
6. Run `npm run db:init`.
7. Run `npm run dev`.

## Google sign-in

This app uses Clerk for authentication. Google sign-in becomes active after you:

1. Create a Clerk application.
2. Add Google as a social provider in Clerk.
3. Paste the Clerk publishable and secret keys into `.env`.

## How onboarding works

- Alumni and student records are seeded from `placement_data_2022_26.xlsx`.
- A signed-in user claims a profile by selecting the matching roll number.
- Alumni can activate their mentor profile during onboarding.
- Only active alumni with an email address appear in the mentor directory.

## Email workflow

- Student submits mentorship request.
  The app emails the selected alumni mentor using Resend.
- Alumni accepts or rejects the request.
  The app emails the student with the decision and optional mentor note.

## Notes

- Local development uses SQLite with `file:./dev.db` inside the `prisma` directory.
- `npm run db:init` uses Node's built-in SQLite support because Prisma's SQLite `db push` can fail on some Windows setups even when the app code is fine.
- For Vercel production, you can replace SQLite with Neon Postgres by updating `DATABASE_URL` and Prisma datasource provider.
- The imported workbook did not include email addresses, so alumni must sign in and claim their profile before they can receive mentorship requests.
