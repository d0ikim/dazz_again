// 어드민 — 공연 관리 페이지
// 전체 공연 목록을 예정/종료 탭으로 나눠 보여주고 등록/취소 처리하는 화면
import { useState, useEffect } from 'react'; // useState: 상태 관리 / useEffect: 마운트 시 API 호출
import Icon from '../../components/Icon';     // 아이콘 컴포넌트
import { api } from '../../api/client';       // 백엔드 API 호출 함수 모음

// startTime에서 "YYYY-MM-DD HH:MM" 형식 문자열 반환
function fmtDateTime(startTime) {
  if (!startTime) return '';
  return startTime.replace('T', ' ').slice(0, 16);
}

// 공연이 예정 상태인지 판단 (백엔드에 status 필드 없으므로 직접 계산)
function isUpcoming(p) {
  if (p.cancelled) return false;
  return new Date(p.startTime) > new Date();
}

// 빈 등록 폼 초기값
const EMPTY_FORM = { venueId: '', date: '', time: '20:00', title: '', genre: '', setInfo: '', sourceUrl: '' };

export default function ScreenAdminConcerts({ navigate, onToast }) {
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');

  // venues: 공연장 드롭다운에 표시할 목록
  const [venues, setVenues] = useState([]);

  // adding: true이면 등록 폼 행 표시
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // query: 공연명 검색어 (실시간 필터링)
  const [query, setQuery] = useState('');

  useEffect(() => {
    // 공연 목록과 공연장 목록을 병렬로 로드
    Promise.all([api.getPerformances(), api.getVenues()])
      .then(([perfs, vs]) => { setPerformances(perfs); setVenues(vs); })
      .catch(() => onToast && onToast('목록 조회 실패', 'ink'))
      .finally(() => setLoading(false));
  }, []);

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // 공연 등록 — POST /api/admin/performances
  const save = () => {
    if (!form.venueId || !form.date || !form.title) return;
    setSaving(true);
    const body = {
      venueId: Number(form.venueId),
      startTime: `${form.date}T${form.time}:00`, // "2026-05-18T20:00:00" 형식
      title: form.title,
      genre: form.genre || null,
      setInfo: form.setInfo || null,
      setList: null,
      sourceUrl: form.sourceUrl || null,
      cancelled: false,
    };
    api.createAdminPerformance(body)           // POST /api/admin/performances
      .then((created) => {
        setPerformances((prev) => [created, ...prev]); // 목록 맨 앞에 추가
        setAdding(false);
        setForm(EMPTY_FORM);
        onToast && onToast('공연이 등록됐습니다');
      })
      .catch(() => onToast && onToast('공연 등록 실패', 'ink'))
      .finally(() => setSaving(false));
  };

  // 공연 취소 — PUT /api/admin/performances/{id} (cancelled: true)
  const cancel = (p) => {
    const body = {
      venueId: p.venue?.id,
      startTime: p.startTime,
      title: p.title,
      genre: p.genre || null,
      setInfo: p.setInfo || null,
      setList: p.setList || null,
      cancelled: true,
      sourceUrl: p.sourceUrl || null,
    };
    api.updateAdminPerformance(p.id, body)
      .then((updated) => {
        setPerformances((prev) => prev.map((x) => x.id === p.id ? updated : x));
        onToast && onToast('공연이 취소 처리됐습니다');
      })
      .catch(() => onToast && onToast('취소 처리 실패', 'ink'));
  };

  if (loading) {
    return <div className="main dashboard-main"><div className="pad"><p className="muted">불러오는 중...</p></div></div>;
  }

  // tab + 검색어로 공연 필터링
  const list = performances.filter((p) => {
    const matchTab = tab === 'upcoming' ? isUpcoming(p) : !isUpcoming(p); // 탭 필터 만족 여부
    const matchQuery = query === '' || p.title.toLowerCase().includes(query.toLowerCase()); // 공연명 검색 만족 여부
    return matchTab && matchQuery; // 둘 다 만족하면 표시
  });
  const canSave = form.venueId && form.date && form.title;

  return (
    <div className="main dashboard-main">
      <div className="pad">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 className="h2 serif" style={{ margin: 0 }}>공연 관리 ({performances.length})</h1>
          <button className="btn primary sm" onClick={() => { setAdding(true); setTab('upcoming'); }}>
            <Icon name="plus" size={14} /> 공연 등록
          </button>
        </div>

        {/* 공연 등록 폼 — adding이 true일 때만 표시 */}
        {adding && (
          <div className="card" style={{ marginBottom: 18, padding: '16px 20px' }}>
            <div className="form-grid">
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label className="label">공연명 *</label>
                <input type="text" placeholder="예: 김재즈 트리오 정기공연" value={form.title} onChange={(e) => setField('title', e.target.value)} />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label className="label">공연장 *</label>
                <select value={form.venueId} onChange={(e) => setField('venueId', e.target.value)}>
                  <option value="">공연장 선택</option>
                  {venues.map((v) => <option key={v.id} value={v.id}>{v.name} — {v.location}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">날짜 *</label>
                <input type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} />
              </div>
              <div className="field">
                <label className="label">시작 시간</label>
                <input type="time" value={form.time} onChange={(e) => setField('time', e.target.value)} />
              </div>
              <div className="field">
                <label className="label">장르</label>
                <input type="text" placeholder="JAZZ" value={form.genre} onChange={(e) => setField('genre', e.target.value)} />
              </div>
              <div className="field">
                <label className="label">세트 정보</label>
                <input type="text" placeholder="1부 20:00~20:40" value={form.setInfo} onChange={(e) => setField('setInfo', e.target.value)} />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label className="label">출처 링크</label>
                <input type="url" placeholder="인스타 포스트 URL 등" value={form.sourceUrl} onChange={(e) => setField('sourceUrl', e.target.value)} />
              </div>
            </div>
            <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="btn ghost sm" onClick={() => { setAdding(false); setForm(EMPTY_FORM); }}>취소</button>
              <button className="btn primary sm" disabled={!canSave || saving} onClick={save}>
                {saving ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        )}

        {/* 공연명 검색 */}
        <div className="field" style={{ marginBottom: 16, width: 'auto' }}>
          <div className="prefix">
            <span><Icon name="search" size={14} /></span>
            <input
              type="text"
              placeholder="공연명 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)} // 입력값 변경 시 실시간 필터링
            />
          </div>
        </div>

        {/* 예정/종료 탭 */}
        <div className="tab-row" style={{ marginBottom: 18 }}>
          <button className={`tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>
            예정 ({performances.filter(isUpcoming).length})
          </button>
          <button className={`tab ${tab === 'past' ? 'active' : ''}`} onClick={() => setTab('past')}>
            종료 ({performances.filter((p) => !isUpcoming(p)).length})
          </button>
        </div>

        <div className="card flush">
          <table className="admin-table">
            <thead>
              <tr>
                <th>공연명</th>
                <th>날짜·시간</th>
                <th>공연장</th>
                <th>장르</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td><b style={{ fontSize: 13 }}>{p.title}</b></td>
                  <td className="mono" style={{ fontSize: 12 }}>{fmtDateTime(p.startTime)}</td>
                  <td className="muted">{p.venue?.name}</td>
                  <td className="muted">{p.genre || '—'}</td>
                  <td>
                    {p.cancelled
                      ? <span className="pill light sm">취소</span>
                      : isUpcoming(p)
                        ? <span className="pill wine sm">예정</span>
                        : <span className="pill light sm">종료</span>
                    }
                  </td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <button className="btn ghost sm" onClick={() => navigate('concert-detail', { concertId: p.id })}>
                        <Icon name="external" size={13} />
                      </button>
                      {isUpcoming(p) && !p.cancelled && (
                        <button className="btn ghost sm" onClick={() => cancel(p)}>
                          <Icon name="x" size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && (
            <div className="empty-state sm">
              <p className="muted">{tab === 'upcoming' ? '예정 공연 없음' : '지난 공연 없음'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
