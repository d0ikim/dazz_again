// 어드민 — 뮤지션 관리 페이지
// 뮤지션 목록을 테이블로 표시하고 인라인 수정·추가 기능을 제공하는 화면
import { useState, useEffect } from 'react'; // useState: 상태 관리 / useEffect: 마운트 시 API 호출
import Icon from '../../components/Icon';     // 아이콘 컴포넌트
import { api } from '../../api/client';       // 백엔드 API 호출 함수 모음

// 폼 초기값 — 추가 모드 진입 시 빈 입력 필드를 만들기 위해 사용
const EMPTY_FORM = { stageName: '', realName: '', position: '', bio: '', snsUrl: '', profileImageUrl: '', sourceUrl: '' };

export default function ScreenAdminMusicians({ navigate, onToast }) {
  // musicians: 백엔드에서 받아온 뮤지션 목록
  const [musicians, setMusicians] = useState([]);

  // loading: API 응답 대기 중 여부
  const [loading, setLoading] = useState(true);

  // editing: 현재 인라인 수정 중인 뮤지션 id (null이면 수정 모드 아님)
  const [editing, setEditing] = useState(null);

  // adding: 새 뮤지션 추가 모드 여부 (true면 테이블 상단에 빈 입력 행 표시)
  const [adding, setAdding] = useState(false);

  // form: 수정·추가 중인 필드값을 담는 객체
  const [form, setForm] = useState({});

  // 마운트 시 전체 뮤지션 목록 로드
  useEffect(() => {
    api.getMusicians()                      // GET /api/musicians
      .then((data) => setMusicians(data))
      .catch(() => onToast && onToast('뮤지션 목록 조회 실패', 'ink'))
      .finally(() => setLoading(false));
  }, []);

  // 수정 모드 시작 — 선택한 뮤지션의 현재 값을 form에 복사
  const startEdit = (m) => {
    setAdding(false); // 추가 모드와 수정 모드는 동시에 활성화되지 않도록
    setEditing(m.id);
    setForm({
      stageName: m.stageName || '',
      realName: m.realName || '',
      position: m.position || '',
      bio: m.bio || '',
      snsUrl: m.snsUrl || '',
      profileImageUrl: m.profileImageUrl || '',
      sourceUrl: m.sourceUrl || '',
    });
  };

  // 수정 저장 — PUT /api/admin/musicians/{id}
  const saveEdit = () => {
    api.updateMusician(editing, form)
      .then((updated) => {
        // 성공: 로컬 목록에서 해당 항목을 백엔드가 반환한 최신 값으로 교체
        setMusicians((prev) => prev.map((m) => m.id === editing ? updated : m));
        onToast && onToast('뮤지션 정보가 저장됐습니다');
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

  // 추가 저장 — POST /api/admin/musicians
  const saveAdd = () => {
    api.createMusician(form)
      .then((created) => {
        // 성공: 백엔드가 반환한 새 뮤지션 객체를 목록 맨 앞에 추가
        setMusicians((prev) => [created, ...prev]);
        onToast && onToast('뮤지션이 등록됐습니다');
        setAdding(false);
      })
      .catch(() => onToast && onToast('등록 실패', 'ink'));
  };

  // form 필드 하나를 업데이트하는 헬퍼 함수
  // key: 필드명 (예: 'stageName') / value: 새 입력값
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <div className="main dashboard-main">
        <div className="pad"><p className="muted">뮤지션 목록을 불러오는 중...</p></div>
      </div>
    );
  }

  return (
    <div className="main dashboard-main">
      <div className="pad">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 className="h2 serif" style={{ margin: 0 }}>뮤지션 관리 ({musicians.length})</h1>
          <button className="btn primary sm" onClick={startAdd}>
            <Icon name="plus" size={14} /> 추가
          </button>
        </div>

        <div className="card flush">
          <table className="admin-table">
            <thead>
              <tr>
                <th>활동명</th>
                <th>본명</th>            {/* 백엔드 필드: realName */}
                <th>악기</th>            {/* 백엔드 필드: position */}
                <th>소개</th>            {/* 백엔드 필드: bio */}
                <th>SNS</th>            {/* 백엔드 필드: snsUrl */}
                <th>출처</th>            {/* 백엔드 필드: sourceUrl */}
                <th></th>
              </tr>
            </thead>
            <tbody>

              {/* 추가 모드: 테이블 상단에 빈 입력 행 표시 */}
              {adding && (
                <tr className="editing">
                  <td><input className="table-input" placeholder="활동명 *" value={form.stageName} onChange={(e) => setField('stageName', e.target.value)} /></td>
                  <td><input className="table-input" placeholder="본명" value={form.realName} onChange={(e) => setField('realName', e.target.value)} /></td>
                  <td><input className="table-input" placeholder="PIANO *" value={form.position} onChange={(e) => setField('position', e.target.value)} /></td>
                  <td><input className="table-input" placeholder="소개" value={form.bio} onChange={(e) => setField('bio', e.target.value)} /></td>
                  <td><input className="table-input" placeholder="https://..." value={form.snsUrl} onChange={(e) => setField('snsUrl', e.target.value)} /></td>
                  <td><input className="table-input" placeholder="https://..." value={form.sourceUrl} onChange={(e) => setField('sourceUrl', e.target.value)} /></td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <button className="btn wine sm" onClick={saveAdd}><Icon name="check" size={13} stroke={2.5} /></button>
                      <button className="btn ghost sm" onClick={() => setAdding(false)}><Icon name="x" size={13} /></button>
                    </div>
                  </td>
                </tr>
              )}

              {/* 기존 뮤지션 목록 */}
              {musicians.map((m) => (
                <tr key={m.id} className={editing === m.id ? 'editing' : ''}>
                  {editing === m.id ? (
                    // 수정 모드: 해당 행을 input으로 전환
                    <>
                      <td><input className="table-input" value={form.stageName} onChange={(e) => setField('stageName', e.target.value)} /></td>
                      <td><input className="table-input" value={form.realName} onChange={(e) => setField('realName', e.target.value)} /></td>
                      <td><input className="table-input" value={form.position} onChange={(e) => setField('position', e.target.value)} /></td>
                      <td><input className="table-input" value={form.bio} onChange={(e) => setField('bio', e.target.value)} /></td>
                      <td><input className="table-input" value={form.snsUrl} onChange={(e) => setField('snsUrl', e.target.value)} /></td>
                      <td><input className="table-input" value={form.sourceUrl} onChange={(e) => setField('sourceUrl', e.target.value)} /></td>
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
                      <td><b>{m.stageName}</b></td>
                      <td className="muted">{m.realName || '—'}</td>
                      <td className="muted">{m.position}</td>
                      <td className="muted" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.bio || '—'}
                      </td>
                      <td>
                        {m.snsUrl
                          ? <a href={m.snsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>링크</a>
                          : <span className="muted">—</span>
                        }
                      </td>
                      <td>
                        {m.sourceUrl
                          ? <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>링크</a>
                          : <span className="muted">—</span>
                        }
                      </td>
                      <td>
                        <button className="btn ghost sm" onClick={() => startEdit(m)}>
                          <Icon name="edit" size={13} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {musicians.length === 0 && !adding && (
            <div className="empty-state sm"><p className="muted">등록된 뮤지션이 없습니다</p></div>
          )}
        </div>
      </div>
    </div>
  );
}