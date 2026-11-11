/**
 * Reliable 2-minute Cron Notifier for Slake DeadlinesMet.
 * Triggers /api/cron/notifications on schedule so scheduled task and routine
 * pushes fire on time even when GitHub Actions scheduled cron is throttled.
 */

export default {
  async scheduled(_controller, env, _ctx) {
    await triggerNotifications(env);
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/trigger" && request.method === "POST") {
      try {
        const result = await triggerNotifications(env);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        worker: "slake-deadlinesmet-cron-notifier",
        targetUrlConfigured: Boolean(env.TARGET_URL),
        cronSecretConfigured: Boolean(env.CRON_SECRET),
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  },
};

async function triggerNotifications(env) {
  const targetUrl =
    env.TARGET_URL || "https://slake-deadlines-met.vercel.app/api/cron/notifications";
  if (!env.CRON_SECRET) {
    throw new Error("CRON_SECRET secret is not configured in Cloudflare Worker.");
  }

  const res = await fetch(targetUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${env.CRON_SECRET}`,
      "User-Agent": "slake-cloudflare-cron-notifier/1.0",
    },
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Cron endpoint returned HTTP ${res.status}: ${text}`);
  }

  console.log("Cron trigger result:", text);
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
