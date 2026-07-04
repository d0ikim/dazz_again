// 백엔드 API와 통신하는 함수들을 한 곳에 모아둔 파일
// 모든 페이지는 직접 fetch를 쓰지 않고 이 파일의 api 객체를 import해서 사용함

// import.meta.env: Vite가 제공하는 환경변수 접근 객체
// VITE_API_URL이 .env 파일에 설정돼 있으면 그 값을 쓰고, 없으면 로컬 백엔드 주소 사용
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// 모든 API 호출에서 공통으로 사용하는 fetch 래퍼 함수
// path: '/api/musicians' 같은 API 경로
// options: method, body 등 fetch에 추가로 넘길 설정값
async function request(path, options = {}) {
  // localStorage: 브라우저에 데이터를 영구 저장하는 공간 (탭을 닫아도 유지)
  // 카카오 로그인 후 저장해 둔 JWT 토큰을 꺼냄
  const token = localStorage.getItem('token');

  // fetch: 브라우저 내장 HTTP 요청 함수
  // 스프레드 연산자(...)로 options의 내용을 풀어서 headers와 합침
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',              // 요청 바디가 JSON 형식임을 서버에 알림
      ...(token ? { Authorization: `Bearer ${token}` } : {}), // 토큰이 있으면 Authorization 헤더에 추가
      ...options.headers,                              // 호출하는 쪽에서 추가 헤더를 넘기면 여기서 합침
    },
  });

  // res.ok: HTTP 상태코드가 200~299이면 true, 그 외(400, 401, 404 등)이면 false
  if (!res.ok) throw new Error(`${res.status} ${path}`); // 오류 시 예외를 던져 호출하는 쪽의 .catch()로 전달

  // res.text(): 응답 바디를 문자열로 읽음
  // 로그아웃처럼 응답 바디가 없는 API(void 반환)에서 JSON.parse('')를 호출하면 오류가 나므로
  // 빈 문자열이면 null을 반환하고, 내용이 있으면 JSON으로 파싱해서 객체로 변환
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// api 객체: 기능별로 백엔드 API 호출 함수를 묶어둔 객체
// 각 페이지에서 import { api } from '../../api/client' 로 가져다 씀
export const api = {

  // ── 뮤지션 ──────────────────────────────────────────────────────────────
  // params: { type: 'stageName', keyword: '조에스더' } 형태로 검색 조건을 넘김
  // URLSearchParams: 객체를 'type=stageName&keyword=조에스더' 형태의 쿼리스트링으로 변환
  getMusicians: (params) => request(`/api/musicians?${new URLSearchParams(params)}`),

  // id: 뮤지션의 DB 고유 번호 (숫자, 예: 1)
  getMusician: (id) => request(`/api/musicians/${id}`),

  // 특정 뮤지션을 중심으로 함께 공연한 협연자 목록과 협연 횟수를 반환
  getMusicianGraph: (id) => request(`/api/musicians/${id}/graph`),

  // ── 어드민 - 뮤지션 등록/수정 ────────────────────────────────────────────
  // body: { stageName, realName, position, bio, snsUrl, profileImageUrl, sourceUrl }
  createMusician: (body) => request('/api/admin/musicians', { method: 'POST', body: JSON.stringify(body) }),

  // id: 수정할 뮤지션 번호 / body: 수정할 필드값 (전체 교체 방식)
  updateMusician: (id, body) => request(`/api/admin/musicians/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  // ── 공연장 ──────────────────────────────────────────────────────────────
  // params가 없으면 URLSearchParams(undefined)가 빈 문자열('')을 반환하므로 안전하게 호출 가능
  getVenues: (params) => request(`/api/venues?${new URLSearchParams(params)}`),

  // ── 공연 ────────────────────────────────────────────────────────────────
  getPerformances: (params) => request(`/api/performances?${new URLSearchParams(params)}`),

  // id로 공연 단건 조회 (공연 상세 페이지에서 사용)
  getPerformance: (id) => request(`/api/performances/${id}`),

  // musicianId: 특정 뮤지션이 출연한 공연 목록 조회
  getMusicianPerformances: (musicianId) => request(`/api/performances/musician/${musicianId}`),

  // id: 공연 번호 — 해당 공연에 출연하는 뮤지션(라인업) 목록 조회 (수정 폼에서 현재 라인업 표시용)
  getPerformanceLineup: (id) => request(`/api/performances/${id}/lineup`),

  // MUSICIAN 역할만 호출 가능 — 본인이 출연한 공연을 직접 추가
  // body: { venueId, startTime, title, genre, setInfo, setList, sourceUrl } 형태
  createPerformance: (body) => request('/api/performances', { method: 'POST', body: JSON.stringify(body) }),

  // ── 인증(Auth) ──────────────────────────────────────────────────────────
  // JWT 토큰으로 현재 로그인한 유저 정보를 반환 (id, nickname, role, profileImageUrl 등)
  getMe: () => request('/api/auth/me'),

  // 서버에 로그아웃을 알림 — JWT는 서버가 무효화할 수 없으므로 실제 로그아웃은 클라이언트가 토큰 삭제로 처리
  logout: () => request('/api/auth/logout', { method: 'POST' }),

  // MUSICIAN 본인의 프로필(활동명, 악기, 소개글 등)을 수정
  // body: { stageName, realName, position, bio, snsUrl, profileImageUrl } 중 수정할 필드만 보내면 됨
  updateMyProfile: (body) => request('/api/musicians/me', { method: 'PUT', body: JSON.stringify(body) }),

  // ── 어드민 - 뮤지션 인증 관리 ───────────────────────────────────────────
  // 백엔드 경로: GET /api/admin/verify/pending (PENDING 상태인 신청만 반환)
  // 주의: /api/admin/verify 가 아닌 /api/admin/verify/pending 이 정확한 경로
  getVerifyQueue: () => request('/api/admin/verify/pending'),

  // 백엔드가 @PatchMapping을 사용하므로 method는 반드시 'PATCH'
  // 주의: 'POST'로 보내면 405 Method Not Allowed 에러 발생
  approveVerify: (id) => request(`/api/admin/verify/${id}/approve`, { method: 'PATCH' }),
  rejectVerify: (id) => request(`/api/admin/verify/${id}/reject`, { method: 'PATCH' }),

  // ── 어드민 - 공연장 등록/수정 ────────────────────────────────────────────
  // body: { name, location, instagramUrl, homepageUrl, description }
  createVenue: (body) => request('/api/admin/venues', { method: 'POST', body: JSON.stringify(body) }),

  // id: 수정할 공연장 번호 / body: 수정할 필드값 (전체 교체 방식)
  updateVenue: (id, body) => request(`/api/admin/venues/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  // ── 어드민 - 공연 등록/수정 ──────────────────────────────────────────────
  // body: { venueId, startTime, title, genre, setInfo, setList, cancelled, sourceUrl, musicianIds }
  // musicianIds: 출연 뮤지션 id 배열 (선택) — 보내면 라인업 등록/교체, 아예 안 보내면(생략) 라인업 유지
  createAdminPerformance: (body) => request('/api/admin/performances', { method: 'POST', body: JSON.stringify(body) }),

  // id: 수정할 공연 번호
  updateAdminPerformance: (id, body) => request(`/api/admin/performances/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  // ── 뮤지션 인증 신청 (일반 유저) ─────────────────────────────────────────
  // body: 인증 신청 내용 (악기, 학교, SNS 링크, 증빙 자료 등)
  submitVerifyRequest: (body) => request('/api/verify/musician', { method: 'POST', body: JSON.stringify(body) }),

  // 본인의 인증 신청 현재 상태 조회 (PENDING / APPROVED / REJECTED)
  getMyVerifyRequest: () => request('/api/verify/musician/me'),
};