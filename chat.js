// Cloudflare Pages Function: /api/chat
// Proxies chat requests to NVIDIA's OpenAI-compatible endpoint server-to-server,
// so the browser never hits CORS restrictions.

export async function onRequestPost(context) {
  const { request } = context;

  let body;
  try {
    body = await request.text();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Could not read request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  let upstream;
  try {
    upstream = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader
      },
      body
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Upstream request failed", detail: String(e) }), {
      status: 502,
      headers: { "Content-Type": "application/json" }
    });
  }

  const data = await upstream.text();
  return new Response(data, {
    status: upstream.status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    }
  });
}
