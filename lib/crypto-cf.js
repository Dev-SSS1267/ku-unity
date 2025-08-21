// Cloudflare Workers 호환 암호화 유틸리티
import jwt from '@tsndr/cloudflare-worker-jwt'

const HASHSALT = process.env.HASHSALT || '1234';

// Web Crypto API를 사용한 비밀번호 해싱 (bcrypt 대체)
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + HASHSALT);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// 비밀번호 검증
export async function verifyPassword(password, hashedPassword) {
  const hashedInput = await hashPassword(password);
  return hashedInput === hashedPassword;
}

// JWT 토큰 생성
export async function createSecureToken(payload) {
  return await jwt.sign(payload, HASHSALT);
}

// JWT 토큰 검증
export async function parseSecureToken(token) {
  try {
    const isValid = await jwt.verify(token, HASHSALT);
    if (isValid) {
      return jwt.decode(token);
    }
    return null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}
