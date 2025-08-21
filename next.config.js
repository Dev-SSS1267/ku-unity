const pkg = require("./package.json");

module.exports = {
  env: {
    NEXT_PUBLIC_VERSION: pkg.version,
  },
  
  // 정적 파일 최적화
  trailingSlash: true,
  
  // 이미지 최적화 비활성화 (Cloudflare Pages에서 문제가 될 수 있음)
  images: {
    unoptimized: true,
  },
  
  // 출력 모드 설정 - Cloudflare Pages용
  output: 'export',
  
  // Static export를 위한 설정
  distDir: 'out',
  
  // 외부 이미지 도메인 허용
  experimental: {
    images: {
      allowFutureImage: true,
    },
  },
};
