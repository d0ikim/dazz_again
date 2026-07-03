// 공연 이력 추가 모달 — MUSICIAN이 본인 공연을 직접 등록하는 폼
import { useState, useEffect } from 'react'; // useState: 폼 상태 / useEffect: 공연장 목록 로드
import Icon from '../../components/Icon';    // 아이콘 컴포넌트
import { api } from '../../api/client';      // 백엔드 API 호출 함수 모음

export default function AddShowModal({ onClose, onAdd }) {
  // form: 입력 중인 공연 정보
  // venueId: 선택한 공연장의 DB id (드롭다운)
  // date, time: 별도 입력 후 "2026-05-18T20:00:00" 형식으로 합쳐서 서버에 전송
  // title: 공연명
  // genre: 장르 (선택)
  // setInfo: 세트 정보 (선택, 예: "1부 20:00~20:40")
  // sourceUrl: 출처 링크 (선택, 예: 인스타 포스트 URL)
  const [form, setForm] = useState({
    venueId: '',
    date: '',
    time: '20:00',
    title: '',
    genre: '',
    setInfo: '',
    sourceUrl: '',
  });

  // venues: 공연장 드롭다운에 표시할 목록
  const [venues, setVenues] = useState([]);

  // 모달이 열릴 때 공연장 목록 로드
  useEffect(() => {
    api.getVenues()             // GET /api/venues
      .then(setVenues)
      .catch(() => {});         // 실패해도 수동 입력 가능하므로 무시
  }, []);

  // 특정 필드 하나를 업데이트하는 헬퍼
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // 제출 처리 — POST /api/performances
  const submit = () => {
    // date + time → "2026-05-18T20:00:00" 형식의 LocalDateTime 문자열로 조합
    const startTime = `${form.date}T${form.time}:00`;

    const body = {
      venueId: Number(form.venueId),           // Long 타입으로 변환
      startTime,                               // ISO 형식 ("2026-05-18T20:00:00")
      title: form.title,
      genre: form.genre || null,               // 빈 문자열이면 null로 전송
      setInfo: form.setInfo || null,
      setList: null,                           // 이 폼에서는 셋리스트 입력 미지원
      sourceUrl: form.sourceUrl || null,
    };

    api.createPerformance(body)                // POST /api/performances
      .then((created) => {
        onAdd(created);                        // 부모(ScreenShowsList)에 새 공연 전달
        onClose();
      })
      .catch(() => alert('공연 등록에 실패했습니다. 다시 시도해주세요.'));
  };

  // 필수 입력값이 모두 있는지 확인 (제출 버튼 활성화 조건)
  const canSubmit = form.venueId && form.date && form.title;

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* e.stopPropagation(): 모달 내부 클릭이 오버레이 클릭으로 전파되는 것을 막음 */}
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 className="serif" style={{ fontSize: 20, fontWeight: 700 }}>공연 이력 추가</h2>
          <button className="btn icon ghost sm" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        <div className="form-grid">
          {/* 공연명 — 백엔드 필드: title */}
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label className="label">공연명 *</label>
            <input
              type="text"
              placeholder="예: 김재즈 트리오 정기공연"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          {/* 공연장 선택 — venueId 드롭다운 (백엔드에서 목록 로드) */}
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label className="label">공연장 *</label>
            <select value={form.venueId} onChange={(e) => set('venueId', e.target.value)}>
              <option value="">공연장을 선택하세요</option>
              {venues.map((v) => (
                // value는 숫자 id, 표시는 name + location
                <option key={v.id} value={v.id}>{v.name} — {v.location}</option>
              ))}
            </select>
          </div>

          {/* 날짜 — date 입력 후 time과 합쳐서 startTime으로 전송 */}
          <div className="field">
            <label className="label">날짜 *</label>
            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>

          {/* 시간 */}
          <div className="field">
            <label className="label">시작 시간</label>
            <input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
          </div>

          {/* 장르 — 선택 항목 */}
          <div className="field">
            <label className="label">장르</label>
            <input type="text" placeholder="예: JAZZ, LATIN, FUSION" value={form.genre} onChange={(e) => set('genre', e.target.value)} />
          </div>

          {/* 세트 정보 — 선택 항목 */}
          <div className="field">
            <label className="label">세트 정보</label>
            <input type="text" placeholder="예: 1부 20:00~20:40" value={form.setInfo} onChange={(e) => set('setInfo', e.target.value)} />
          </div>

          {/* 출처 링크 — 선택 항목 */}
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label className="label">출처 링크</label>
            <input type="url" placeholder="인스타 포스트 URL 등" value={form.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} />
          </div>
        </div>

        {/* 라인업 — 백엔드 API가 출연진을 별도로 받지 않으므로 미지원 안내 */}
        <div className="coming-soon-box" style={{ marginTop: 12 }}>
          <Icon name="users" size={16} color="var(--mute)" />
          <span className="coming-soon-label">라인업 등록 준비 중</span>
          <span className="coming-soon-sub">함께 공연한 뮤지션 태그 기능은 곧 제공될 예정입니다</span>
        </div>

        <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button className="btn ghost" onClick={onClose}>취소</button>
          {/* canSubmit: 필수 항목 미입력 시 버튼 비활성화 */}
          <button className="btn primary" disabled={!canSubmit} onClick={submit}>
            <Icon name="plus" size={15} /> 추가
          </button>
        </div>
      </div>
    </div>
  );
}
