# BFG Framework — Client (Next.js)

Admin UI and storefront. Requires backend running (see repo root and server/README.md).

## Setup

```bash
npm install
cp .env.example .env.local   # or set NEXT_PUBLIC_API_URL in .env.local
npm run dev
```

Open http://localhost:3000. Set `NEXT_PUBLIC_API_URL` to your API base (e.g. `http://localhost:8000`).

## Scripts

- `npm run dev` — sync plugins + theme registry + Next dev server
- `npm run build` / `npm run start` — production build and start
