import Icon from '../../components/Icon';

export default function LoginGate({ onLoginClick, title, sub }) {
  return (
    <div className="main">
      <div className="pad" style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="gate-card">
          <span className="gate-ico"><Icon name="lock" size={26} color="var(--wine)" /></span>
          <h2 className="serif" style={{ fontSize: 24, fontWeight: 700, marginTop: 16 }}>{title || '로그인이 필요합니다'}</h2>
          <p className="muted" style={{ fontSize: 14, margin: '8px 0 22px', maxWidth: 360 }}>{sub || '뮤지션 등록과 인증 신청은 로그인한 회원만 이용할 수 있어요.'}</p>
          <button className="btn kakao lg" onClick={() => onLoginClick && onLoginClick('become')}><Icon name="chat" size={18} /> 카카오 로그인 / 가입</button>
        </div>
      </div>
    </div>
  );
}