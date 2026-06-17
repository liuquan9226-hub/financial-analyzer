/**
 * Cloudflare Worker — Anthropic API CORS Proxy
 *
 * 部署：将本文件内容粘贴到 Cloudflare Workers 编辑器，Save and Deploy
 * 然后把 Worker URL 填入财务分析工具「API设置」→「CORS 代理 URL」
 */

addEventListener('fetch', event => {
  event.respondWith(handle(event.request))
})

async function handle(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const apiKey = request.headers.get('x-api-key') || ''
  const body = await request.text()

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'pdfs-2024-09-25',
    },
    body: body,
  })

  const text = await resp.text()
  return new Response(text, {
    status: resp.status,
    headers: {
      'content-type': 'application/json',
      ...corsHeaders,
    },
  })
}
