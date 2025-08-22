-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 페이지 데이터 테이블
CREATE TABLE IF NOT EXISTS pagedata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    handlerText TEXT NOT NULL,
    handlerDescription TEXT,
    avatarUrl TEXT,
    bgColor TEXT DEFAULT '#ffffff',
    accentColor TEXT DEFAULT '#000000',
    handlerFontColor TEXT DEFAULT '#000000',
    handlerDescriptionFontColor TEXT DEFAULT '#666666',
    fontFamily TEXT DEFAULT 'Arial',
    footerEnabled BOOLEAN DEFAULT TRUE,
    footerText TEXT DEFAULT 'Powered by Linkin',
    footerTextColor TEXT DEFAULT '#999999',
    active BOOLEAN DEFAULT TRUE,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 링크 데이터 테이블
CREATE TABLE IF NOT EXISTS linkdata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    orderIndex INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 소셜 데이터 테이블
CREATE TABLE IF NOT EXISTS socialdata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    orderIndex INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 기본 사용자 데이터 삽입
INSERT OR REPLACE INTO users (id, username, password) 
VALUES (1, 'kuunity2025', 'rjsrnreodbdwjs');

-- 기본 페이지 데이터 삽입
INSERT OR REPLACE INTO pagedata (
    id, handlerText, handlerDescription, avatarUrl, 
    bgColor, accentColor, handlerFontColor, handlerDescriptionFontColor,
    fontFamily, footerEnabled, footerText, footerTextColor, active
) VALUES (
    1, 'KU Unity', 'Welcome to my unified link tree', '/images/avatar.jpg',
    '#ffffff', '#007bff', '#000000', '#666666',
    'Arial', TRUE, 'Powered by Linkin ⚡', '#999999', TRUE
);

-- 기본 링크 데이터 삽입
INSERT OR REPLACE INTO linkdata (id, title, url, orderIndex, active) VALUES
(1, '🌐 Official Website', 'https://ku-unity.example.com', 1, TRUE),
(2, '📧 Contact Us', 'mailto:contact@ku-unity.com', 2, TRUE),
(3, '💼 Portfolio', 'https://portfolio.ku-unity.com', 3, TRUE),
(4, '📱 Mobile App', 'https://app.ku-unity.com', 4, TRUE);

-- 기본 소셜 데이터 삽입
INSERT OR REPLACE INTO socialdata (id, platform, url, orderIndex, active) VALUES
(1, 'GitHub', 'https://github.com/ku-unity', 1, TRUE),
(2, 'Twitter', 'https://twitter.com/ku_unity', 2, TRUE),
(3, 'LinkedIn', 'https://linkedin.com/company/ku-unity', 3, TRUE);
