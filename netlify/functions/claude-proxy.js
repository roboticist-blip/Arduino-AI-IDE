// netlify/functions/claude-proxy.js
// Serverless proxy for Anthropic API calls.
// Supports two modes:
//   1. Server-key mode  – ANTHROPIC_API_KEY set in Netlify env vars (operator pays)
//   2. Client-key mode  – user sends their own key in X-User-Api-Key header (user pays)

export async function handler(event) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // CORS preflight
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Api-Key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  // Resolve API key: server env var takes priority, else use the user-supplied header
  const serverKey = process.env.ANTHROPIC_API_KEY;
  const clientKey = event.headers['x-user-api-key'];
  const apiKey = serverKey || clientKey;

  if (!apiKey) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'No API key available. Please provide your Anthropic API key.',
      }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: `Proxy error: ${err.message}` }),
    };
  }
}
