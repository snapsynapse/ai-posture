// AI Posture Worker
// Routes:
//   POST   /api/newsletter           — capture email, send confirm mail
//   GET    /api/newsletter/confirm   — token-confirm subscription
//   GET    /healthz                  — liveness

import { handleNewsletterSubscribe, handleNewsletterConfirm } from './newsletter.js';
import { handleDeliver } from './deliver.js';

const ALLOWED_ORIGINS = new Set([
  'https://aiposture.org',
  'https://www.aiposture.org',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
]);

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : 'https://aiposture.org';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export function json(body, init = {}, origin = null) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(origin ? corsHeaders(origin) : {}),
      ...(init.headers || {}),
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname === '/healthz') {
      return json({ ok: true }, {}, origin);
    }

    if (url.pathname === '/api/newsletter' && request.method === 'POST') {
      return handleNewsletterSubscribe(request, env, origin);
    }

    if (url.pathname === '/api/newsletter/confirm' && request.method === 'GET') {
      return handleNewsletterConfirm(url, env);
    }

    if (url.pathname === '/api/deliver' && request.method === 'POST') {
      return handleDeliver(request, env, origin);
    }

    return json({ error: 'not_found' }, { status: 404 }, origin);
  },
};
