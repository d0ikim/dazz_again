import Logo from './Logo';
import Avatar from './Avatar';
import Icon from './Icon';

// onMenuClick: 모바일 햄버거(☰) 버튼 클릭 시 드로어를 열고 닫는 콜백 (App.jsx에서 전달)
export default function Topbar({ route, navigate, mode = 'visitor', me, auth = { role: 'guest' }, onLoginClick, onLogout, onMenuClick }) {
  const publicNav = true; // 모든 역할에서 공연장/공연/인맥지도 nav 표시
  return (
    <div className="topbar">
      <div className="row" style={{ gap: 32 }}>
        {/* 햄버거 버튼 — CSS(.menu-btn)에 의해 768px 이하에서만 보임 */}
        <button className="btn icon ghost sm menu-btn" aria-label="메뉴 열기" onClick={onMenuClick}>
          <Icon name="menu" size={18} />
        </button>
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
            {/* hide-sm: 모바일에서는 숨김 (드로어 메뉴에 같은 항목이 있음) */}
            <button className="btn secondary sm hide-sm" onClick={() => onLoginClick && onLoginClick('become')}>뮤지션이세요?</button>
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
            {/* 유저 정보 칩 — 모바일에서는 공간이 좁아 숨김 */}
            <div className="user-chip hide-sm">
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
            <span className="pill ink-solid hide-sm"><Icon name="shield" size={13} /> ADMIN</span>
            <button className="btn primary sm" onClick={() => navigate('admin-home')}>관리자 대시보드</button>
            {/* hide-sm: 모바일에서는 숨김 (드로어 메뉴로 대체) */}
            <button className="btn ghost sm hide-sm" onClick={() => navigate('directory')}><Icon name="external" size={14} /> 사이트 보기</button>
            <Avatar name="관" ink />
            <button className="btn ghost sm" onClick={onLogout}><Icon name="logout" size={14} /></button>
          </>
        ) : (
          <>
            <button className="btn primary sm" onClick={() => navigate('dashboard')}>
              마이페이지
            </button>
            {/* hide-sm: 모바일에서는 숨김 (사이드바 드로어에서 이동 가능) */}
            <button className="btn ghost sm hide-sm" onClick={() => navigate('profile-public')}>
              <Icon name="external" size={14} /> 공개 프로필
            </button>
            <Avatar name={auth.name || me?.name || ''} tier={me?.tier} />
            <button className="btn ghost sm" onClick={onLogout}><Icon name="logout" size={14} /></button>
          </>
        )}
      </div>
    </div>
  );
}