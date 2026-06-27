import Avatar from './Avatar';
import Icon from './Icon';
import { DATA } from '../data/mockData';

export default function AdminSidebar({ route, navigate, onLogout }) {
  const pending = DATA.verifyQueue.length;
  const items = [
    ['admin-home', 'dashboard', '대시보드', null],
    ['admin-verify', 'shield', '뮤지션 인증', pending],
    ['admin-venues', 'building', '공연장 관리', DATA.venues.length],
    ['admin-concerts', 'ticket', '공연 관리', DATA.concerts.length],
  ];
  return (
    <div className="sidebar admin">
      <div className="section">관리자 콘솔</div>
      {items.map(([r, ico, label, count]) => (
        <a key={r} className={route === r ? 'active' : ''} onClick={() => navigate(r)}>
          <span className="ico"><Icon name={ico} /></span>
          <span className="grow">{label}</span>
          {count != null ? <span className={`count ${r === 'admin-verify' && count > 0 ? 'alert' : ''}`}>{count}</span> : null}
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