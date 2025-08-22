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
    // 로그인 API
    if (pathname === '/api/user/login' && request.method === 'POST') {
      return handleLogin(request, env, corsHeaders);
    }
    
    // 로그아웃 API
    if (pathname === '/api/user/logout' && request.method === 'POST') {
      return handleLogout(request, env, corsHeaders);
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

async function handleLogin(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { username, password } = body;
    
    // 간단한 인증 (실제로는 데이터베이스나 환경변수에서 확인)
    const validUsername = 'kuunity2025';
    const validPassword = 'rjsrnreodbdwjs';
    
    if (username === validUsername && password === validPassword) {
      // 간단한 JWT 토큰 생성 (실제로는 더 안전한 방법 사용)
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
      message: 'Invalid request format' 
    }), {
      status: 400,
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
    <title>Dashboard - Linkin</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #333; margin-bottom: 30px; }
        .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .back-link { color: #007bff; text-decoration: none; }
        .logout-btn { background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; float: right; }
        .logout-btn:hover { background: #c82333; }
        .user-info { background: #e9ecef; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .hidden { display: none; }
        .loading { text-align: center; padding: 50px; color: #666; }
    </style>
</head>
<body>
    <div id="loading" class="loading">
        <h2>인증 확인 중...</h2>
    </div>
    
    <div id="dashboard" class="container hidden">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <a href="/" class="back-link">← Back to Home</a>
            <button id="logoutBtn" class="logout-btn">Logout</button>
        </div>
        
        <h1>📊 Dashboard</h1>
        
        <div class="user-info">
            <strong>사용자:</strong> <span id="username">kuunity2025</span><br>
            <strong>로그인 시간:</strong> <span id="loginTime">-</span><br>
            <strong>상태:</strong> <span style="color: #28a745;">✅ 인증됨</span>
        </div>
        
        <div class="card">
            <h3>Welcome to Dashboard</h3>
            <p>이곳에서 링크트리 설정을 관리할 수 있습니다.</p>
            <p><strong>상태:</strong> Running on Cloudflare Workers ⚡</p>
        </div>
        
        <div class="card">
            <h3>🔧 관리 기능</h3>
            <ul>
                <li>링크 추가/편집/삭제</li>
                <li>소셜 미디어 링크 관리</li>
                <li>페이지 디자인 설정</li>
                <li>사용자 정보 변경</li>
            </ul>
        </div>
    </div>

    <div id="unauthorized" class="container hidden">
        <div class="card">
            <h1>🔒 접근 거부</h1>
            <p>이 페이지에 접근하려면 로그인이 필요합니다.</p>
            <a href="/admin" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">로그인하기</a>
        </div>
    </div>

    <script>
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
                
                // 로그인 시간 표시
                const loginDate = new Date(payload.timestamp);
                document.getElementById('loginTime').textContent = loginDate.toLocaleString();
                
                showDashboard();
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
        
        // 로그아웃 처리
        document.getElementById('logoutBtn').addEventListener('click', async function() {
            try {
                await fetch('/api/user/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
            } catch (error) {
                console.error('Logout request failed:', error);
            }
            
            localStorage.removeItem('auth_token');
            window.location.href = '/admin';
        });
        
        // 페이지 로드시 인증 확인
        window.addEventListener('load', function() {
            setTimeout(checkAuth, 500); // 로딩 효과를 위한 지연
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
