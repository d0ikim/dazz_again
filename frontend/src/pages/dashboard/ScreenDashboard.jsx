// MUSICIAN 대시보드 메인 화면
// 공연 통계, 예정 공연, 최근 공연 이력을 한눈에 보여주는 화면
import { useState, useEffect } from 'react'; // useState: 상태 / useEffect: API 호출
import Icon from '../../components/Icon';    // 아이콘
import Avatar from '../../components/Avatar'; // 아바타
import ShowRow from '../visitor/ShowRow';    // 공연 한 줄 컴포넌트
import { api } from '../../api/client';     // 백엔드 API 호출 함수 모음

// 공연이 예정 상태인지 판단
function isUpcoming(p) {
  if (p.cancelled) return false;
  return new Date(p.startTime) > new Date();
}

// me: App.jsx에서 전달받은 유저 + 뮤지션 정보
// me.nickname: 카카오 닉네임
// me.stageName: 뮤지션 활동명
// me.position: 악기
// me.musicianId: 뮤지션 프로필 DB id
export default function ScreenDashboard({ navigate, me }) {
  // performances: 내 전체 공연 목록
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!me?.musicianId) {
      setLoading(false);
      return;
    }
    api.getMusicianPerformances(me.musicianId)   // GET /api/performances/musician/{id}
      .then(setPerformances)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [me?.musicianId]);

  // 통계 계산 — 실제 공연 데이터 기반
  const upcomingList = performances.filter(isUpcoming);
  const pastList = performances.filter((p) => !isUpcoming(p));

  // 표시 이름: 뮤지션 활동명 우선, 없으면 카카오 닉네임
  const displayName = me?.stageName || me?.nickname || '—';

  return (
    <div className="main dashboard-main">
      <div className="pad">
        {/* 대시보드 상단 히어로 */}
        <div className="dash-hero">
          <Avatar name={displayName} size="xl" />
          <div className="col" style={{ gap: 6 }}>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <h1 className="h2 serif" style={{ margin: 0 }}>{displayName}</h1>
            </div>
            {/* position: 악기 (백엔드 필드명) */}
            {me?.position && <span className="role-label">{me.position}</span>}
          </div>
          <div className="dash-actions">
            <button className="btn primary" onClick={() => navigate('resume-public')}>
              <Icon name="external" size={14} /> 이력서 보기
            </button>
            <button className="btn secondary" onClick={() => navigate('profile-edit')}>
              <Icon name="edit" size={14} /> 프로필 편집
            </button>
          </div>
        </div>

        {/* 통계 카드 — 실제 공연 데이터 기반 */}
        <div className="dash-stat-row">
          <div className="stat-card" onClick={() => navigate('shows-list')}>
            <span className="sc-val">{loading ? '—' : performances.length}</span>
            <span className="sc-key">총 공연</span>
          </div>
          <div className="stat-card">
            {/* 앨범 수: 백엔드 미구현 */}
            <span className="sc-val">—</span>
            <span className="sc-key">앨범 참여</span>
          </div>
          <div className="stat-card" onClick={() => navigate('concerts')}>
            <span className="sc-val">{loading ? '—' : upcomingList.length}</span>
            <span className="sc-key">예정 공연</span>
          </div>
          <div className="stat-card" onClick={() => navigate('graph-mine')}>
            {/* 협연 뮤지션 수: 그래프 API 별도 호출 필요 — 준비 중 */}
            <span className="sc-val">—</span>
            <span className="sc-key">협연 뮤지션</span>
          </div>
        </div>

        <div className="dash-two-col">
          {/* 예정 공연 섹션 */}
          <section>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 className="section-label" style={{ margin: 0 }}>예정 공연</h3>
              <button className="btn ghost sm" onClick={() => navigate('concerts')}>
                전체 보기 <Icon name="arrow-right" size={13} />
              </button>
            </div>
            <div className="card flush">
              {upcomingList.length > 0
                ? upcomingList.slice(0, 3).map((p) => <ShowRow key={p.id} show={p} navigate={navigate} />)
                : <div className="empty-state sm"><p className="muted">예정된 공연이 없습니다</p></div>
              }
            </div>
          </section>

          {/* 최근 공연 이력 섹션 */}
          <section>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 className="section-label" style={{ margin: 0 }}>최근 공연 이력</h3>
              <button className="btn ghost sm" onClick={() => navigate('shows-list')}>
                전체 보기 <Icon name="arrow-right" size={13} />
              </button>
            </div>
            <div className="card flush">
              {pastList.length > 0
                ? pastList.slice(0, 3).map((p) => <ShowRow key={p.id} show={p} navigate={navigate} />)
                : <div className="empty-state sm"><p className="muted">지난 공연 이력이 없습니다</p></div>
              }
            </div>
          </section>
        </div>

        {/* 앨범 참여 — 백엔드 미구현, 준비 중 표시 */}
        <section style={{ marginTop: 22 }}>
          <h3 className="section-label">앨범 참여</h3>
          <div className="coming-soon-box">
            <Icon name="disc" size={22} color="var(--mute)" />
            <span className="coming-soon-label">앨범 정보 준비 중</span>
            <span className="coming-soon-sub">앨범 참여 이력 기능은 곧 제공될 예정입니다</span>
          </div>
        </section>
      </div>
    </div>
  );
}
