// 뮤지션 인증 신청 후 대기 중 화면
// PENDING 상태 유저가 진입하면 이 화면이 표시됨 (App.jsx의 auth.pending 기반 라우팅)
import { useState, useEffect } from 'react'; // useEffect: 내 신청 정보 로드
import Icon from '../../components/Icon';   // 아이콘
import { api } from '../../api/client';     // 백엔드 API 호출 함수 모음

export default function ScreenPending({ navigate, auth }) {
  // req: 내 인증 신청 단건 정보 — GET /api/verify/musician/me
  const [req, setReq] = useState(null);

  useEffect(() => {
    // 본인 인증 신청 정보 조회 (없으면 null 유지)
    api.getMyVerifyRequest()
      .then(setReq)
      .catch(() => {}); // 실패해도 화면은 표시 (id 등 세부 정보만 없을 뿐)
  }, []);

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
            {/* req가 로드된 경우에만 신청 세부 정보 표시 */}
            {req && (
              <>
                <div className="rr"><span>요청 ID</span><b className="mono">{req.id}</b></div>
                <div className="rr"><span>신청 일시</span><b className="mono">{req.requestedAt?.slice(0, 10)}</b></div>
              </>
            )}
            {/* userId는 auth에서 바로 가져옴 */}
            <div className="rr"><span>user_id</span><b className="mono">{auth.userId}</b></div>
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
