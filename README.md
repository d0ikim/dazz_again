# DAZZ

한국 재즈 씬을 위한 플랫폼 — 뮤지션이 직접 관리하는 공연장·뮤지션·공연 정보와, 실제 공연 데이터를 기반으로 한 협연 인맥지도를 제공합니다.

![Backend CI/CD](https://github.com/d0ikim/dazz_again/actions/workflows/backend.yml/badge.svg)
![Frontend CI/CD](https://github.com/d0ikim/dazz_again/actions/workflows/frontend.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue)

**🔗 배포 링크: [https://dazz-frontend.onrender.com](https://dazz-frontend.onrender.com/)**

> 백엔드는 UptimeRobot으로 5분 간격 헬스체크를 걸어둬서 Render 무료 플랜의 슬립 상태 없이 항상 바로 응답합니다.

---

## 소개

재즈 공연 정보는 각 공연장·뮤지션의 SNS와 개별 홈페이지에 흩어져 있어서, 한 곳에서 "누가 어디서 언제 공연하는지"를 파악하기 어렵습니다. DAZZ는 여러 재즈 공연장의 공연 일정과 라인업을 한곳에 모으고, 그 데이터를 바탕으로 뮤지션 간 협연 관계까지 시각화하는 것을 목표로 합니다.

- 실제 재즈 공연장(클럽에반스, 올댓재즈, 부기우기, 천년동안도 등)의 공개 일정을 크롤링해 DB에 축적
- 축적된 공연/라인업 데이터로 "누가 누구와 몇 번 협연했는지"를 자동 계산해 인맥지도로 시각화
- 카카오 소셜 로그인을 통해 뮤지션 본인이 프로필과 공연 이력을 직접 관리할 수 있는 구조

---

## 주요 기능

- **공연장 / 뮤지션 / 공연 검색** — 이름, 위치(구 단위), 활동명, 악기, 장르 등 키워드 기반 검색
- **공연장 지도** — 카카오맵 위에 공연장 위치를 마커로 표시, 마커 호버/클릭 시 정보 말풍선 노출, 지역 필터(서울 구 단위 / 그 외 시·도 단위)
- **공연 일정 달력** — 공연 목록을 월별 달력으로 표시, 공연장별 색상 구분과 범례 필터 제공
- **뮤지션 인맥지도** — 함께 공연한 협연자와 협연 횟수를 그래프/카드로 시각화 (협연 횟수에 따라 색과 굵기가 달라짐)
- **카카오 소셜 로그인 + JWT 인증** — GENERAL / MUSICIAN / ADMIN 3가지 유저 역할
- **뮤지션 인증 플로우** — 일반 유저의 뮤지션 인증 신청 → 어드민 승인/거부
- **어드민 관리** — 뮤지션·공연장·공연 등록/수정(출연 라인업 지정 포함), 뮤지션 인증 대기 목록 관리
- **공연장 좌표 크롤링** — Kakao Local API로 기존 공연장 주소를 위도/경도로 변환해 저장
- **전국 재즈바 수집 크롤러** — 지역 설정표(전국 17개 시·도) × 가게 종류(재즈바/재즈클럽/재즈카페/재즈 라이브) 조합으로 Kakao 키워드 검색, Naver 지역검색으로 홈페이지/인스타 URL 보완 후 venue 테이블에 저장 (이름 기준 중복 스킵)
- **뮤지션 수집 크롤러** — 올댓재즈(JSON API)·부기우기(노션 JSON)·클럽에반스(HTML 달력) 3곳의 공연 정보에서 뮤지션을 수집해 musician 테이블에 저장 (인스타 핸들 기반 동일인 판별, 비어 있는 사진/SNS만 보완, 그룹명 계정 필터링)
- **공연/라인업 수집 크롤러** — 클럽에반스·부기우기·올댓재즈·천년동안도 4곳의 공연을 지난달~다음달 범위로 수집해 performance / performance_lineup 테이블에 저장 (공연장별 일시+제목 중복 스킵, 라인업의 신규 뮤지션 병행 등록) — 주기 실행(크론) 전제의 멱등 설계
- **모바일 반응형 UI** — 768px 이하에서 햄버거 메뉴 + 슬라이드 드로어로 전환, 그리드 재배치
- **요청 데이터 검증** — URL 형식을 프론트 폼 + 백엔드 Bean Validation(`@Pattern`/`@Valid`)으로 이중 검사, 전역 예외 핸들러가 필드별 메시지로 400 응답

---

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

**Infra**
- Render (Backend Web Service / Frontend Static Site / PostgreSQL)
- GitHub Actions (Backend/Frontend CI — push·PR 시 빌드 자동 검증)

**Data**
- Python 크롤러 (requests / BeautifulSoup) — 공연장·뮤지션·공연 정보를 실제 재즈 공연장 사이트에서 수집

---

## 로컬 실행

### 사전 준비물
- Java 21, Node.js 18+, PostgreSQL
- 카카오 개발자 콘솔에서 발급받은 REST API 키 (로그인용) — [Kakao Developers](https://developers.kakao.com)

### Backend

```bash
cd backend
```

`backend/.env` (또는 실행 환경변수)에 아래 값을 채워주세요.

```
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=dazz
DB_USER=본인_DB_계정
DB_PASSWORD=본인_DB_비밀번호

KAKAO_CLIENT_ID=카카오_REST_API_키
KAKAO_CLIENT_SECRET=카카오_클라이언트_시크릿

JWT_SECRET=64자_이상의_임의_문자열
JWT_EXPIRATION_MS=3600000
```

```bash
./gradlew bootRun
```

기본 포트는 `8080`입니다.

### Frontend

```bash
cd frontend
npm install
```

`frontend/.env`에 아래 값을 채워주세요.

```
VITE_API_URL=http://localhost:8080
VITE_KAKAO_MAP_KEY=카카오_지도_JavaScript_키
```

```bash
npm run dev
```

기본 포트는 `5173`입니다.

---

## API 문서

### 공연장
| Method | URL | 설명 | 인증 | 프론트 |
|---|---|---|---|---|
| GET | `/api/venues` | 전체 공연장 목록 | 불필요 | ✓ |
| GET | `/api/venues/search?type=name&keyword=` | 이름 검색 | 불필요 | - |
| GET | `/api/venues/search?type=location&keyword=` | 위치 검색 | 불필요 | - |
| POST | `/api/admin/venues` | 공연장 등록 | 필요 (ADMIN) | ✓ |
| PUT | `/api/admin/venues/{id}` | 공연장 수정 | 필요 (ADMIN) | ✓ |

### 뮤지션
| Method | URL | 설명 | 인증 | 프론트 |
|---|---|---|---|---|
| GET | `/api/musicians` | 전체 뮤지션 목록 | 불필요 | ✓ |
| GET | `/api/musicians/{id}` | 뮤지션 단건 조회 | 불필요 | ✓ |
| GET | `/api/musicians/search?type=stageName&keyword=` | 활동명 검색 | 불필요 | - |
| GET | `/api/musicians/search?type=position&keyword=` | 악기 검색 | 불필요 | - |
| GET | `/api/musicians/{id}/graph` | 뮤지션 인맥지도 조회 | 불필요 | ✓ |
| PUT | `/api/musicians/me` | 내 뮤지션 프로필 수정 | 필요 (MUSICIAN) | - |
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
| GET | `/api/performances/search?type=title&keyword=` | 공연명 검색 | 불필요 | - |
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

> "프론트 -"로 표시된 검색/수정 API는 백엔드에는 구현되어 있지만, 현재 프론트엔드는 전체 목록을 받아 클라이언트 사이드에서 필터링하는 방식을 쓰고 있어 아직 연결되어 있지 않습니다.

### Swagger 인증 사용 방법

1. 프론트엔드(`http://localhost:5173`)에서 카카오 로그인
2. 로그인 성공 후 브라우저 개발자도구 → Application → Local Storage → `token` 값 복사
3. `http://localhost:8080/swagger-ui/index.html` 접속
4. 우측 상단 **Authorize** 버튼 클릭 → 복사한 토큰 붙여넣기
5. 이후 인증 필요한 API 자동으로 토큰 포함

---

## 라이선스

[MIT](./LICENSE)