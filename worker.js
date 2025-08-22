// Cloudflare Workers용 D1 데이터베이스 핸들러
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
    // 로그인 API
    if (pathname === '/api/user/login' && request.method === 'POST') {
      return handleLogin(request, env, corsHeaders);
    }
    
    // 로그아웃 API
    if (pathname === '/api/user/logout' && request.method === 'POST') {
      return handleLogout(request, env, corsHeaders);
    }
    
    // 페이지 데이터 가져오기 API
    if (pathname === '/api/pagedata' && request.method === 'GET') {
      return getPageData(request, env, corsHeaders);
    }
    
    // 페이지 데이터 업데이트 API
    if (pathname === '/api/updatepagedata' && request.method === 'POST') {
      return updatePageData(request, env, corsHeaders);
    }
    
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
      JSON.stringify({ error: 'Internal Server Error', details: error.message }), 
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

async function handleLogin(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { username, password } = body;
    
    // D1 데이터베이스에서 사용자 확인
    const { results } = await env.DB.prepare(
      "SELECT * FROM users WHERE username = ? AND password = ?"
    ).bind(username, password).all();
    
    if (results.length > 0) {
      // 간단한 JWT 토큰 생성
      const token = btoa(JSON.stringify({
        username: username,
        timestamp: Date.now(),
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24시간
      }));
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Login successful',
        token: token,
        redirect: '/dashboard'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
          ...corsHeaders
        },
      });
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Invalid username or password' 
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Database error: ' + error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
    });
  }
}

async function handleLogout(request, env, corsHeaders) {
  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Logged out successfully' 
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'auth_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
      ...corsHeaders
    },
  });
}

