# DAZZ

서울 재즈 씬을 위한 플랫폼 — 공연장·뮤지션·공연 검색, 인맥지도

## 기술 스택
- Java 17 / Spring Boot
- Spring Data JPA / PostgreSQL
- Swagger (springdoc-openapi)
- Lombok

---

## 진행 현황

### ✅ 완료
| 브랜치 | 내용 |
|---|---|
| `feat/venue-search` | 공연장 목록 조회 및 이름/위치 키워드 검색 API |
| `feat/musician-search` | 뮤지션 목록 조회 및 활동명/악기 키워드 검색 API |

### 🔲 남은 작업
| 브랜치 | 내용 |
|---|---|
| `feat/musician-profile` | 뮤지션 프로필 관리 (본인 수정) |
| `feat/musician-verify` | 뮤지션 인증 신청 → ADMIN 승인/거절 |
| `feat/auth` | 카카오 소셜 로그인 + JWT 발급/검증 |
| `feat/concert-search` | 공연 목록 조회 및 검색, 출연진 등록 |
| `feat/network-map` | 공연 출연진 기반 인맥지도 자동 생성 |

---

## API 엔드포인트

### 공연장
| Method | URL | 설명 |
|---|---|---|
| GET | `/api/venues` | 전체 공연장 목록 |
| GET | `/api/venues/search?type=name&keyword=` | 이름 검색 |
| GET | `/api/venues/search?type=location&keyword=` | 위치 검색 |

### 뮤지션
| Method | URL | 설명 |
|---|---|---|
| GET | `/api/musicians` | 전체 뮤지션 목록 |
| GET | `/api/musicians/search?type=stageName&keyword=` | 활동명 검색 |
| GET | `/api/musicians/search?type=position&keyword=` | 악기 검색 |