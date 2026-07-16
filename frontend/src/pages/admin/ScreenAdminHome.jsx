// 관리자 대시보드 메인 화면 — 플랫폼 현황 통계와 최근 인증 요청을 한눈에 표시
import { useState, useEffect } from 'react'; // useState: 상태 / useEffect: 마운트 시 API 호출
import Icon from '../../components/Icon';    // 아이콘
import Spinner from '../../components/Spinner'; // 로딩 스피너
import { api } from '../../api/client';     // 백엔드 API 호출 함수 모음

export default function ScreenAdminHome({ navigate }) {
  // 각 카운트 상태 — null이면 로딩 중, 숫자면 완료
  const [pendingList, setPendingList] = useState([]);     // 인증 대기 목록 (전체 표시용)
  const [musicianCount, setMusicianCount] = useState(null);
  const [venueCount, setVenueCount] = useState(null);
  const [concertCount, setConcertCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 네 API를 병렬로 호출해 통계 업데이트
    Promise.all([
      api.getVerifyQueue(),    // GET /api/admin/verify/pending → PENDING 인증 요청 목록
      api.getMusicians(),      // GET /api/musicians → 뮤지션 전체 목록
      api.getVenues(),         // GET /api/venues → 공연장 전체 목록
      api.getPerformances(),   // GET /api/performances → 공연 전체 목록
    ])
      .then(([pending, musicians, venues, concerts]) => {
        setPendingList(pending);
        setMusicianCount(musicians.length);
        setVenueCount(venues.length);
        setConcertCount(concerts.length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 통계 카드 데이터 — 실제 API 카운트 기반
  const stats = [
    { label: '등록 뮤지션', val: loading ? '—' : musicianCount, icon: 'users', route: 'directory', alert: false },
    { label: '인증 대기', val: loading ? '—' : pendingList.length, icon: 'shield', route: 'admin-verify', alert: pendingList.length > 0 },
    { label: '공연장', val: loading ? '—' : venueCount, icon: 'building', route: 'admin-venues', alert: false },
    { label: '등록 공연', val: loading ? '—' : concertCount, icon: 'ticket', route: 'admin-concerts', alert: false },
  ];

  return (
    <div className="main dashboard-main">
      <div className="pad">
        <h1 className="h2 serif" style={{ marginBottom: 6 }}>관리자 대시보드</h1>
        <p className="muted" style={{ marginBottom: 20 }}>DAZZ 플랫폼 현황을 한눈에 확인하세요.</p>

        {/* 인증 대기 건수가 있을 때 알림 배너 표시 */}
        {pendingList.length > 0 && (
          <div className="banner alert" style={{ marginBottom: 20 }}>
            <Icon name="shield" size={16} color="var(--wine)" />
            <span className="grow" style={{ fontSize: 13 }}>
              <b>{pendingList.length}건</b>의 뮤지션 인증 요청이 대기 중입니다.
            </span>
            <button className="btn primary sm" onClick={() => navigate('admin-verify')}>검토하기</button>
          </div>
        )}

        {/* 통계 카드 그리드 */}
        <div className="admin-stat-grid">
          {stats.map((s) => (
            <div key={s.label} className={`admin-stat-card ${s.alert ? 'alert' : ''}`} onClick={() => navigate(s.route)}>
              <div className="row" style={{ gap: 10, alignItems: 'center' }}>
                <span className="asc-ico"><Icon name={s.icon} size={18} color={s.alert ? 'var(--wine)' : 'var(--ink)'} /></span>
                <span className="asc-label">{s.label}</span>
              </div>
              <span className={`asc-val ${s.alert ? 'alert' : ''}`}>{s.val}</span>
            </div>
          ))}
        </div>

        {/* 최근 인증 요청 목록 — getVerifyQueue는 PENDING만 반환 */}
        <section style={{ marginTop: 28 }}>
          <h3 className="section-label">최근 인증 요청</h3>
          <div className="card flush">
            {pendingList.length > 0 ? pendingList.slice(0, 3).map((r) => (
              <div key={r.id} className="verify-row" onClick={() => navigate('admin-verify')}>
                <div className="col grow" style={{ gap: 2 }}>
                  <div className="row" style={{ gap: 8 }}>
                    {/* userNickname: 백엔드 VerifyRequestResponse 필드명 */}
                    <b style={{ fontSize: 14 }}>{r.userNickname}</b>
                    <span className="pill wine sm">PENDING</span>
                  </div>
                  {/* requestedAt: "2026-05-18T20:00:00" 형식의 ISO 문자열 */}
                  <span className="muted" style={{ fontSize: 12 }}>{r.requestedAt?.slice(0, 10)}</span>
                </div>
                <Icon name="arrow-right" size={14} color="var(--mute)" />
              </div>
            )) : (
              <div className="empty-state sm">
                {loading ? <Spinner /> : <p className="muted">대기 중인 인증 요청이 없습니다</p>}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
