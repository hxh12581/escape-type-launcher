// Cloudflare Pages Function — 代理 Coze 工作流 API，避免浏览器 CORS 限制
// Token 通过 Cloudflare Pages 环境变量 COZE_TOKEN 注入
const COZE_API = 'https://ws7jqgs82z.coze.site/run';

export async function onRequest(context) {
  const { request, env } = context;
  const token = env.COZE_TOKEN;

  if (!token) {
    const keys = Object.keys(env).join(', ');
    return new Response(JSON.stringify({
      error: 'COZE_TOKEN not configured',
      debug: `env keys available: ${keys || '(none)'}`,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Allow': 'POST' },
    });
  }

  try {
    const body = await request.json();

    const response = await fetch(COZE_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();

    return new Response(text, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
