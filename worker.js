// Cloudflare Workers용 간단한 핸들러
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS 헤더 설정
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // OPTIONS 요청 처리 (CORS 프리플라이트)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // API 라우트 처리
    if (url.pathname.startsWith('/api/')) {
      return handleApiRoute(request, env, url, corsHeaders);
    }

    // 메인 페이지 처리
    return handlePageRoute(request, env, url);
  },
};

async function handleApiRoute(request, env, url, corsHeaders) {
  const { pathname } = url;
  
  try {
    // 기본 API 응답
    const response = {
      success: false,
      message: 'API endpoint under construction',
      endpoint: pathname,
      method: request.method
    };
    
    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
}

async function handlePageRoute(request, env, url) {
  // 관리자 페이지
  if (url.pathname === '/admin') {
    return getAdminPage();
  }
  
  // 대시보드 페이지
  if (url.pathname === '/dashboard') {
    return getDashboardPage();
  }

  // 메인 페이지 (링크트리)
  return getMainPage();
}

function getMainPage() {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demo User - Link Tree</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .avatar {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            margin: 0 auto 20px;
            background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 50px;
            color: white;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .handler-text {
            font-size: 28px;
            font-weight: bold;
            margin: 20px 0 10px;
            color: #2c3e50;
        }
        .handler-description {
            font-size: 16px;
            color: #7f8c8d;
            margin: 10px 0 30px;
            line-height: 1.5;
        }
        .link-item {
            display: block;
            background: #f8f9fa;
            border: none;
            border-radius: 15px;
            padding: 15px 20px;
            margin: 10px 0;
            text-decoration: none;
            color: #2c3e50;
            font-weight: 500;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }
        .link-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            background: #e9ecef;
        }
        .footer {
            margin-top: 30px;
            color: #bdc3c7;
            font-size: 14px;
        }
        .status {
            background: #e8f5e8;
            color: #27ae60;
            padding: 10px;
            border-radius: 10px;
            margin: 20px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="avatar">👤</div>
        <div class="handler-text">Demo User</div>
        <div class="handler-description">Welcome to my link tree</div>
        <div class="status">🚀 Powered by Cloudflare Workers</div>
        
        <a href="#" class="link-item">🌐 My Website</a>
        <a href="#" class="link-item">📧 Contact Me</a>
        <a href="#" class="link-item">💼 Portfolio</a>
        <a href="/admin" class="link-item">⚙️ Admin Panel</a>
        
        <div class="footer">Powered by Linkin ⚡</div>
    </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
    },
  });
}

function getAdminPage() {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Linkin</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        h1 { text-align: center; color: #333; margin-bottom: 30px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; color: #555; }
        input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; }
        button { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .back-link { display: block; text-align: center; margin-top: 20px; color: #007bff; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Admin Login</h1>
        <form>
            <div class="form-group">
                <label for="username">Username:</label>
                <input type="text" id="username" placeholder="Enter username">
            </div>
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" placeholder="Enter password">
            </div>
            <button type="submit">Login</button>
        </form>
        <a href="/" class="back-link">← Back to Home</a>
    </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
    },
  });
}

function getDashboardPage() {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Linkin</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #333; margin-bottom: 30px; }
        .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .back-link { color: #007bff; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <a href="/" class="back-link">← Back to Home</a>
        <h1>📊 Dashboard</h1>
        <div class="card">
            <h3>Welcome to Dashboard</h3>
            <p>This is where you can manage your link tree settings.</p>
            <p><strong>Status:</strong> Running on Cloudflare Workers ⚡</p>
        </div>
    </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
    },
  });
}
