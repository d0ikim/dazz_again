// 어드민 — 공연 관리 페이지
// 전체 공연 목록을 예정/종료 탭으로 나눠 보여주고 등록/취소 처리하는 화면
import { useState, useEffect } from 'react'; // useState: 상태 관리 / useEffect: 마운트 시 API 호출
import Icon from '../../components/Icon';     // 아이콘 컴포넌트
import Spinner from '../../components/Spinner'; // 로딩 스피너
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

// 빈 등록 폼 초기값 — musicianIds: 선택한 출연 뮤지션 id 배열 (라인업)
const EMPTY_FORM = { venueId: '', date: '', time: '20:00', title: '', genre: '', setInfo: '', sourceUrl: '', musicianIds: [] };

export default function ScreenAdminConcerts({ navigate, onToast }) {
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');

  // venues: 공연장 드롭다운에 표시할 목록
  const [venues, setVenues] = useState([]);

  // musicians: 라인업 드롭다운에 표시할 전체 뮤지션 목록
  const [musicians, setMusicians] = useState([]);

  // adding: true이면 등록/수정 폼 행 표시
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // editing: 수정 모드일 때 수정 대상 공연 객체 (null이면 신규 등록 모드)
  // 폼에 없는 필드(setList, cancelled)를 수정 요청에 그대로 보존하기 위해 객체 통째로 저장
  const [editing, setEditing] = useState(null);

  // query: 공연명 검색어 (실시간 필터링)
  const [query, setQuery] = useState('');

  useEffect(() => {
    // 공연 목록·공연장 목록·뮤지션 목록을 병렬로 로드
    Promise.all([api.getPerformances(), api.getVenues(), api.getMusicians()])
      .then(([perfs, vs, ms]) => { setPerformances(perfs); setVenues(vs); setMusicians(ms); })
      .catch(() => onToast && onToast('목록 조회 실패', 'ink'))
      .finally(() => setLoading(false));
  }, []);

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // 라인업에 뮤지션 추가 — 드롭다운에서 선택 시 호출 (중복 선택 방지)
  const addMusician = (id) => {
    if (!id) return;
    const numId = Number(id);
    setForm((p) => p.musicianIds.includes(numId) ? p : { ...p, musicianIds: [...p.musicianIds, numId] });
  };

  // 라인업에서 뮤지션 제거 — 선택된 칩의 x 버튼 클릭 시 호출
  const removeMusician = (id) => {
    setForm((p) => ({ ...p, musicianIds: p.musicianIds.filter((mid) => mid !== id) }));
  };

  // 수정 모드 시작 — 편집 버튼 클릭 시 기존 공연 정보로 폼을 채우고 폼을 엶
  const startEdit = (p) => {
    setEditing(p);
    setForm({
      venueId: String(p.venue?.id || ''),        // select의 value는 문자열이므로 변환
      date: p.startTime ? p.startTime.slice(0, 10) : '',   // "2026-05-18T20:00:00" → "2026-05-18"
      time: p.startTime ? p.startTime.slice(11, 16) : '20:00', // → "20:00"
      title: p.title || '',
      genre: p.genre || '',
      setInfo: p.setInfo || '',
      sourceUrl: p.sourceUrl || '',
      musicianIds: [], // 일단 빈 배열로 폼을 열고, 아래에서 현재 라인업을 불러와 채움
    });
    setAdding(true);
    // 현재 라인업 조회 — GET /api/performances/{id}/lineup
    api.getPerformanceLineup(p.id)
      .then((ms) => setForm((f) => ({ ...f, musicianIds: ms.map((m) => m.id) })))
      .catch(() => onToast && onToast('라인업 조회 실패', 'ink'));
  };

  // 폼 닫기 — 등록/수정 모드 공통 (취소 버튼, 저장 성공 시 사용)
  const closeForm = () => {
    setAdding(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  // 공연 저장 — editing이 있으면 수정(PUT), 없으면 신규 등록(POST)
  const save = () => {
    if (!form.venueId || !form.date || !form.title) return;
    setSaving(true);
    const body = {
      venueId: Number(form.venueId),
      startTime: `${form.date}T${form.time}:00`, // "2026-05-18T20:00:00" 형식
      title: form.title,
      genre: form.genre || null,
      setInfo: form.setInfo || null,
      setList: editing ? (editing.setList || null) : null, // 폼에 없는 필드 — 수정 시 기존 값 보존
      sourceUrl: form.sourceUrl || null,
      cancelled: editing ? editing.cancelled : false,      // 수정 시 기존 취소 상태 유지
      musicianIds: form.musicianIds, // 출연 뮤지션 id 배열 — 등록 시 라인업 저장, 수정 시 이 목록으로 교체
    };

    // 수정 모드: PUT /api/admin/performances/{id}
    if (editing) {
      api.updateAdminPerformance(editing.id, body)
        .then((updated) => {
          setPerformances((prev) => prev.map((x) => x.id === updated.id ? updated : x)); // 목록에서 해당 공연만 교체
          closeForm();
          onToast && onToast('공연이 수정됐습니다');
        })
        .catch(() => onToast && onToast('공연 수정 실패', 'ink'))
        .finally(() => setSaving(false));
      return;
    }

    // 등록 모드: POST /api/admin/performances
    api.createAdminPerformance(body)
      .then((created) => {
        setPerformances((prev) => [created, ...prev]); // 목록 맨 앞에 추가
        closeForm();
        onToast && onToast('공연이 등록됐습니다');
      })
      .catch(() => onToast && onToast('공연 등록 실패', 'ink'))
      .finally(() => setSaving(false));
  };

  // 공연 취소 — PUT /api/admin/performances/{id} (cancelled: true로 마킹)
  // musicianIds를 아예 안 보내면(생략) 백엔드가 기존 라인업을 그대로 유지함
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

  // 공연 복구 — PUT /api/admin/performances/{id} (cancelled: false로 되돌림)
  const restore = (p) => {
    const body = {
      venueId: p.venue?.id,
      startTime: p.startTime,
      title: p.title,
      genre: p.genre || null,
      setInfo: p.setInfo || null,
      setList: p.setList || null,
      cancelled: false,
      sourceUrl: p.sourceUrl || null,
    };
    api.updateAdminPerformance(p.id, body)
      .then((updated) => {
        setPerformances((prev) => prev.map((x) => x.id === p.id ? updated : x));
        onToast && onToast('공연이 복구됐습니다');
      })
      .catch(() => onToast && onToast('복구 실패', 'ink'));
  };

  if (loading) {
    return <div className="main dashboard-main"><div className="pad"><Spinner label="불러오는 중..." /></div></div>;
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
          <button className="btn primary sm" onClick={() => { setEditing(null); setForm(EMPTY_FORM); setAdding(true); setTab('upcoming'); }}>
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
              {/* 라인업(출연 뮤지션) 선택 — 드롭다운에서 고르면 아래에 칩으로 쌓임 */}
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label className="label">라인업 (출연 뮤지션)</label>
                {/* value=""로 고정 — 선택 즉시 목록에 추가하고 드롭다운은 placeholder로 되돌림 */}
                <select value="" onChange={(e) => addMusician(e.target.value)}>
                  <option value="">뮤지션 선택해서 추가</option>
                  {musicians
                    .filter((m) => !form.musicianIds.includes(m.id)) // 이미 추가한 뮤지션은 목록에서 숨김
                    .map((m) => <option key={m.id} value={m.id}>{m.stageName}{m.position ? ` — ${m.position}` : ''}</option>)}
                </select>
                {/* 선택된 뮤지션 칩 목록 — x 클릭으로 제거 */}
                {form.musicianIds.length > 0 && (
                  <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {form.musicianIds.map((mid) => {
                      const m = musicians.find((x) => x.id === mid); // id로 뮤지션 정보 찾기 (이름 표시용)
                      return (
                        <span key={mid} className="pill light sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {m ? m.stageName : `#${mid}`}
                          <button
                            type="button"
                            onClick={() => removeMusician(mid)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex' }}
                            aria-label="라인업에서 제거"
                          >
                            <Icon name="x" size={11} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="btn ghost sm" onClick={closeForm}>취소</button>
              {/* editing 여부에 따라 버튼 문구를 등록/수정으로 전환 */}
              <button className="btn primary sm" disabled={!canSave || saving} onClick={save}>
                {saving ? (editing ? '수정 중...' : '등록 중...') : (editing ? '수정' : '등록')}
              </button>
            </div>
          </div>
        )}

        {/* 공연명 검색 */}
        <div className="field" style={{ marginBottom: 16, width: 'auto' }}>
          <div className="prefix plain">
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
                      {/* 공연 편집 버튼 — 기존 정보와 현재 라인업이 채워진 수정 폼을 엶 */}
                      <button className="btn ghost sm" title="공연 수정" onClick={() => startEdit(p)}>
                        <Icon name="edit" size={13} />
                      </button>
                      {/* 취소된 공연: 복구 버튼 표시 */}
                      {p.cancelled && (
                        <button className="btn ghost sm" title="공연 복구" onClick={() => restore(p)}>
                          <Icon name="undo" size={13} />
                        </button>
                      )}
                      {/* 예정 공연(취소 안 됨): 취소 버튼 표시 */}
                      {isUpcoming(p) && !p.cancelled && (
                        <button className="btn ghost sm" title="공연 취소" onClick={() => cancel(p)}>
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
