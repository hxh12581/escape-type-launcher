// Cloudflare Pages Function — 代理 Coze 工作流 API，避免浏览器 CORS 限制
const COZE_API = 'https://ws7jqgs82z.coze.site/run';
const COZE_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjVmZjdiZDFhLTVmNDUtNGY4Mi04ZTg1LWQ4ZWQwNGFlN2NhNiJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbImk2OUo1U1YzTENsVDhIdU01SHVINHNQUXZJVXBubEQ4Il0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzgyOTYwNDQxLCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NjU3NzU0ODQzOTgwNzU5MDk0Iiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NjU3NzU2Nzg3NDM2NjgzMzE2In0.gX2ifvUaHb_d1r9RxqHcNNpXx99JkJonOy3RZZ2UXRsgZ-_HtIeKq-wFdmaUXQyb-gVhRTBXJm0cF_MaST2TbYto5yZhxd5MyVa1mocm5GRZ4_OsjYXgZtMwO79Hjj0eAzc5bw5dQfLv_cAFM3UpYNxgw0BJ1-J9BMB1Z5w6NXXKkCoSiF_tASLuhvB9VoCYArIm_WgCQynhHDa8IFfCq7wXw1kDgaJp2AFPYPt0jt8BZxWtElBTIyBaBK-e4VlS1xQN73pkxDOcit51MRTlY3ZtX_vl9Yzk77Pa_mUm2jOXvyQWvPPuRZWVTnzsQqMtsNHjtndM4ktCDpPwqirQGA';

export async function onRequest(context) {
  const { request } = context;

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
        'Authorization': `Bearer ${COZE_TOKEN}`,
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
