# DAZZ

서울 재즈 씬을 위한 플랫폼 — 공연장·뮤지션·공연 검색, 인맥지도

## 기술 스택

**Backend**
- Java 21 / Spring Boot 4.1
- Spring Data JPA / PostgreSQL
- Spring Security / OAuth2 (카카오 소셜 로그인)
- JWT (jjwt 0.12)
- Swagger (springdoc-openapi)
- Lombok

**Frontend**
- React 19 / Vite
- 순수 CSS (디자인 시스템 직접 구현)
- 상태 기반 라우팅 (history.pushState)

---

## 진행 현황

### ✅ 완료
| 브랜치 | 내용 |
|---|---|
| `feat/venue-search` | 공연장 목록 조회 및 이름/위치 키워드 검색 API |
| `feat/musician-search` | 뮤지션 목록 조회 및 활동명/악기 키워드 검색 API |
| `feat/auth-user` | 카카오 소셜 로그인 + JWT 발급/검증 + 유저 도메인 (GENERAL/MUSICIAN/ADMIN) |
| `feat/musician-verify` | 뮤지션 인증 신청 API (신청/상태조회) |
| `feat/performance` | 공연 목록 조회 및 공연명/장르 키워드 검색 API |
| `feat/frontend-setup` | React 프론트엔드 전체 구현 (디렉토리, 공연장, 공연, 이력서, 대시보드, 어드민, 인맥지도) |
| `feat/connect-api` | CORS 설정, 뮤지션 단건 조회 API (`GET /api/musicians/{id}`) |
| `feat/graph-api` | 뮤지션별 공연 목록 API, 뮤지션 인맥지도 API |
| `feat/auth-api` | 본인 정보 조회/로그아웃 API, 뮤지션 프로필 수정 API, 카카오 로그인 프론트 연동 |

### 🔲 남은 작업
| 브랜치 예정 | 내용 |
|---|---|
| `feat/admin-api` | 어드민 인증 관리 API — 대기 목록 조회 / 승인 / 거부 |
| `feat/admin-api` | 어드민 공연장 관리 API — 공연장 등록 / 수정 |
| `feat/performance-api` | 공연 단건 조회 API (`GET /api/performances/{id}`) |
| `feat/performance-api` | 공연 이력 추가 API (`POST /api/performances`, MUSICIAN 전용) |
| `feat/connect-frontend` | 프론트엔드 ↔ 백엔드 실제 데이터 연결 (mock 데이터 제거) |

---

## API 엔드포인트

### 공연장
| Method | URL | 설명 | 인증 |
|---|---|---|---|
| GET | `/api/venues` | 전체 공연장 목록 | 불필요 |
| GET | `/api/venues/search?type=name&keyword=` | 이름 검색 | 불필요 |
| GET | `/api/venues/search?type=location&keyword=` | 위치 검색 | 불필요 |

### 뮤지션
| Method | URL | 설명 | 인증 |
|---|---|---|---|
| GET | `/api/musicians` | 전체 뮤지션 목록 | 불필요 |
| GET | `/api/musicians/{id}` | 뮤지션 단건 조회 | 불필요 |
| GET | `/api/musicians/search?type=stageName&keyword=` | 활동명 검색 | 불필요 |
| GET | `/api/musicians/search?type=position&keyword=` | 악기 검색 | 불필요 |
| GET | `/api/musicians/{id}/graph` | 뮤지션 인맥지도 조회 | 불필요 |
| PUT | `/api/musicians/me` | 내 뮤지션 프로필 수정 | 필요 (MUSICIAN) |

### 뮤지션 인증 신청
| Method | URL | 설명 | 인증 |
|---|---|---|---|
| POST | `/api/verify/musician` | 뮤지션 인증 신청 | 필요 |
| GET | `/api/verify/musician/me` | 내 인증 신청 상태 조회 | 필요 |

### 공연
| Method | URL | 설명 | 인증 |
|---|---|---|---|
| GET | `/api/performances` | 전체 공연 목록 | 불필요 |
| GET | `/api/performances/{id}` | 공연 단건 조회 | 불필요 |
| GET | `/api/performances/search?type=title&keyword=` | 공연명 검색 | 불필요 |
| GET | `/api/performances/search?type=genre&keyword=` | 장르 검색 | 불필요 |
| GET | `/api/performances/musician/{id}` | 특정 뮤지션의 공연 목록 | 불필요 |
| POST | `/api/performances` | 공연 이력 추가 | 필요 (MUSICIAN) |

### 어드민
| Method | URL | 설명 | 인증 |
|---|---|---|---|
| GET | `/api/admin/verify` | 인증 대기 목록 조회 | 필요 (ADMIN) |
| POST | `/api/admin/verify/{id}/approve` | 뮤지션 인증 승인 | 필요 (ADMIN) |
| POST | `/api/admin/verify/{id}/reject` | 뮤지션 인증 거부 | 필요 (ADMIN) |
| POST | `/api/admin/venues` | 공연장 등록 | 필요 (ADMIN) |
| PUT | `/api/admin/venues/{id}` | 공연장 수정 | 필요 (ADMIN) |

### 인증
| Method | URL | 설명 | 인증 |
|---|---|---|---|
| GET | `/oauth2/authorization/kakao` | 카카오 로그인 시작 | 불필요 |
| GET | `/api/auth/me` | 로그인 유저 본인 정보 조회 | 필요 |
| POST | `/api/auth/logout` | 로그아웃 | 필요 |

---

## Swagger 인증 사용 방법

1. 프론트엔드(`http://localhost:5173`) 에서 카카오 로그인
2. 로그인 성공 후 브라우저 개발자도구 → Application → Local Storage → `token` 값 복사
3. `http://localhost:8080/swagger-ui/index.html` 접속
4. 우측 상단 **Authorize** 버튼 클릭 → 복사한 토큰 붙여넣기
5. 이후 인증 필요한 API 자동으로 토큰 포함
