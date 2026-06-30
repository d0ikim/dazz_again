const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  // 응답 body가 없는 경우(로그아웃 등 void 반환)에도 오류 없이 처리
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  getMusicians: (params) => request(`/api/musicians?${new URLSearchParams(params)}`),
  getMusician: (uuid) => request(`/api/musicians/${uuid}`),
  getMusicianGraph: (uuid) => request(`/api/musicians/${uuid}/graph`),

  getVenues: (params) => request(`/api/venues?${new URLSearchParams(params)}`),

  getPerformances: (params) => request(`/api/performances?${new URLSearchParams(params)}`),
  getPerformance: (id) => request(`/api/performances/${id}`),
  getMusicianPerformances: (uuid) => request(`/api/performances/musician/${uuid}`),
  createPerformance: (body) => request('/api/performances', { method: 'POST', body: JSON.stringify(body) }),

  getMe: () => request('/api/auth/me'),
  logout: () => request('/api/auth/logout', { method: 'POST' }),

  updateMyProfile: (body) => request('/api/musicians/me', { method: 'PUT', body: JSON.stringify(body) }),

  getVerifyQueue: () => request('/api/admin/verify'),
  approveVerify: (id) => request(`/api/admin/verify/${id}/approve`, { method: 'POST' }),
  rejectVerify: (id) => request(`/api/admin/verify/${id}/reject`, { method: 'POST' }),

  submitVerifyRequest: (body) => request('/api/verify/musician', { method: 'POST', body: JSON.stringify(body) }),
  getMyVerifyRequest: () => request('/api/verify/musician/me'),
};