/**
 * Cloudflare Worker — Anthropic API CORS Proxy
 *
 * 部署步骤：
 * 1. 登录 https://dash.cloudflare.com → Workers & Pages → Create application → Create Worker
 * 2. 将本文件全部内容粘贴到编辑器，替换掉原有代码，点击 Save and Deploy
 * 3. 复制 Worker 的 URL（格式：https://xxx.workers.dev）
 * 4. 在财务分析工具「API设置」→「CORS 代理 URL」中填入该 URL，保存
 *
 * 免费额度：每天 100,000 次请求
 * 安全说明：API Key 由浏览器通过 x-api-key 头传入，Worker 不存储任何密钥
 */

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Access-Control-Max-Age': '86400',
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });
  }

  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: { message: 'Missing x-api-key header' } }),
      { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  let body;
  try {
    body = await request.text();
  } catch (e) {
    return new Response(
      JSON.stringify({ error: { message: 'Failed to read request body' } }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  const upstream = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'pdfs-2024-09-25',
      'content-type': 'application/json',
    },
    body: body,
  });

  const responseBody = await upstream.text();
  return new Response(responseBody, {
    status: upstream.status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
