// 모바일 전용 내비게이션 드로어 — PC에서 topbar에 가로로 나열되던 메뉴를 대신한다.
// 대시보드/관리자 화면에서는 Sidebar/AdminSidebar가 드로어 역할을 하므로 이 컴포넌트는 쓰이지 않는다.
// CSS의 .sidebar.mobile-nav 규칙에 의해 PC(769px 이상)에서는 아예 표시되지 않는다.
import Icon from './Icon'; // 메뉴 아이콘

// open: 드로어 열림 여부 (true면 .open 클래스가 붙어 슬라이드 인)
// route/navigate: 현재 라우트와 화면 이동 함수
// auth: 로그인 상태 — 역할(guest/general/musician/admin)에 따라 하단 메뉴가 달라짐
// onLoginClick: 카카오 로그인 모달 열기
export default function MobileNav({ open, route, navigate, auth = { role: 'guest' }, onLoginClick }) {
  // 모든 방문자에게 보이는 공용 메뉴 (topbar의 가로 메뉴와 동일)
  const links = [
    ['directory', 'users', '뮤지션'],
    ['venues', 'building', '공연장'],
    ['concerts', 'ticket', '공연'],
    ['playdb', 'graph', '인맥지도'],
  ];

  return (
    // .sidebar 스타일(드로어 슬라이드)을 재사용하고, .mobile-nav로 PC에서는 숨긴다
    <div className={`sidebar mobile-nav ${open ? 'open' : ''}`}>
      <div className="section">둘러보기</div>
      {links.map(([r, ico, label]) => (
        <a key={r} className={route === r ? 'active' : ''} onClick={() => navigate(r)}>
          <span className="ico"><Icon name={ico} /></span>
          {label}
        </a>
      ))}

      {/* 비로그인: 로그인/뮤지션 등록 안내 (topbar에서 hide-sm으로 숨긴 항목의 대체) */}
      {auth.role === 'guest' && (
        <>
          <div className="section" style={{ marginTop: 16 }}>계정</div>
          <a onClick={() => onLoginClick && onLoginClick()}>
            <span className="ico"><Icon name="chat" /></span>
            카카오 로그인
          </a>
          <a onClick={() => onLoginClick && onLoginClick('become')}>
            <span className="ico"><Icon name="music" /></span>
            뮤지션이세요?
          </a>
        </>
      )}

      {/* 일반 회원: 뮤지션 등록 신청 */}
      {auth.role === 'general' && (
        <>
          <div className="section" style={{ marginTop: 16 }}>내 계정</div>
          <a onClick={() => navigate('become-musician')}>
            <span className="ico"><Icon name="plus" /></span>
            뮤지션 등록
          </a>
        </>
      )}

      {/* 뮤지션: 마이페이지/공개 프로필 바로가기 */}
      {auth.role === 'musician' && (
        <>
          <div className="section" style={{ marginTop: 16 }}>내 계정</div>
          <a onClick={() => navigate('dashboard')}>
            <span className="ico"><Icon name="home" /></span>
            마이페이지
          </a>
          <a onClick={() => navigate('profile-public')}>
            <span className="ico"><Icon name="external" /></span>
            공개 프로필
          </a>
        </>
      )}

      {/* 관리자: 관리자 콘솔 바로가기 */}
      {auth.role === 'admin' && (
        <>
          <div className="section" style={{ marginTop: 16 }}>관리</div>
          <a onClick={() => navigate('admin-home')}>
            <span className="ico"><Icon name="shield" /></span>
            관리자 대시보드
          </a>
        </>
      )}
    </div>
  );
}
