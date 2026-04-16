// Allowed origins — add localhost for local dev
const ALLOWED = new Set([
  'https://old33bbg.com',
  'https://www.old33bbg.com',
  'https://cesardomingue.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
]);

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allow = ALLOWED.has(origin) ? origin : 'https://old33bbg.com';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

export function handleOptions(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }
  return null;
}

export function json(data: unknown, status = 200, req?: Request): Response {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (req) Object.assign(headers, corsHeaders(req));
  return new Response(JSON.stringify(data), { status, headers });
}
