import { useState, useEffect } from 'react';
import './styles/global.css';

import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import AdminSidebar from './components/AdminSidebar';
import MobileNav from './components/MobileNav'; // 모바일 전용 내비게이션 드로어
import Toast from './components/Toast';

import KakaoLoginModal from './pages/auth/KakaoLoginModal';
import LoginGate from './pages/auth/LoginGate';
import RoleGate from './pages/auth/RoleGate';
import ScreenBecomeMusician from './pages/auth/ScreenBecomeMusician';
import ScreenClaimExisting from './pages/auth/ScreenClaimExisting';
import ScreenPending from './pages/auth/ScreenPending';

import ScreenOnboarding from './pages/onboarding/ScreenOnboarding';

import ScreenDirectory from './pages/visitor/ScreenDirectory';
import ScreenPublicProfile from './pages/visitor/ScreenPublicProfile';

import ScreenVenues from './pages/venues/ScreenVenues';

import ScreenConcerts from './pages/concerts/ScreenConcerts';
import ScreenConcertDetail from './pages/concerts/ScreenConcertDetail';

import ScreenPlayDB from './pages/resume/ScreenPlayDB';
import ScreenResumePublic from './pages/resume/ScreenResumePublic';

import ScreenDashboard from './pages/dashboard/ScreenDashboard';
import ScreenProfileEdit from './pages/dashboard/ScreenProfileEdit';
import ScreenShowsList from './pages/dashboard/ScreenShowsList';

import ScreenAdminHome from './pages/admin/ScreenAdminHome';
import ScreenAdminVerify from './pages/admin/ScreenAdminVerify';
import ScreenAdminMusicians from './pages/admin/ScreenAdminMusicians';
import ScreenAdminVenues from './pages/admin/ScreenAdminVenues';
import ScreenAdminConcerts from './pages/admin/ScreenAdminConcerts';

import { api } from './api/client'; // mock 데이터 제거 — 실제 API 사용

const MUSICIAN_ROUTES = new Set(['dashboard', 'profile-edit', 'shows-list', 'albums-list', 'graph-mine', 'resume-public']);
const ADMIN_ROUTES = new Set(['admin-home', 'admin-verify', 'admin-musicians', 'admin-venues', 'admin-concerts']);

