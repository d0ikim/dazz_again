import Logo from '../../components/Logo';
import Icon from '../../components/Icon';
// BASE_URL: 백엔드 주소 (VITE_API_URL 환경변수 또는 로컬 기본값) — 하드코딩 대신 이걸 사용
import { BASE_URL } from '../../api/client';

export default function KakaoLoginModal({ onClose, onLogin, reason }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal kakao-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose}><Icon name="x" size={18} /></button>
        <div className="col" style={{ alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Logo size={26} />
          <span className="mono" style={{ fontSize: 11, color: 'var(--mute)', letterSpacing: '0.1em' }}>DIGGING JAZZ</span>
        </div>
        <h2 className="serif" style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginTop: 14 }}>
          {reason === 'become' ? '로그인 후 뮤지션 등록이 가능해요' : '카카오로 시작하기'}
        </h2>
        <p className="muted" style={{ textAlign: 'center', fontSize: 13, margin: '8px 0 22px' }}>
          처음이면 자동으로 회원가입돼요. 별도 가입 절차는 없습니다.
        </p>

        <button className="btn kakao full lg" onClick={() => {
          // 카카오 로그인 시작: 백엔드의 OAuth2 시작 주소로 브라우저를 통째로 이동 (fetch가 아닌 페이지 이동이라 api 객체 대신 BASE_URL 직접 사용)
          window.location.href = `${BASE_URL}/oauth2/authorization/kakao`;
        }}>
          <Icon name="chat" size={18} /> 카카오 계정으로 로그인 / 가입
        </button>

        <div className="kakao-steps">
          <div className="ks"><span className="ks-n">1</span> 카카오 로그인 → 자동 회원가입 (GENERAL)</div>
          <div className="ks"><span className="ks-n">2</span> "뮤지션 등록"으로 본인 정보 / 인증 신청</div>
          <div className="ks"><span className="ks-n">3</span> 관리자 승인 시 MUSICIAN 권한 부여</div>
        </div>

        <div style={{ borderTop: '1px solid var(--line)', marginTop: 18, paddingTop: 14 }}>
          <button
            className="btn ghost full sm"
            style={{ color: 'var(--mute)', fontSize: 11 }}
            onClick={() => onLogin({ name: '관리자', userId: 'admin_001', role: 'admin' })}
          >
            관리자 모드로 보기 (데모용)
          </button>
        </div>

        <p className="muted" style={{ textAlign: 'center', fontSize: 11, marginTop: 10 }}>
          로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}