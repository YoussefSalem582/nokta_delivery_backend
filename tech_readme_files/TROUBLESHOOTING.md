# Troubleshooting

## API won't start

- Check `DATABASE_URL` and Redis host in `.env`
- Run `docker compose up -d postgres redis`
- Run `npm run prisma:generate` after schema changes

## Prisma migrate fails

- Ensure Postgres is reachable
- Reset dev DB only when safe: `npx prisma migrate reset` (destroys data)

## Flutter app can't reach API

- Android emulator: use `http://10.0.2.2:3000/api`
- Physical device: use machine LAN IP
- Set Flutter `--dart-define=API_BASE_URL=...`

## Firebase notifications not sending

- Configure `FIREBASE_*` env vars from `.env.example`
- Without Firebase, core API still runs; push queue may log errors

## Swagger 404

- URL is `http://localhost:3000/api/docs` (includes global prefix)