export default function App() {
  const parseHash = () => {
    const hash = window.location.hash.slice(1) || 'directory';
    const [r, ...rest] = hash.split('/');
    const params = rest.length ? JSON.parse(decodeURIComponent(rest.join('/'))) : {};
    return { route: r, params };
  };

  const [routeState, setRouteState] = useState(parseHash);
  const [auth, setAuth] = useState({ role: 'guest' });
  const [toast, setToast] = useState(null);
  const [loginModal, setLoginModal] = useState(false);
  const [loginReason, setLoginReason] = useState(null);
  // me: 로그인한 유저 정보 (null = 비로그인 or 아직 로드 중)
  // 로그인 후: { id, nickname, role, musicianId?, stageName?, position?, bio?, snsUrl? }
  const [me, setMe] = useState(null);
  // menuOpen: 모바일 드로어(햄버거 메뉴) 열림 여부 — PC 화면에서는 사용되지 않음
  const [menuOpen, setMenuOpen] = useState(false);

  const route = routeState.route;
  const routeParams = routeState.params;

  useEffect(() => {
    const onPop = () => setRouteState(parseHash());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // 앱 시작 시: URL에 토큰이 있으면 저장 후 제거, localStorage 토큰으로 로그인 상태 복원
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const isFreshLogin = !!urlToken;

    if (urlToken) {
      localStorage.setItem('token', urlToken);
      // URL에서 token 파라미터 제거 (브라우저 히스토리/주소창에 토큰이 노출되지 않도록)
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const roleMap = { GENERAL: 'general', MUSICIAN: 'musician', ADMIN: 'admin' };

    api.getMe()
      .then(user => {
        const role = roleMap[user.role] || 'guest';
        setAuth({ role, name: user.nickname, userId: user.id });

        if (role === 'musician') {
          // MUSICIAN이면 전체 뮤지션 목록에서 userId가 일치하는 프로필을 찾아 me에 합침
          // (GET /api/musicians/me 엔드포인트가 없으므로 목록에서 검색)
          api.getMusicians().then(musicians => {
            const myProfile = musicians.find(m => m.userId === user.id);
            setMe({
              ...user,
              musicianId: myProfile?.id,       // 뮤지션 프로필의 DB id
              stageName: myProfile?.stageName, // 활동명
              position: myProfile?.position,   // 악기
              bio: myProfile?.bio,
              snsUrl: myProfile?.snsUrl,
            });
          }).catch(() => setMe(user)); // 뮤지션 조회 실패해도 기본 유저 정보는 유지
        } else {
          setMe(user); // GENERAL / ADMIN은 유저 정보만 저장
        }

        if (isFreshLogin) {
          showToast(`${user.nickname}님으로 로그인됐습니다`);
          if (role === 'admin') navigate('admin-home');
        }
      })
      .catch(() => {
        // 토큰이 만료됐거나 유효하지 않으면 삭제
        localStorage.removeItem('token');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = (r, params = {}) => {
    const encoded = Object.keys(params).length
      ? '#' + r + '/' + encodeURIComponent(JSON.stringify(params))
      : '#' + r;
    history.pushState({ r, params }, '', encoded);
    setRouteState({ route: r, params });
    setMenuOpen(false); // 화면 이동 시 모바일 드로어는 항상 닫는다
    window.scrollTo(0, 0);
  };

  const showToast = (msg, kind = 'wine') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3000);
  };

  const openLogin = (reason) => {
    setLoginReason(reason || null);
    setLoginModal(true);
  };

  const handleLogin = ({ name, userId, role }) => {
    if (role === 'admin') {
      setAuth({ role: 'admin', name: '관리자', userId: 'admin_001' });
      setLoginModal(false);
      navigate('admin-home');
      showToast('관리자 모드로 로그인됐습니다');
    } else {
      setAuth({ role: 'general', name, userId });
      setLoginModal(false);
      showToast(`${name}님으로 로그인됐습니다`);
      if (loginReason === 'become') navigate('become-musician');
    }
  };

  const handleVerifyRequest = () => {
    setAuth((a) => ({ ...a, pending: true }));
    navigate('pending');
    showToast('인증 신청이 접수됐습니다');
  };

  const handleLogout = () => {
    api.logout().catch(() => {}); // 서버에 로그아웃 알림 (실패해도 클라이언트는 로그아웃 진행)
    localStorage.removeItem('token');
    setAuth({ role: 'guest' });
    navigate('directory');
    showToast('로그아웃됐습니다', 'ink');
  };

  const isAdmin = auth.role === 'admin';
  const isMusician = auth.role === 'musician';
  const isGuest = auth.role === 'guest';
  const isGeneral = auth.role === 'general';

  const needsLogin = isGuest && (
    MUSICIAN_ROUTES.has(route) || ADMIN_ROUTES.has(route) ||
    route === 'become-musician' || route === 'claim-existing' ||
    route === 'onboarding' || route === 'pending'
  );
  const needsMusician = (isGuest || isGeneral) && MUSICIAN_ROUTES.has(route);
  const needsAdmin = !isAdmin && ADMIN_ROUTES.has(route);

  const layoutAdmin = isAdmin && ADMIN_ROUTES.has(route);
  const layoutDash = isMusician && MUSICIAN_ROUTES.has(route);
  const useLayout = layoutAdmin || layoutDash;

  const renderContent = () => {
    if (needsLogin) return <LoginGate onLoginClick={openLogin} />;
    if (needsAdmin) return <RoleGate navigate={navigate} title="관리자 전용" sub="이 페이지는 관리자만 접근할 수 있어요." />;
    if (needsMusician) return <RoleGate navigate={navigate} pending={auth.pending} />;

    switch (route) {
      case 'directory': return <ScreenDirectory navigate={navigate} auth={auth} onLoginClick={openLogin} />;
      // uuid 파라미터: 뮤지션의 숫자형 DB id (ScreenDirectory 등에서 navigate 시 전달)
      case 'profile-public': return <ScreenPublicProfile uuid={routeParams.uuid} navigate={navigate} auth={auth} />;
      case 'venues': return <ScreenVenues navigate={navigate} />;
      case 'concerts': return <ScreenConcerts navigate={navigate} />;
      case 'concert-detail': return <ScreenConcertDetail concertId={routeParams.concertId} navigate={navigate} />;
      // playdb: 인맥지도 — uuid는 뮤지션의 숫자형 DB id (없으면 선택 화면)
      case 'playdb': return <ScreenPlayDB uuid={routeParams.uuid} navigate={navigate} />;
      // me를 전달해 실제 뮤지션 이름/포지션을 이력서에 표시
      case 'resume-public': return <ScreenResumePublic navigate={navigate} me={me} />;

      case 'become-musician': return <ScreenBecomeMusician navigate={navigate} auth={auth} />;
      case 'claim-existing': return <ScreenClaimExisting navigate={navigate} onSubmitRequest={handleVerifyRequest} />;
      case 'onboarding': return <ScreenOnboarding navigate={navigate} onSubmitRequest={handleVerifyRequest} />;
      case 'pending': return <ScreenPending navigate={navigate} auth={auth} />;

      case 'dashboard': return <ScreenDashboard navigate={navigate} me={me} />;
      case 'profile-edit': return <ScreenProfileEdit me={me} navigate={navigate} onUpdate={(f) => setMe((p) => ({ ...p, ...f }))} onToast={showToast} />;
      // me를 전달해야 musicianId로 API 호출 가능
      case 'shows-list': return <ScreenShowsList navigate={navigate} onToast={showToast} me={me} />;
      case 'albums-list': return <ScreenShowsList navigate={navigate} onToast={showToast} me={me} />;
      // graph-mine: 내 인맥지도 — me.musicianId로 그래프 조회
      case 'graph-mine': return <ScreenPlayDB uuid={me?.musicianId} navigate={navigate} />;

      case 'admin-home': return <ScreenAdminHome navigate={navigate} />;
      case 'admin-verify': return <ScreenAdminVerify navigate={navigate} onToast={showToast} />;
      case 'admin-musicians': return <ScreenAdminMusicians navigate={navigate} onToast={showToast} />;
      case 'admin-venues': return <ScreenAdminVenues navigate={navigate} onToast={showToast} />;
      case 'admin-concerts': return <ScreenAdminConcerts navigate={navigate} onToast={showToast} />;

      default: return <ScreenDirectory navigate={navigate} />;
    }
  };

  const topbarMode = isAdmin ? 'admin' : isMusician ? 'musician' : isGeneral ? 'general' : 'visitor';

  return (
    <div className={`app ${useLayout ? 'dashboard' : ''}`}>
      <Topbar
        route={route}
        navigate={navigate}
        mode={topbarMode}
        me={me}
        auth={auth}
        onLoginClick={openLogin}
        onLogout={handleLogout}
        onMenuClick={() => setMenuOpen((o) => !o)} // 햄버거 버튼: 드로어 열기/닫기 토글
      />

      {useLayout ? (
        <>
          {/* 대시보드/관리자 화면: 사이드바가 모바일에서는 드로어(mobileOpen)로 동작 */}
          {layoutAdmin ? (
            <AdminSidebar route={route} navigate={navigate} onLogout={handleLogout} mobileOpen={menuOpen} />
          ) : (
            <Sidebar route={route} navigate={navigate} me={me} onLogout={handleLogout} mobileOpen={menuOpen} />
          )}
          <main>{renderContent()}</main>
        </>
      ) : (
        <>
          {/* 일반 화면: 모바일 전용 메뉴 드로어 (PC에서는 CSS로 숨겨짐) */}
          <MobileNav open={menuOpen} route={route} navigate={navigate} auth={auth} onLoginClick={(reason) => { setMenuOpen(false); openLogin(reason); }} />
          {renderContent()}
        </>
      )}

      {/* 드로어가 열려 있을 때 본문을 어둡게 덮는 배경 — 탭하면 드로어 닫힘 */}
      {menuOpen && <div className="drawer-scrim" onClick={() => setMenuOpen(false)} />}

      {toast && <Toast msg={toast.msg} kind={toast.kind} />}
      {loginModal && <KakaoLoginModal onClose={() => setLoginModal(false)} onLogin={handleLogin} reason={loginReason} />}
    </div>
  );
}
