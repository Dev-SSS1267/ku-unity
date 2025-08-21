// Cloudflare Pages Functions API handler
export async function onRequest(context) {
  const { request, env } = context;
  
  // CORS 설정
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // OPTIONS 요청 처리
  if (request.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    // API 라우팅
    if (pathSegments[1] === 'user' && pathSegments[2] === 'login') {
      return handleLogin(request, env, corsHeaders);
    }
    
    if (pathSegments[1] === 'updatepagedata') {
      return handleUpdatePageData(request, env, corsHeaders);
    }
    
    return new Response('Not Found', { 
      status: 404,
      headers: corsHeaders 
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error.message 
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

async function handleLogin(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  const { username, password } = await request.json();
  
  // 간단한 하드코딩된 로그인 (보안상 실제 운영환경에서는 사용 금지)
  if (username === 'kuunity2025' && password === 'rjsrnreodbdwjs') {
    // JWT 토큰 생성 (여기서는 간단히 처리)
    const token = btoa(JSON.stringify({ username, exp: Date.now() + 86400000 }));
    
    return new Response(JSON.stringify({
      success: true,
      token
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  return new Response(JSON.stringify({
    success: false,
    message: 'Invalid credentials'
  }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

async function handleUpdatePageData(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  // 임시로 성공 응답 반환 (실제 구현 필요)
  return new Response(JSON.stringify({
    success: true,
    message: 'Data updated successfully'
  }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}
