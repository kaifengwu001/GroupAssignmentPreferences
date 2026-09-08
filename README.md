# Section Pitch

A small site for taking project preferences from two class sections. Students
read the rules, pick their section, share a one-or-two sentence pitch, then
**rank** as many classmates as they like from a live-updating list. Rankings are
private — students never see each other's choices, only the instructor does.
The site closes itself at the published deadline.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The admin dashboard is at
http://localhost:3000/admin, password `letmein` (set in `.env.local`).

With no `DATABASE_URL` set, the app uses an in-memory store so it boots with
zero setup. **Data is lost every time the server restarts** — that mode is for
poking at the UI only.

## Screens

| Path       | Who      | What                                                     |
| ---------- | -------- | -------------------------------------------------------- |
| `/`        | everyone | Rules, key dates, how it works                            |
| `/join`    | students | Sign in: name, section, optional password                 |
| `/pitch`   | students | Write or edit the pitch                                   |
| `/section` | students | Live pitches from their section, ranked selection         |
| `/locked`  | everyone | Where all student routes go once closed                   |
| `/admin`   | you      | Lock switch, QR code, CSV downloads, per-section tables    |

## The two sections

`lib/sections.ts` is the single source of truth. Edit that list to change the
timetable; validation, display, and CSV export all follow.

The sections are fully isolated. A student only sees pitches from their own
section and can only rank people in it. Switching sections is allowed — sign in
again and pick the other one — but it clears every ranking they made *and* every
ranking of them, since those choices no longer apply.

## Ranked choices

Order is the whole point. Position 1 is a student's first choice, and the
`preferences` table stores a dense 1-based `rank` alongside each edge. The
client sends its full ordered list on every save and the server replaces the
set in a transaction, so saving is idempotent and ranks can never go sparse.

Students reorder with explicit up/down buttons rather than drag-and-drop, so it
works with a keyboard, a screen reader, and a thumb.

## How sign-in works

There is no email step. Identity rests on the name plus an optional password:

- Matching ignores case, spacing, and punctuation, so `ada lovelace`,
  `Ada  Lovelace`, and `ADA LOVELACE` are all the same student. The display
  name is whatever they typed first.
- A student may set a password at sign-in. Once set, it's required to get back
  in and edit.
- A name with no password signs in freely, and the first password supplied
  claims it. Set `ALLOW_PASSWORD_CLAIM=false` to turn that off.
- Set `SECTION_ROSTER` to restrict sign-in to a known list of names. This is
  the strongest option, and the roster's spelling becomes the display name.

## Closing time

Two things can close the app, and either is enough:

- **The deadline.** `CLOSES_AT` passes and the site locks itself. Nothing to
  remember on the day.
- **The switch.** `/admin` closes early, or reopens after the deadline. The
  stored override beats the deadline in both directions, so you can reopen for
  a straggler without a redeploy.

## Environment variables

See `.env.example`. Required in production:

- `DATABASE_URL` — Postgres connection string
- `SESSION_SECRET` — 32+ random characters, signs session cookies
- `ADMIN_PASSWORD` — guards `/admin`

Dates: `CLOSES_AT`, `RESULTS_AT`, `DISPLAY_TIMEZONE`. Optional:
`SECTION_TITLE`, `SECTION_ROSTER`, `ALLOW_PASSWORD_CLAIM`, `DATABASE_SSL`.

## Deploying to Vercel

1. Import the repo at [vercel.com/new](https://vercel.com/new).
2. Add a database: project → **Storage** → **Neon** (or any Postgres). Vercel
   sets `DATABASE_URL` automatically. Use the **pooled** connection string.
   Tables are created and migrated on first request.
3. Add the rest under **Settings → Environment Variables**:
   ```
   SESSION_SECRET=<openssl rand -base64 32>
   ADMIN_PASSWORD=<something only you know>
   CLOSES_AT=2026-09-17T23:59:00-07:00
   RESULTS_AT=2026-09-18T14:00:00-07:00
   ```
4. Redeploy so the variables take effect.
5. Open `/admin`. The QR panel there points at your live site — project it at
   the start of section.

## Getting the data out

`/admin` offers three CSVs, all UTF-8 with a BOM so Excel opens them cleanly.
Every one carries the section and the rank of each choice:

- **students** — one row per student, with their ranking in order plus
  `choice_1`, `choice_2`, `choice_3` broken out into their own columns. Start
  here.
- **pairs** — one row per choice, carrying its rank. Good for pivot tables or
  feeding a grouping script.
- **matrix** — one grid per section. Cells hold the rank, so `1` is a first
  choice and `0` is no choice.

## Layout

```
app/
  page.tsx            rules and key dates
  join/               sign-in with section picker
  pitch/              write the pitch
  section/            live board + ranked selection
  locked/             post-cutoff message
  admin/              instructor dashboard
  api/                route handlers, one file each
lib/
  sections.ts         the two sections; single source of truth
  store/              storage contract + Postgres and in-memory implementations
  services/           business logic (auth, pitch, preferences, lock, export)
  auth/               scrypt password hashing, signed-cookie sessions
  validation/         zod schemas for every request body
  client/             browser fetch wrapper and hooks
components/           UI primitives and feature components
```

Route handlers validate input, call a service, and return a
`{ ok, data, error }` envelope. Services own the rules and talk only to the
`Store` interface, so swapping Postgres for something else touches one file.
