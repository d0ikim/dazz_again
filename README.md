# DAZZ

서울 재즈 씬을 위한 플랫폼 — 공연장·뮤지션·공연 검색, 인맥지도

![Backend CI/CD](https://github.com/d0ikim/dazz_again/actions/workflows/backend.yml/badge.svg)
![Frontend CI/CD](https://github.com/d0ikim/dazz_again/actions/workflows/frontend.yml/badge.svg)

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
- 카카오맵 (공연장 위치 표시)

---

## 주요 기능

- **공연장 / 뮤지션 / 공연 검색** — 이름, 위치(구 단위), 활동명, 악기, 장르 등 키워드 기반 검색
- **공연장 지도** — 카카오맵 위에 공연장 위치를 마커로 표시, 마커 호버/클릭 시 정보 말풍선 노출
- **뮤지션 인맥지도** — 함께 공연한 협연자와 협연 횟수를 그래프로 시각화
- **카카오 소셜 로그인 + JWT 인증** — GENERAL / MUSICIAN / ADMIN 3가지 유저 역할
- **뮤지션 인증 플로우** — 일반 유저의 뮤지션 인증 신청 → 어드민 승인/거부
- **어드민 관리** — 뮤지션·공연장·공연 등록/수정(출연 라인업 지정 포함), 뮤지션 인증 대기 목록 관리
- **공연장 좌표 크롤링** — Kakao Local API로 기존 공연장 주소를 위도/경도로 변환해 저장
- **모바일 반응형 UI** — 768px 이하에서 햄버거 메뉴 + 슬라이드 드로어로 전환, 그리드 1열 재배치

---

## API 엔드포인트

### 공연장
| Method | URL | 설명 | 인증 | 프론트 |
|---|---|---|---|---|
| GET | `/api/venues` | 전체 공연장 목록 | 불필요 | ✓ |
| GET | `/api/venues/search?type=name&keyword=` | 이름 검색 | 불필요 | ✓ |
| GET | `/api/venues/search?type=location&keyword=` | 위치 검색 (구별 필터) | 불필요 | ✓ |
| POST | `/api/admin/venues` | 공연장 등록 | 필요 (ADMIN) | ✓ |
| PUT | `/api/admin/venues/{id}` | 공연장 수정 | 필요 (ADMIN) | ✓ |

### 뮤지션
| Method | URL | 설명 | 인증 | 프론트 |
|---|---|---|---|---|
| GET | `/api/musicians` | 전체 뮤지션 목록 | 불필요 | ✓ |
| GET | `/api/musicians/{id}` | 뮤지션 단건 조회 | 불필요 | ✓ |
| GET | `/api/musicians/search?type=stageName&keyword=` | 활동명 검색 | 불필요 | ✓ |
| GET | `/api/musicians/search?type=position&keyword=` | 악기 검색 (필터 버튼) | 불필요 | ✓ |
| GET | `/api/musicians/{id}/graph` | 뮤지션 인맥지도 조회 | 불필요 | ✓ |
| PUT | `/api/musicians/me` | 내 뮤지션 프로필 수정 | 필요 (MUSICIAN) | ✓ |
| POST | `/api/admin/musicians` | 뮤지션 등록 | 필요 (ADMIN) | ✓ |
| PUT | `/api/admin/musicians/{id}` | 뮤지션 수정 | 필요 (ADMIN) | ✓ |

### 뮤지션 인증 신청
| Method | URL | 설명 | 인증 | 프론트 |
|---|---|---|---|---|
| POST | `/api/verify/musician` | 뮤지션 인증 신청 | 필요 | ✓ |
| GET | `/api/verify/musician/me` | 내 인증 신청 상태 조회 | 필요 | ✓ |

### 공연
| Method | URL | 설명 | 인증 | 프론트 |
|---|---|---|---|---|
| GET | `/api/performances` | 전체 공연 목록 | 불필요 | ✓ |
| GET | `/api/performances/{id}` | 공연 단건 조회 | 불필요 | ✓ |
| GET | `/api/performances/search?type=title&keyword=` | 공연명 검색 | 불필요 | ✓ |
| GET | `/api/performances/search?type=genre&keyword=` | 장르 검색 | 불필요 | - |
| GET | `/api/performances/{id}/lineup` | 공연 라인업(출연 뮤지션) 조회 | 불필요 | ✓ |
| GET | `/api/performances/musician/{id}` | 특정 뮤지션의 공연 목록 | 불필요 | ✓ |
| POST | `/api/performances` | 공연 이력 추가 | 필요 (MUSICIAN) | ✓ |
| POST | `/api/admin/performances` | 공연 등록 (라인업 포함 가능) | 필요 (ADMIN) | ✓ |
| PUT | `/api/admin/performances/{id}` | 공연 수정 (취소/복구, 라인업 교체) | 필요 (ADMIN) | ✓ |

### 어드민
| Method | URL | 설명 | 인증 | 프론트 |
|---|---|---|---|---|
| GET | `/api/admin/verify/pending` | 인증 대기 목록 조회 | 필요 (ADMIN) | ✓ |
| PATCH | `/api/admin/verify/{id}/approve` | 뮤지션 인증 승인 | 필요 (ADMIN) | ✓ |
| PATCH | `/api/admin/verify/{id}/reject` | 뮤지션 인증 거부 | 필요 (ADMIN) | ✓ |

### 인증
| Method | URL | 설명 | 인증 | 프론트 |
|---|---|---|---|---|
| GET | `/oauth2/authorization/kakao` | 카카오 로그인 시작 | 불필요 | ✓ |
| GET | `/api/auth/me` | 로그인 유저 본인 정보 조회 | 필요 | ✓ |
| POST | `/api/auth/logout` | 로그아웃 | 필요 | ✓ |

---

## Swagger 인증 사용 방법

1. 프론트엔드(`http://localhost:5173`) 에서 카카오 로그인
2. 로그인 성공 후 브라우저 개발자도구 → Application → Local Storage → `token` 값 복사
3. `http://localhost:8080/swagger-ui/index.html` 접속
4. 우측 상단 **Authorize** 버튼 클릭 → 복사한 토큰 붙여넣기
5. 이후 인증 필요한 API 자동으로 토큰 포함
