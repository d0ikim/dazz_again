import Icon from '../../components/Icon';
import { DATA } from '../../data/mockData';

export default function ScreenPending({ navigate, auth }) {
  const req = DATA.verifyQueue.find((r) => r.userId === auth.userId) || DATA.verifyQueue[0];
  return (
    <div className="main" style={{ background: 'var(--paper)' }}>
      <div className="pad" style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="gate-card">
          <span className="gate-ico"><Icon name="clock" size={26} color="var(--wine)" /></span>
          <span className="pill wine" style={{ marginTop: 14 }}>status · PENDING</span>
          <h2 className="serif" style={{ fontSize: 24, fontWeight: 700, marginTop: 12 }}>인증 심사 중입니다</h2>
          <p className="muted" style={{ fontSize: 14, margin: '8px 0 20px', maxWidth: 380 }}>
            신청이 접수됐어요. 관리자가 활동 근거를 확인하고 승인하면 <b>MUSICIAN</b> 권한과 디지털 이력서 편집이 열립니다.
          </p>
          <div className="req-receipt">
            <div className="rr"><span>요청 ID</span><b className="mono">{req?.id}</b></div>
            <div className="rr"><span>신청 유형</span><b>{req?.kind === 'claim' ? '기존 프로필 본인인증 (claim)' : '신규 등록 (new)'}</b></div>
            <div className="rr"><span>신청 일시</span><b className="mono">{req?.requestedAt}</b></div>
            <div className="rr"><span>user_id</span><b className="mono">{auth.userId || req?.userId}</b></div>
            <div className="rr"><span>상태</span><b style={{ color: 'var(--wine)' }}>PENDING · 승인 대기</b></div>
          </div>
          <div className="row" style={{ gap: 10, marginTop: 22 }}>
            <button className="btn secondary" onClick={() => navigate('directory')}>둘러보기</button>
            <button className="btn ghost" onClick={() => navigate('playdb')}>인맥지도 보기</button>
          </div>
        </div>
      </div>
    </div>
  );
}