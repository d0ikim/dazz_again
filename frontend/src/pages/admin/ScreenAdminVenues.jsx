// 어드민 — 공연장 관리 페이지
// 공연장 목록을 테이블로 표시하고 인라인 수정·추가 기능을 제공하는 화면
import { useState, useEffect } from 'react'; // useState: 상태 관리 / useEffect: 마운트 시 API 호출
import Icon from '../../components/Icon';     // 아이콘 컴포넌트
import Spinner from '../../components/Spinner'; // 로딩 스피너
import { api } from '../../api/client';       // 백엔드 API 호출 함수 모음

// 폼 초기값 — 추가 모드 진입 시 빈 입력 필드를 만들기 위해 사용
const EMPTY_FORM = { name: '', location: '', instagramUrl: '', homepageUrl: '', description: '' };

export default function ScreenAdminVenues({ navigate, onToast }) {
  // venues: 백엔드에서 받아온 공연장 목록
  const [venues, setVenues] = useState([]);

  // loading: API 응답 대기 중 여부
  const [loading, setLoading] = useState(true);

  // editing: 현재 인라인 수정 중인 공연장 id (null이면 수정 모드 아님)
  const [editing, setEditing] = useState(null);

  // adding: 새 공연장 추가 모드 여부 (true면 테이블 상단에 빈 입력 행 표시)
  const [adding, setAdding] = useState(false);

  // form: 수정·추가 중인 필드값을 담는 객체
  const [form, setForm] = useState({});

  // 마운트 시 전체 공연장 목록 로드
  useEffect(() => {
    api.getVenues()                         // GET /api/venues
      .then((data) => setVenues(data))
      .catch(() => onToast && onToast('공연장 목록 조회 실패', 'ink'))
      .finally(() => setLoading(false));
  }, []);

  // 수정 모드 시작 — 선택한 공연장의 현재 값을 form에 복사
  const startEdit = (v) => {
    setAdding(false); // 추가 모드와 수정 모드는 동시에 활성화되지 않도록
    setEditing(v.id);
    setForm({
      name: v.name || '',
      location: v.location || '',
      instagramUrl: v.instagramUrl || '',
      homepageUrl: v.homepageUrl || '',
      description: v.description || '',
    });
  };

  // 수정 저장 — PUT /api/admin/venues/{id}
  const saveEdit = () => {
    api.updateVenue(editing, form)
      .then((updated) => {
        // 성공: 로컬 목록에서 해당 항목을 백엔드가 반환한 최신 값으로 교체
        setVenues((prev) => prev.map((v) => v.id === editing ? updated : v));
        onToast && onToast('공연장 정보가 저장됐습니다');
        setEditing(null);
      })
      .catch(() => onToast && onToast('저장 실패', 'ink'));
  };

  // 추가 모드 시작 — 빈 폼으로 초기화
  const startAdd = () => {
    setEditing(null); // 수정 모드가 열려 있으면 닫음
    setAdding(true);
    setForm({ ...EMPTY_FORM });
  };

  // 추가 저장 — POST /api/admin/venues
  const saveAdd = () => {
    api.createVenue(form)
      .then((created) => {
        // 성공: 백엔드가 반환한 새 공연장 객체를 목록 맨 앞에 추가
        setVenues((prev) => [created, ...prev]);
        onToast && onToast('공연장이 등록됐습니다');
        setAdding(false);
      })
      .catch(() => onToast && onToast('등록 실패', 'ink'));
  };

  // form 필드 하나를 업데이트하는 헬퍼 함수
  // key: 필드명 (예: 'name') / value: 새 입력값
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <div className="main dashboard-main">
        <div className="pad"><Spinner label="공연장 목록을 불러오는 중..." /></div>
      </div>
    );
  }

  return (
    <div className="main dashboard-main">
      <div className="pad">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 className="h2 serif" style={{ margin: 0 }}>공연장 관리 ({venues.length})</h1>
          <button className="btn primary sm" onClick={startAdd}>
            <Icon name="plus" size={14} /> 추가
          </button>
        </div>

        <div className="card flush">
          <table className="admin-table">
            <thead>
              <tr>
                <th>공연장명</th>
                <th>위치</th>           {/* 백엔드 필드: location */}
                <th>Instagram</th>      {/* 백엔드 필드: instagramUrl */}
                <th>홈페이지</th>        {/* 백엔드 필드: homepageUrl */}
                <th>설명</th>           {/* 백엔드 필드: description */}
                <th></th>
              </tr>
            </thead>
            <tbody>

              {/* 추가 모드: 테이블 상단에 빈 입력 행 표시 */}
              {adding && (
                <tr className="editing">
                  <td><input className="table-input" placeholder="공연장명 *" value={form.name} onChange={(e) => setField('name', e.target.value)} /></td>
                  <td><input className="table-input" placeholder="위치 *" value={form.location} onChange={(e) => setField('location', e.target.value)} /></td>
                  <td><input className="table-input" placeholder="https://..." value={form.instagramUrl} onChange={(e) => setField('instagramUrl', e.target.value)} /></td>
                  <td><input className="table-input" placeholder="https://..." value={form.homepageUrl} onChange={(e) => setField('homepageUrl', e.target.value)} /></td>
                  <td><input className="table-input" placeholder="메모" value={form.description} onChange={(e) => setField('description', e.target.value)} /></td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <button className="btn wine sm" onClick={saveAdd}><Icon name="check" size={13} stroke={2.5} /></button>
                      <button className="btn ghost sm" onClick={() => setAdding(false)}><Icon name="x" size={13} /></button>
                    </div>
                  </td>
                </tr>
              )}

              {/* 기존 공연장 목록 */}
              {venues.map((v) => (
                <tr key={v.id} className={editing === v.id ? 'editing' : ''}>
                  {editing === v.id ? (
                    // 수정 모드: 해당 행을 input으로 전환
                    <>
                      <td><input className="table-input" value={form.name} onChange={(e) => setField('name', e.target.value)} /></td>
                      <td><input className="table-input" value={form.location} onChange={(e) => setField('location', e.target.value)} /></td>
                      <td><input className="table-input" value={form.instagramUrl} onChange={(e) => setField('instagramUrl', e.target.value)} /></td>
                      <td><input className="table-input" value={form.homepageUrl} onChange={(e) => setField('homepageUrl', e.target.value)} /></td>
                      <td><input className="table-input" value={form.description} onChange={(e) => setField('description', e.target.value)} /></td>
                      <td>
                        <div className="row" style={{ gap: 6 }}>
                          <button className="btn wine sm" onClick={saveEdit}><Icon name="check" size={13} stroke={2.5} /></button>
                          <button className="btn ghost sm" onClick={() => setEditing(null)}><Icon name="x" size={13} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    // 일반 모드: 데이터 표시
                    <>
                      <td><b>{v.name}</b></td>
                      <td className="muted">{v.location}</td>
                      <td>
                        {v.instagramUrl
                          ? <a href={v.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>링크</a>
                          : <span className="muted">—</span>
                        }
                      </td>
                      <td>
                        {v.homepageUrl
                          ? <a href={v.homepageUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>링크</a>
                          : <span className="muted">—</span>
                        }
                      </td>
                      <td className="muted" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.description || '—'}
                      </td>
                      <td>
                        <button className="btn ghost sm" onClick={() => startEdit(v)}>
                          <Icon name="edit" size={13} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {venues.length === 0 && !adding && (
            <div className="empty-state sm"><p className="muted">등록된 공연장이 없습니다</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
