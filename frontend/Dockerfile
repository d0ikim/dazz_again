# 프론트엔드 Dockerfile — 2단계 빌드 방식
# 1단계: Node.js에서 React 코드를 정적 파일(HTML, CSS, JS)로 빌드
# 2단계: Nginx에서 그 파일들을 웹 브라우저에 서빙(제공)

# ========== 1단계: 빌드 ==========
# as builder: 이 이미지에 'builder'라는 이름 붙임 (2단계에서 참조)
FROM node:20-alpine as builder

# 작업 디렉토리 설정
WORKDIR /app

# package.json, package-lock.json 복사
# npm install을 위해서 필요
# (소스 코드는 나중에 복사 - 파일 변경 시 캐시를 활용하기 위함)
COPY package*.json ./

# npm install 실행
# package.json의 모든 라이브러리 설치
# (React, Vite, axios 등등)
RUN npm install

# 소스 코드 복사
# src/, index.html, vite.config.js 등 모든 파일
COPY . .

# npm run build 실행
# React 코드를 HTML/CSS/JS로 변환
# 결과: dist/ 폴더에 배포용 파일들이 생성됨
RUN npm run build

# ========== 2단계: 서빙 ==========
# Nginx: 초경량 웹 서버 (정적 파일만 제공)
# alpine: 매우 가벼운 리눅스 (이미지 크기: 50MB → 10MB로 축소)
FROM nginx:alpine

# Nginx 설정 파일 (옵션 - 없어도 기본 설정으로 동작)
# 여기서는 기본 설정 사용
# 고급 설정: 캐싱, GZIP 압축 등을 설정할 수 있음

# 작업 디렉토리
WORKDIR /usr/share/nginx/html

# 1단계(builder)에서 생성된 dist/ 폴더를
# Nginx의 웹 디렉토리로 복사
# --from=builder: 이전 단계의 이미지에서 복사한다는 뜻
COPY --from=builder /app/dist .

# Nginx 기본 포트는 80
# (docker run -p 80:80 으로 매핑)
EXPOSE 80

# Nginx 시작 (백그라운드에서 계속 실행됨)
CMD ["nginx", "-g", "daemon off;"]

# ========== 이 방식의 장점 ==========
# 1. 2단계 분리:
#    - 1단계에서 빌드 (npm install, npm run build)
#    - 2단계에서는 dist/ 파일만 필요
#    → 최종 이미지에 node_modules 포함 안 됨 (이미지 크기 90% 축소)
#
# 2. 보안:
#    - Nginx만 실행 (Node.js 서버 노출 안 됨)
#    - 정적 파일만 제공
#
# 3. 성능:
#    - Nginx는 정적 파일 서빙에 최적화됨
#    - 매우 빠르고 가벼움

# ========== docker run 할 때 명령어 ==========
# docker run -p 5173:80 frontend-image
#
# -p 5173:80: 호스트의 포트 5173을 컨테이너의 포트 80으로 매핑
# (로컬에서 http://localhost:5173 으로 접속 가능)
