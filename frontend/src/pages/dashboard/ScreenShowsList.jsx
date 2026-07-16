// MUSICIAN 대시보드 — 본인 공연 이력 전체 목록 화면
import { useState, useEffect } from 'react'; // useState: 상태 / useEffect: API 호출
import Icon from '../../components/Icon';    // 아이콘
import Spinner from '../../components/Spinner'; // 로딩 스피너
import ShowRow from '../visitor/ShowRow';    // 공연 한 줄 컴포넌트 (Performance 형식)
import AddShowModal from './AddShowModal';   // 공연 추가 모달
import { api } from '../../api/client';     // 백엔드 API 호출 함수 모음

// me: App.jsx에서 전달받은 현재 로그인 유저의 정보
// me.musicianId: 이 유저의 뮤지션 프로필 DB id — getMusicianPerformances 호출에 필요
export default function ScreenShowsList({ navigate, onToast, me }) {
  // performances: 백엔드에서 받아온 내 공연 목록
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);

  // addOpen: 공연 추가 모달 표시 여부
  const [addOpen, setAddOpen] = useState(false);

  // 마운트 시 내 공연 목록 로드
  useEffect(() => {
    // musicianId가 없으면 (뮤지션 프로필 미등록) 로드하지 않음
    if (!me?.musicianId) {
      setLoading(false);
      return;
    }
    api.getMusicianPerformances(me.musicianId)    // GET /api/performances/musician/{id}
      .then(setPerformances)
      .catch(() => onToast && onToast('공연 목록 조회 실패', 'ink'))
      .finally(() => setLoading(false));
  }, [me?.musicianId]);

  // 공연 추가 성공 시: 백엔드가 반환한 새 Performance 객체를 목록 맨 앞에 추가
  const addShow = (created) => {
    setPerformances((prev) => [created, ...prev]);
    onToast && onToast('공연 이력이 추가됐습니다');
  };

  if (loading) {
    return <div className="main dashboard-main"><div className="pad"><Spinner label="공연 목록을 불러오는 중..." /></div></div>;
  }

  // 뮤지션 프로필이 아직 없는 경우 안내
  if (!me?.musicianId) {
    return (
      <div className="main dashboard-main">
        <div className="pad tight">
          <p className="muted">뮤지션 프로필을 먼저 등록해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main dashboard-main">
      <div className="pad tight">
        <a className="back-link" onClick={() => navigate('dashboard')}>
          <Icon name="arrow-left" size={15} /> 대시보드
        </a>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 20px' }}>
          <h1 className="h2 serif" style={{ margin: 0 }}>공연 이력 ({performances.length})</h1>
          <button className="btn primary sm" onClick={() => setAddOpen(true)}>
            <Icon name="plus" size={14} /> 추가
          </button>
        </div>

        {performances.length > 0 ? (
          <div className="card flush">
            {performances.map((p) => (
              // ShowRow에 Performance 객체 전달
              <ShowRow key={p.id} show={p} navigate={navigate} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Icon name="calendar" size={28} color="var(--mute)" />
            <p className="muted">등록된 공연 이력이 없습니다</p>
            <button className="btn primary sm" onClick={() => setAddOpen(true)}>
              <Icon name="plus" size={14} /> 첫 공연 추가
            </button>
          </div>
        )}
      </div>

      {/* 공연 추가 모달 — 열려 있을 때만 렌더링 */}
      {addOpen && <AddShowModal onClose={() => setAddOpen(false)} onAdd={addShow} />}
    </div>
  );
}
