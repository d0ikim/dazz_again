import Logo from './Logo';
import Avatar from './Avatar';
import Icon from './Icon';

export default function Topbar({ route, navigate, mode = 'visitor', me, auth = { role: 'guest' }, onLoginClick, onLogout }) {
  const publicNav = mode === 'visitor' || mode === 'general';
  return (
    <div className="topbar">
      <div className="row" style={{ gap: 32 }}>
        <Logo tagline onClick={() => navigate('directory')} />
        {publicNav ? (
          <nav className="nav">
            <a className={route === 'directory' ? 'active' : ''} onClick={() => navigate('directory')}>뮤지션</a>
            <a className={route === 'venues' ? 'active' : ''} onClick={() => navigate('venues')}>공연장</a>
            <a className={route === 'concerts' ? 'active' : ''} onClick={() => navigate('concerts')}>공연</a>
            <a className={route === 'playdb' ? 'active' : ''} onClick={() => navigate('playdb')}>인맥지도</a>
          </nav>
        ) : null}
      </div>
      <div className="right">
        {auth.role === 'guest' ? (
          <>
            <button className="btn secondary sm" onClick={() => onLoginClick && onLoginClick('become')}>뮤지션이세요?</button>
            <button className="btn kakao sm" onClick={() => onLoginClick && onLoginClick()}>
              <Icon name="chat" size={14} /> 카카오 로그인
            </button>
          </>
        ) : auth.role === 'general' ? (
          <>
            {auth.pending ? (
              <button className="btn ghost sm" onClick={() => navigate('pending')}>
                <Icon name="clock" size={14} /> 인증 심사중
              </button>
            ) : (
              <button className="btn primary sm" onClick={() => navigate('become-musician')}>
                <Icon name="plus" size={14} /> 뮤지션 등록
              </button>
            )}
            <div className="user-chip">
              <Avatar name={auth.name || '게'} size="sm" />
              <div className="col" style={{ gap: 0 }}>
                <b style={{ fontSize: 12, lineHeight: 1.2 }}>{auth.name || '게스트'}</b>
                <span className="mono" style={{ fontSize: 9, color: 'var(--mute)' }}>GENERAL</span>
              </div>
            </div>
            <button className="btn ghost sm" onClick={onLogout}><Icon name="logout" size={14} /></button>
          </>
        ) : auth.role === 'admin' ? (
          <>
            <span className="pill ink-solid"><Icon name="shield" size={13} /> ADMIN</span>
            <button className="btn ghost sm" onClick={() => navigate('directory')}><Icon name="external" size={14} /> 사이트 보기</button>
            <Avatar name="관" ink />
            <button className="btn ghost sm" onClick={onLogout}><Icon name="logout" size={14} /></button>
          </>
        ) : (
          <>
            <button className="btn ghost sm" onClick={() => navigate('profile-public')}>
              <Icon name="external" size={14} /> 공개 프로필 보기
            </button>
            <Avatar name={auth.name || me?.name || ''} tier={me?.tier} />
            <button className="btn ghost sm" onClick={onLogout}><Icon name="logout" size={14} /></button>
          </>
        )}
      </div>
    </div>
  );
}