async function getPageData(request, env, corsHeaders) {
  try {
    // 페이지 데이터 가져오기
    const pageData = await env.DB.prepare("SELECT * FROM pagedata WHERE id = 1").first();
    
    // 링크 데이터 가져오기
    const { results: linkData } = await env.DB.prepare(
      "SELECT * FROM linkdata WHERE active = 1 ORDER BY orderIndex"
    ).all();
    
    // 소셜 데이터 가져오기
    const { results: socialData } = await env.DB.prepare(
      "SELECT * FROM socialdata WHERE active = 1 ORDER BY orderIndex"
    ).all();
    
    return new Response(JSON.stringify({
      success: true,
      pageData: pageData || {},
      linkData: linkData || [],
      socialData: socialData || []
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Database error: ' + error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
    });
  }
}

async function updatePageData(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { handlerText, handlerDescription, bgColor, accentColor } = body;
    
    // 페이지 데이터 업데이트
    await env.DB.prepare(`
      UPDATE pagedata SET 
        handlerText = ?, 
        handlerDescription = ?, 
        bgColor = ?, 
        accentColor = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).bind(handlerText, handlerDescription, bgColor, accentColor).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Page data updated successfully'
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Database error: ' + error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
    });
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

  // 메인 페이지 (링크트리) - D1에서 데이터 가져오기
  return getMainPage(env);
}

async function getMainPage(env) {
  try {
    // D1에서 데이터 가져오기
    const pageData = await env.DB.prepare("SELECT * FROM pagedata WHERE id = 1").first();
    const { results: linkData } = await env.DB.prepare(
      "SELECT * FROM linkdata WHERE active = 1 ORDER BY orderIndex"
    ).all();
    const { results: socialData } = await env.DB.prepare(
      "SELECT * FROM socialdata WHERE active = 1 ORDER BY orderIndex"
    ).all();

    // 기본값 설정
    const data = pageData || {
      handlerText: 'KU Unity',
      handlerDescription: 'Welcome to my unified link tree',
      bgColor: '#ffffff',
      accentColor: '#007bff',
      handlerFontColor: '#000000',
      handlerDescriptionFontColor: '#666666',
      fontFamily: 'Arial',
      footerEnabled: true,
      footerText: 'Powered by Linkin ⚡',
      footerTextColor: '#999999'
    };

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.handlerText} - Link Tree</title>
    <meta name="description" content="${data.handlerDescription}">
    <meta property="og:title" content="${data.handlerText}">
    <meta property="og:description" content="${data.handlerDescription}">
    <meta property="og:type" content="website">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: '${data.fontFamily}', sans-serif;
            background: ${data.bgColor};
            background: linear-gradient(135deg, ${data.bgColor} 0%, ${data.accentColor}20 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${data.handlerFontColor};
            padding: 20px;
        }
        .container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 40px;
            max-width: 400px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
        }
        .avatar {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            margin: 0 auto 20px;
            background: linear-gradient(45deg, ${data.accentColor} 0%, ${data.accentColor}80 100%);
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
            color: ${data.handlerFontColor};
        }
        .handler-description {
            font-size: 16px;
            color: ${data.handlerDescriptionFontColor};
            margin: 10px 0 30px;
            line-height: 1.5;
        }
        .link-item {
            display: block;
            background: #f8f9fa;
            border: 2px solid ${data.accentColor}30;
            border-radius: 15px;
            padding: 15px 20px;
            margin: 12px 0;
            text-decoration: none;
            color: ${data.handlerFontColor};
            font-weight: 500;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }
        .link-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            background: ${data.accentColor}10;
            border-color: ${data.accentColor};
        }
        .social-links {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin: 20px 0;
        }
        .social-item {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 50px;
            height: 50px;
            background: ${data.accentColor}20;
            border-radius: 50%;
            text-decoration: none;
            color: ${data.accentColor};
            font-weight: bold;
            transition: all 0.3s ease;
        }
        .social-item:hover {
            background: ${data.accentColor};
            color: white;
            transform: scale(1.1);
        }
        .footer {
            margin-top: 30px;
            color: ${data.footerTextColor};
            font-size: 14px;
            display: ${data.footerEnabled ? 'block' : 'none'};
        }
        .admin-link {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${data.accentColor};
            color: white;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            font-size: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        }
        .admin-link:hover {
            transform: scale(1.1);
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }
        .status {
            background: #e8f5e8;
            color: #27ae60;
            padding: 8px 12px;
            border-radius: 20px;
            margin: 15px 0;
            font-size: 12px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="avatar">🌟</div>
        <div class="handler-text">${data.handlerText}</div>
        <div class="handler-description">${data.handlerDescription}</div>
        <div class="status">🚀 Powered by Cloudflare D1</div>
        
        ${linkData.map(link => 
          `<a href="${link.url}" class="link-item" target="_blank" rel="noopener">${link.title}</a>`
        ).join('')}
        
        ${socialData.length > 0 ? `
        <div class="social-links">
          ${socialData.map(social => 
            `<a href="${social.url}" class="social-item" target="_blank" rel="noopener" title="${social.platform}">
              ${social.platform.charAt(0).toUpperCase()}
            </a>`
          ).join('')}
        </div>
        ` : ''}
        
        <div class="footer">${data.footerText}</div>
    </div>
    
    <a href="/admin" class="admin-link" title="Admin Panel">⚙️</a>
    
    <script>
        // 페이지 로드 시 데이터 새로고침
        console.log('KU Unity Link Tree - Powered by Cloudflare D1');
        console.log('Links: ${linkData.length}, Social: ${socialData.length}');
    </script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=300', // 5분 캐시
      },
    });
  } catch (error) {
    // 오류 시 기본 페이지 반환
    return getMainPageFallback(error);
  }
}

function getMainPageFallback(error) {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KU Unity - Link Tree</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
        .container { background: white; padding: 40px; border-radius: 20px; max-width: 400px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .error { color: #e74c3c; margin: 20px 0; }
        .retry-btn { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌟 KU Unity</h1>
        <p>Welcome to my link tree</p>
        <div class="error">⚠️ Database connection error</div>
        <p>Please try again later or contact the administrator.</p>
        <button class="retry-btn" onclick="location.reload()">Retry</button>
        <p><a href="/admin">Admin Panel</a></p>
        <small>Error: ${error.message}</small>
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
        input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; box-sizing: border-box; }
        button { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; }
        button:hover { background: #0056b3; }
        button:disabled { background: #ccc; cursor: not-allowed; }
        .back-link { display: block; text-align: center; margin-top: 20px; color: #007bff; text-decoration: none; }
        .message { padding: 10px; margin: 10px 0; border-radius: 5px; display: none; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .loading { text-align: center; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Admin Login</h1>
        <div id="message" class="message"></div>
        <form id="loginForm">
            <div class="form-group">
                <label for="username">Username:</label>
                <input type="text" id="username" name="username" placeholder="Enter username" required>
            </div>
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" placeholder="Enter password" required>
            </div>
            <button type="submit" id="loginBtn">Login</button>
        </form>
        <a href="/" class="back-link">← Back to Home</a>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const loginBtn = document.getElementById('loginBtn');
            const messageDiv = document.getElementById('message');
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // 로딩 상태
            loginBtn.disabled = true;
            loginBtn.textContent = 'Logging in...';
            messageDiv.style.display = 'none';
            
            try {
                const response = await fetch('/api/user/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    messageDiv.className = 'message success';
                    messageDiv.textContent = '로그인 성공! 대시보드로 이동합니다...';
                    messageDiv.style.display = 'block';
                    
                    // 토큰 저장
                    if (data.token) {
                        localStorage.setItem('auth_token', data.token);
                    }
                    
                    // 대시보드로 리다이렉트
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1500);
                } else {
                    messageDiv.className = 'message error';
                    messageDiv.textContent = data.message || '로그인에 실패했습니다.';
                    messageDiv.style.display = 'block';
                }
            } catch (error) {
                messageDiv.className = 'message error';
                messageDiv.textContent = '서버 오류가 발생했습니다.';
                messageDiv.style.display = 'block';
            } finally {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Login';
            }
        });
        
        // 페이지 로드시 이미 로그인되어 있는지 확인
        window.addEventListener('load', function() {
            const token = localStorage.getItem('auth_token');
            if (token) {
                try {
                    const payload = JSON.parse(atob(token));
                    if (payload.expires > Date.now()) {
                        // 토큰이 유효하면 대시보드로 리다이렉트
                        window.location.href = '/dashboard';
                    }
                } catch (error) {
                    // 토큰이 유효하지 않으면 제거
                    localStorage.removeItem('auth_token');
                }
            }
        });
    </script>
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
    <title>Dashboard - KU Unity</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 1000px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        h1 { color: #333; margin: 0; }
        .logout-btn { background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; }
        .logout-btn:hover { background: #c82333; }
        .back-link { color: #007bff; text-decoration: none; }
        .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .user-info { background: #e9ecef; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .hidden { display: none; }
        .loading { text-align: center; padding: 50px; color: #666; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
        .form-group input, .form-group textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        .btn { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-right: 10px; }
        .btn:hover { background: #0056b3; }
        .btn-success { background: #28a745; }
        .btn-success:hover { background: #218838; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
        .message { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .stats { display: flex; gap: 20px; }
        .stat-card { flex: 1; background: #007bff; color: white; padding: 20px; border-radius: 10px; text-align: center; }
        .stat-number { font-size: 32px; font-weight: bold; }
        .stat-label { font-size: 14px; opacity: 0.9; }
    </style>
</head>
<body>
    <div id="loading" class="loading">
        <h2>인증 확인 중...</h2>
    </div>
    
    <div id="dashboard" class="container hidden">
        <div class="header">
            <a href="/" class="back-link">← Back to Home</a>
            <button id="logoutBtn" class="logout-btn">Logout</button>
        </div>
        
        <h1>📊 KU Unity Dashboard</h1>
        
        <div class="user-info">
            <strong>사용자:</strong> <span id="username">kuunity2025</span><br>
            <strong>로그인 시간:</strong> <span id="loginTime">-</span><br>
            <strong>상태:</strong> <span style="color: #28a745;">✅ 인증됨 (Cloudflare D1)</span>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number" id="linkCount">-</div>
                <div class="stat-label">활성 링크</div>
            </div>
            <div class="stat-card" style="background: #28a745;">
                <div class="stat-number" id="socialCount">-</div>
                <div class="stat-label">소셜 링크</div>
            </div>
            <div class="stat-card" style="background: #ffc107; color: #212529;">
                <div class="stat-number">24/7</div>
                <div class="stat-label">업타임</div>
            </div>
        </div>
        
        <div id="message" class="message" style="display: none;"></div>
        
        <div class="grid">
            <div class="card">
                <h3>📝 페이지 설정</h3>
                <form id="pageDataForm">
                    <div class="form-group">
                        <label for="handlerText">이름/제목:</label>
                        <input type="text" id="handlerText" name="handlerText" required>
                    </div>
                    <div class="form-group">
                        <label for="handlerDescription">설명:</label>
                        <textarea id="handlerDescription" name="handlerDescription" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="bgColor">배경색:</label>
                        <input type="color" id="bgColor" name="bgColor">
                    </div>
                    <div class="form-group">
                        <label for="accentColor">강조색:</label>
                        <input type="color" id="accentColor" name="accentColor">
                    </div>
                    <button type="submit" class="btn btn-success">저장</button>
                </form>
            </div>
            
            <div class="card">
                <h3>📊 데이터 현황</h3>
                <div id="dataStatus">
                    <p><strong>페이지 데이터:</strong> <span id="pageDataStatus">로딩중...</span></p>
                    <p><strong>링크 데이터:</strong> <span id="linkDataStatus">로딩중...</span></p>
                    <p><strong>소셜 데이터:</strong> <span id="socialDataStatus">로딩중...</span></p>
                    <p><strong>마지막 업데이트:</strong> <span id="lastUpdate">-</span></p>
                </div>
                <button onclick="loadData()" class="btn">데이터 새로고침</button>
                <button onclick="window.open('/', '_blank')" class="btn">미리보기</button>
            </div>
        </div>
        
        <div class="card">
            <h3>🔧 시스템 정보</h3>
            <ul>
                <li><strong>데이터베이스:</strong> Cloudflare D1</li>
                <li><strong>호스팅:</strong> Cloudflare Workers</li>
                <li><strong>성능:</strong> 엣지 컴퓨팅으로 전 세계 빠른 로딩</li>
                <li><strong>보안:</strong> HTTPS, CORS 지원</li>
                <li><strong>동기화:</strong> 실시간 데이터 동기화</li>
            </ul>
        </div>
    </div>

    <div id="unauthorized" class="container hidden">
        <div class="card">
            <h1>🔒 접근 거부</h1>
            <p>이 페이지에 접근하려면 로그인이 필요합니다.</p>
            <a href="/admin" class="btn">로그인하기</a>
        </div>
    </div>

    <script>
        let currentData = {};

        // 인증 확인
        function checkAuth() {
            const token = localStorage.getItem('auth_token');
            
            if (!token) {
                showUnauthorized();
                return false;
            }
            
            try {
                const payload = JSON.parse(atob(token));
                
                if (payload.expires <= Date.now()) {
                    localStorage.removeItem('auth_token');
                    showUnauthorized();
                    return false;
                }
                
                const loginDate = new Date(payload.timestamp);
                document.getElementById('loginTime').textContent = loginDate.toLocaleString();
                
                showDashboard();
                loadData();
                return true;
            } catch (error) {
                localStorage.removeItem('auth_token');
                showUnauthorized();
                return false;
            }
        }
        
        function showDashboard() {
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
            document.getElementById('unauthorized').classList.add('hidden');
        }
        
        function showUnauthorized() {
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('dashboard').classList.add('hidden');
            document.getElementById('unauthorized').classList.remove('hidden');
        }
        
        // 데이터 로드
        async function loadData() {
            try {
                const response = await fetch('/api/pagedata');
                const data = await response.json();
                
                if (data.success) {
                    currentData = data;
                    updateUI(data);
                    showMessage('데이터를 성공적으로 로드했습니다.', 'success');
                } else {
                    showMessage('데이터 로드 실패: ' + data.message, 'error');
                }
            } catch (error) {
                showMessage('서버 오류: ' + error.message, 'error');
            }
        }
        
        // UI 업데이트
        function updateUI(data) {
            // 통계 업데이트
            document.getElementById('linkCount').textContent = data.linkData?.length || 0;
            document.getElementById('socialCount').textContent = data.socialData?.length || 0;
            
            // 상태 업데이트
            document.getElementById('pageDataStatus').textContent = data.pageData ? '✅ 정상' : '❌ 오류';
            document.getElementById('linkDataStatus').textContent = \`✅ \${data.linkData?.length || 0}개\`;
            document.getElementById('socialDataStatus').textContent = \`✅ \${data.socialData?.length || 0}개\`;
            document.getElementById('lastUpdate').textContent = new Date().toLocaleString();
            
            // 폼 데이터 업데이트
            if (data.pageData) {
                document.getElementById('handlerText').value = data.pageData.handlerText || '';
                document.getElementById('handlerDescription').value = data.pageData.handlerDescription || '';
                document.getElementById('bgColor').value = data.pageData.bgColor || '#ffffff';
                document.getElementById('accentColor').value = data.pageData.accentColor || '#007bff';
            }
        }
        
        // 메시지 표시
        function showMessage(text, type) {
            const messageDiv = document.getElementById('message');
            messageDiv.className = \`message \${type}\`;
            messageDiv.textContent = text;
            messageDiv.style.display = 'block';
            
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
        
        // 페이지 데이터 저장
        document.getElementById('pageDataForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            try {
                const response = await fetch('/api/updatepagedata', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showMessage('페이지 데이터가 성공적으로 저장되었습니다!', 'success');
                    setTimeout(loadData, 1000);
                } else {
                    showMessage('저장 실패: ' + result.message, 'error');
                }
            } catch (error) {
                showMessage('서버 오류: ' + error.message, 'error');
            }
        });
        
        // 로그아웃
        document.getElementById('logoutBtn').addEventListener('click', async function() {
            try {
                await fetch('/api/user/logout', { method: 'POST' });
            } catch (error) {
                console.error('Logout request failed:', error);
            }
            
            localStorage.removeItem('auth_token');
            window.location.href = '/admin';
        });
        
        // 페이지 로드시 인증 확인
        window.addEventListener('load', function() {
            setTimeout(checkAuth, 500);
        });
    </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
    },
  });
}
