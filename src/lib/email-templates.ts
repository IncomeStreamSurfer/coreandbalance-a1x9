const BRAND_NAME = import.meta.env.BRAND_NAME ?? process.env.BRAND_NAME ?? "Core & Balance Pilates";
const BRAND_ACCENT = "#b5563a";
const SITE_URL = (import.meta.env.PUBLIC_SITE_URL ?? process.env.PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

function layout(content: string, preheader = ""): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { margin:0; padding:0; background:#f7f3ec; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif; color:#211f1a; }
  .preheader { display:none !important; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; }
  .container { max-width:560px; margin:0 auto; padding:32px 24px; }
  .card { background:#fff; border:1px solid #e4dbc9; border-radius:12px; padding:32px; }
  h1 { font-family: Georgia, 'Times New Roman', serif; font-size:28px; line-height:1.2; margin:0 0 16px; letter-spacing:-0.01em; }
  p { font-size:15px; line-height:1.6; margin:0 0 16px; color:#3a3a3a; }
  .btn { display:inline-block; background:${BRAND_ACCENT}; color:#fff !important; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; }
  .muted { color:#8a8a8a; font-size:13px; line-height:1.5; }
  .dot { display:inline-block; width:8px; height:8px; border-radius:50%; background:${BRAND_ACCENT}; margin-right:8px; vertical-align:middle; }
  a { color: ${BRAND_ACCENT}; }
  table.details td { padding: 4px 0; font-size: 14px; }
</style></head><body>
<span class="preheader">${preheader}</span>
<div class="container">
  <div style="margin-bottom:24px;"><span class="dot"></span><strong style="font-size:18px;">${BRAND_NAME}</strong></div>
  <div class="card">${content}</div>
  <p class="muted" style="text-align:center; margin-top:24px;">
    <a href="${SITE_URL}">${SITE_URL.replace(/^https?:\/\//, "")}</a>
  </p>
</div>
</body></html>`;
}

export function bookingConfirmationHtml(args: {
  className: string;
  instructorName: string;
  startTime: string;
  location: string;
  spots: number;
  amount: string;
  currency: string;
  bookingId: string;
}) {
  return layout(`
    <h1>You're booked</h1>
    <p>Thanks for booking with ${BRAND_NAME} — here's your confirmation.</p>
    <table class="details" width="100%">
      <tr><td><strong>Class:</strong></td><td>${args.className}</td></tr>
      <tr><td><strong>Instructor:</strong></td><td>${args.instructorName}</td></tr>
      <tr><td><strong>When:</strong></td><td>${args.startTime}</td></tr>
      <tr><td><strong>Where:</strong></td><td>${args.location}</td></tr>
      <tr><td><strong>Spots:</strong></td><td>${args.spots}</td></tr>
      <tr><td><strong>Paid:</strong></td><td>${args.currency} ${args.amount}</td></tr>
      <tr><td><strong>Confirmation #:</strong></td><td>${args.bookingId}</td></tr>
    </table>
    <p class="muted" style="margin-top:16px;">Need to reschedule? Reply to this email or call us at least 12 hours before class.</p>
  `, `Booking confirmed — ${args.className} on ${args.startTime}`);
}

export function contactAckHtml({ name }: { name: string }) {
  return layout(`
    <h1>Got your message</h1>
    <p>Hey ${name} — thanks for reaching out to ${BRAND_NAME}. We read every message and reply within 1 business day.</p>
  `, "We got your message");
}

export function magicLinkHtml({ loginUrl }: { loginUrl: string }) {
  return layout(`
    <h1>Your sign-in link</h1>
    <p>Click the button below to sign in to the studio admin. This link expires in 15 minutes and can only be used once.</p>
    <p><a class="btn" href="${loginUrl}">Sign in to ${BRAND_NAME}</a></p>
    <p class="muted">If you didn't request this, you can safely ignore this email.</p>
  `, `Sign in to ${BRAND_NAME}`);
}
