// Thin Resend client. https://resend.com/docs/api-reference/emails/send-email

export async function sendEmail(env, { to, subject, text, html }) {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured');
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM,
      to,
      subject,
      text,
      html,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`resend_send_failed: ${res.status} ${detail}`);
  }
  return res.json();
}
