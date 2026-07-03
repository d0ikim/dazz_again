// 관리자 전용 사이드바 — 관리자 콘솔 메뉴와 각 항목의 건수를 표시
import { useState, useEffect } from 'react'; // useEffect: 마운트 시 API 카운트 로드
import Avatar from './Avatar';               // 이니셜 아바타
import Icon from './Icon';                   // 아이콘
import { api } from '../api/client';         // 백엔드 API 호출 함수 모음

export default function AdminSidebar({ route, navigate, onLogout }) {
  // 각 항목의 건수 — 실제 API 데이터 기반
  const [pendingCount, setPendingCount] = useState(null);  // 인증 대기
  const [venueCount, setVenueCount] = useState(null);      // 공연장 수
  const [concertCount, setConcertCount] = useState(null);  // 공연 수

  useEffect(() => {
    // 세 API를 병렬로 호출해 카운트 업데이트
    api.getVerifyQueue().then((list) => setPendingCount(list.length)).catch(() => setPendingCount(0));
    api.getVenues().then((list) => setVenueCount(list.length)).catch(() => setVenueCount(0));
    api.getPerformances().then((list) => setConcertCount(list.length)).catch(() => setConcertCount(0));
  }, []);

  const items = [
    ['admin-home', 'dashboard', '대시보드', null],
    ['admin-verify', 'shield', '뮤지션 인증', pendingCount],
    ['admin-venues', 'building', '공연장 관리', venueCount],
    ['admin-concerts', 'ticket', '공연 관리', concertCount],
  ];

  return (
    <div className="sidebar admin">
      <div className="section">관리자 콘솔</div>
      {items.map(([r, ico, label, count]) => (
        <a key={r} className={route === r ? 'active' : ''} onClick={() => navigate(r)}>
          <span className="ico"><Icon name={ico} /></span>
          <span className="grow">{label}</span>
          {/* count가 null이면 로딩 중 (표시 안 함), 숫자면 배지 표시 */}
          {count != null ? (
            <span className={`count ${r === 'admin-verify' && count > 0 ? 'alert' : ''}`}>{count}</span>
          ) : null}
        </a>
      ))}
      <div className="me">
        <Avatar name="관" ink />
        <div className="col" style={{ gap: 0, flex: 1 }}>
          <b style={{ fontSize: 13 }}>관리자</b>
          <span className="mono" style={{ fontSize: 10, color: 'var(--mute)' }}>ADMIN · 운영자</span>
        </div>
        <button className="btn icon ghost sm" title="로그아웃" onClick={onLogout}><Icon name="logout" size={14} /></button>
      </div>
    </div>
  );
}
