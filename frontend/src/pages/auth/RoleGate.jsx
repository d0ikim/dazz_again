import Icon from '../../components/Icon';

export default function RoleGate({ navigate, pending, title, sub }) {
  return (
    <div className="main">
      <div className="pad" style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="gate-card">
          <span className="gate-ico"><Icon name={pending ? 'clock' : 'lock'} size={26} color="var(--wine)" /></span>
          <h2 className="serif" style={{ fontSize: 24, fontWeight: 700, marginTop: 16 }}>{title || 'MUSICIAN 인증이 필요해요'}</h2>
          <p className="muted" style={{ fontSize: 14, margin: '8px 0 22px', maxWidth: 380 }}>{sub || '이 영역은 인증된 뮤지션만 이용할 수 있어요. 본인 정보를 등록하고 관리자 승인을 받으세요.'}</p>
          {pending ? (
            <button className="btn primary lg" onClick={() => navigate('pending')}><Icon name="clock" size={18} /> 심사 상태 보기</button>
          ) : (
            <button className="btn primary lg" onClick={() => navigate('become-musician')}><Icon name="plus" size={18} /> 뮤지션 등록하기</button>
          )}
        </div>
      </div>
    </div>
  );
}