# Reliable Cron Notifier Setup (Every 2 Minutes)

GitHub Actions `schedule:` crons are heavily delayed/throttled (empirically running every 4–8 hours instead of every 5 minutes), and Vercel Hobby crons only run once per day (`0 0 * * *`). Because task and routine start reminders use a tight window, an external scheduler must call `/api/cron/notifications` every 2–5 minutes.

## Option A: Cloudflare Workers Cron (Free Tier, Recommended)

1. Install dependencies / authenticate Wrangler:
   ```bash
   cd workers/cron-notifier
   npx wrangler login
   ```
2. Set the same `CRON_SECRET` that is configured in Vercel:
   ```bash
   npx wrangler secret put CRON_SECRET
   ```
3. Deploy the Worker (`*/2 * * * *`):
   ```bash
   npx wrangler deploy
   ```

## Option B: cron-job.org (No CLI Needed, Free Tier)

1. Create a free cron job at <https://cron-job.org>.
2. **URL**: `https://slake-deadlines-met.vercel.app/api/cron/notifications`
3. **Schedule**: Every 2 minutes (or every 5 minutes).
4. **Execution Method**: `GET`
5. **Custom Header**:
   - Name: `Authorization`
   - Value: `Bearer <YOUR_VERCEL_CRON_SECRET>`
6. Enable failure alerts so HTTP `401`/`500` errors surface immediately.
