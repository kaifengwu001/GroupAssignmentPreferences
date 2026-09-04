# Section Pitch

A small site for taking project preferences from a section. Students sign in
with their name, share a one-or-two sentence pitch, then pick as many
classmates as they like from a live-updating list. Choices are private —
students never see each other's selections, only the instructor does. When you
lock it, sign-in closes and the site says "preferences have been locked in".

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

## The three screens

| Path      | Who      | What                                                        |
| --------- | -------- | ----------------------------------------------------------- |
| `/`       | students | Sign in with a name, optional password                      |
| `/pitch`  | students | Write or edit the pitch                                     |
| `/section`| students | Live pitches from everyone, multi-select, autosaves         |
| `/admin`  | you      | Lock switch, QR code, CSV downloads, response table         |
| `/locked` | everyone | Where all student routes go once locked                     |

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

## Environment variables

See `.env.example`. Required in production:

- `DATABASE_URL` — Postgres connection string
- `SESSION_SECRET` — 32+ random characters, signs session cookies
- `ADMIN_PASSWORD` — guards `/admin`

Optional: `SECTION_TITLE`, `SECTION_ROSTER`, `ALLOW_PASSWORD_CLAIM`.

## Deploying to Vercel

1. Push this repo to GitHub, then import it at
   [vercel.com/new](https://vercel.com/new).
2. Add a database: project → **Storage** → **Neon** (or any Postgres). Vercel
   sets `DATABASE_URL` automatically. The free tier is far more than a section
   needs. Tables are created on first request.
3. Add the other two variables under **Settings → Environment Variables**:
   ```
   SESSION_SECRET=<openssl rand -base64 32>
   ADMIN_PASSWORD=<something only you know>
   ```
4. Redeploy so the variables take effect.
5. Open `/admin` on the deployed URL. The QR code panel there points at your
   live site — project it at the start of section.

## Getting the data out

`/admin` offers three CSVs, all UTF-8 with a BOM so Excel opens them cleanly:

- **students** — one row per student: pitch, who they picked, who picked them,
  and mutual matches. Start here.
- **pairs** — one row per choice, with a `mutual` flag. Good for pivot tables
  or feeding a grouping script.
- **matrix** — every student against every other, `1`/`0`. Quickest to eyeball
  for clusters.

## Layout

```
app/
  page.tsx            sign-in
  pitch/              write the pitch
  section/            live board + selection
  locked/             post-cutoff message
  admin/              instructor dashboard
  api/                route handlers, one file each
lib/
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
