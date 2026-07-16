// 어드민 — 뮤지션 인증 신청 관리 페이지
// PENDING 상태인 신청 목록을 조회하고 승인/반려 처리하는 화면
import { useState, useEffect } from 'react'; // useState: 상태 관리 / useEffect: 마운트 시 API 호출
import Icon from '../../components/Icon';     // 아이콘 컴포넌트
import Avatar from '../../components/Avatar'; // 이니셜 아바타 컴포넌트
import Spinner from '../../components/Spinner'; // 로딩 스피너
import { api } from '../../api/client';       // 백엔드 API 호출 함수 모음

// LocalDateTime 문자열을 읽기 좋은 형식으로 변환하는 함수
// 예: "2026-06-24T14:20:00" → "2026-06-24 14:20"
function fmtDateTime(dt) {
  if (!dt) return '';
  return dt.replace('T', ' ').slice(0, 16); // T를 공백으로, 초 단위 이하 제거
}

export default function ScreenAdminVerify({ navigate, onToast }) {
  // queue: 백엔드에서 받아온 PENDING 인증 신청 목록
  const [queue, setQueue] = useState([]);

  // loading: API 응답 대기 중 여부
  const [loading, setLoading] = useState(true);

  // selected: 현재 선택된(우측 패널에 표시 중인) 신청의 id
  const [selected, setSelected] = useState(null);

  // 마운트 시 PENDING 목록 로드
  // 백엔드는 PENDING 목록만 제공 — GET /api/admin/verify/pending
  // APPROVED/REJECTED 조회 API는 미구현이므로 해당 탭 없음
  useEffect(() => {
    api.getVerifyQueue()                       // GET /api/admin/verify/pending
      .then((data) => setQueue(data))          // 성공: PENDING 신청 목록 저장
      .catch(() => onToast && onToast('목록 조회 실패', 'ink'))
      .finally(() => setLoading(false));
  }, []);

  // 현재 선택된 신청 객체
  const sel = selected ? queue.find((r) => r.id === selected) : null;

  // 승인 처리 — PATCH /api/admin/verify/{id}/approve
  const approve = (id) => {
    api.approveVerify(id)
      .then(() => {
        // 성공 시 로컬 목록에서 해당 항목 제거 (화면 즉시 반영)
        setQueue((q) => q.filter((r) => r.id !== id));
        setSelected(null);
        onToast && onToast('승인 완료 — MUSICIAN 권한 부여됨');
      })
      .catch(() => onToast && onToast('승인 처리 실패', 'ink'));
  };

  // 반려 처리 — PATCH /api/admin/verify/{id}/reject
  const reject = (id) => {
    api.rejectVerify(id)
      .then(() => {
        // 성공 시 로컬 목록에서 해당 항목 제거
        setQueue((q) => q.filter((r) => r.id !== id));
        setSelected(null);
        onToast && onToast('반려 처리됐습니다');
      })
      .catch(() => onToast && onToast('반려 처리 실패', 'ink'));
  };

  if (loading) {
    return (
      <div className="main dashboard-main">
        <div className="pad"><Spinner label="신청 목록을 불러오는 중..." /></div>
      </div>
    );
  }

  return (
    <div className="main dashboard-main">
      <div className="pad">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 className="h2 serif" style={{ margin: 0 }}>뮤지션 인증 관리</h1>
          {/* 현재 대기 중인 신청 수 표시 */}
          <span className="pill wine">PENDING {queue.length}건</span>
        </div>

        {/* PENDING 목록만 표시 — APPROVED/REJECTED 조회 API는 추후 구현 예정 */}
        <div className="verify-layout">

          {/* 왼쪽: 신청 목록 */}
          <div className="verify-list">
            {queue.map((r) => (
              <div
                key={r.id}
                className={`verify-item ${selected === r.id ? 'active' : ''}`}
                onClick={() => setSelected(r.id)}
              >
                {/* userNickname: 신청자 닉네임 (백엔드 필드명) */}
                <Avatar name={r.userNickname} />
                <div className="col grow" style={{ gap: 2 }}>
                  <b style={{ fontSize: 14 }}>{r.userNickname}</b>
                  {/* requestedAt: LocalDateTime — "2026-06-24T14:20:00" 형식 */}
                  <span className="muted" style={{ fontSize: 12 }}>{fmtDateTime(r.requestedAt)}</span>
                  <span className="muted" style={{ fontSize: 11 }}>user_id: {r.userId}</span>
                </div>
                <Icon name="arrow-right" size={14} color="var(--mute)" />
              </div>
            ))}

            {queue.length === 0 && (
              <div className="empty-state sm">
                <Icon name="check" size={22} color="var(--mute)" />
                <p className="muted">처리 대기 중인 신청이 없습니다</p>
              </div>
            )}
          </div>

          {/* 오른쪽: 선택된 신청 상세 */}
          {sel ? (
            <div className="verify-detail card">
              <div className="row" style={{ gap: 12, marginBottom: 16 }}>
                <Avatar name={sel.userNickname} size="lg" />
                <div className="col" style={{ gap: 3 }}>
                  <b style={{ fontSize: 17 }}>{sel.userNickname}</b>
                  <span className={`pill wine sm`}>{sel.status}</span>
                </div>
              </div>

              {/* 백엔드에서 제공하는 정보 */}
              <div className="vd-table">
                <div className="vd-row"><span>신청 ID</span><b className="mono">{sel.id}</b></div>
                <div className="vd-row"><span>신청일시</span><b className="mono">{fmtDateTime(sel.requestedAt)}</b></div>
                <div className="vd-row"><span>user_id</span><b className="mono">{sel.userId}</b></div>
              </div>

              {/* 악기·학력·SNS·증빙 등 상세 정보 — 백엔드 미구현, 추후 제공 예정 */}
              <div className="coming-soon-box" style={{ marginTop: 16 }}>
                <Icon name="file-text" size={18} color="var(--mute)" />
                <span className="coming-soon-label">신청 상세 정보 준비 중</span>
                <span className="coming-soon-sub">악기·학력·활동 증빙·SNS 링크는 곧 제공될 예정입니다</span>
              </div>

              {/* PENDING 상태일 때만 승인/반려 버튼 표시 */}
              {sel.status === 'PENDING' && (
                <div className="row" style={{ gap: 10, marginTop: 20 }}>
                  <button className="btn wine grow" onClick={() => approve(sel.id)}>
                    <Icon name="check" size={16} stroke={2.5} /> 승인
                  </button>
                  <button className="btn ghost grow" onClick={() => reject(sel.id)}>
                    <Icon name="x" size={16} /> 반려
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="verify-detail empty">
              <Icon name="inbox" size={28} color="var(--mute)" />
              <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
                항목을 선택하면 상세 정보가 표시됩니다
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
