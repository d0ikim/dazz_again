import Avatar from './Avatar';
import Icon from './Icon';

export default function Sidebar({ route, navigate, me, onLogout }) {
  const items = [
    ['dashboard', 'home', '대시보드'],
    ['profile-edit', 'user', '내 프로필'],
    ['shows-list', 'calendar', '공연 이력'],
    ['albums-list', 'music', '앨범 참여'],
    ['graph-mine', 'graph', '관계도'],
  ];
  return (
    <div className="sidebar">
      <div className="section">관리</div>
      {items.map(([r, ico, label]) => (
        <a key={r} className={route === r ? 'active' : ''} onClick={() => navigate(r)}>
          <span className="ico"><Icon name={ico} /></span>
          {label}
        </a>
      ))}
      <div className="section" style={{ marginTop: 16 }}>곧 출시</div>
      <a style={{ opacity: 0.45, cursor: 'default' }}>
        <span className="ico"><Icon name="spark" /></span>
        도슨트 노트
      </a>
      <div className="me">
        <Avatar name={me?.name || ''} tier={me?.tier} />
        <div className="col" style={{ gap: 0, flex: 1 }}>
          <b style={{ fontSize: 13 }}>{me?.name}</b>
          <span className="mono" style={{ fontSize: 10, color: 'var(--mute)' }}>{me?.role}</span>
        </div>
        <button className="btn icon ghost sm" title="로그아웃" onClick={onLogout}><Icon name="logout" size={14} /></button>
      </div>
    </div>
  );
}