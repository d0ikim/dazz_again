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

### 🔲 남은 작업
| 내용 |
|---|
| 특정 뮤지션의 공연 목록 API (`GET /api/performances/musician/{id}`) |
| 뮤지션 인맥지도 ego-network API (`GET /api/musicians/{id}/graph`) |
| 뮤지션 프로필 수정 API (`PUT /api/musicians/me`) |
| 어드민 인증 관리 API (승인/반려) |
| 프론트엔드 ↔ 백엔드 실제 연결 |

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

### 뮤지션 인증 신청
| Method | URL | 설명 | 인증 |
|---|---|---|---|
| POST | `/api/verify/musician` | 뮤지션 인증 신청 | 필요 |
| GET | `/api/verify/musician/me` | 내 인증 신청 상태 조회 | 필요 |

### 공연
| Method | URL | 설명 | 인증 |
|---|---|---|---|
| GET | `/api/performances` | 전체 공연 목록 | 불필요 |
| GET | `/api/performances/search?type=title&keyword=` | 공연명 검색 | 불필요 |
| GET | `/api/performances/search?type=genre&keyword=` | 장르 검색 | 불필요 |

### 인증
| Method | URL | 설명 | 인증 |
|---|---|---|---|
| GET | `/oauth2/authorization/kakao` | 카카오 로그인 시작 | 불필요 |

---

## Swagger 인증 사용 방법

1. `/oauth2/authorization/kakao` 접속 → 카카오 로그인
2. 개발자도구 Network 탭 → `login/oauth2/code/kakao` 요청 → Response Headers → `Authorization` 값 복사
3. `http://localhost:8080/swagger-ui/index.html` 접속
4. 우측 상단 **Authorize** 버튼 클릭 → 토큰 붙여넣기
5. 이후 인증 필요한 API 자동으로 토큰 포함
