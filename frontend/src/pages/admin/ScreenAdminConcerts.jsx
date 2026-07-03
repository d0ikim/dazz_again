// 어드민 — 공연 관리 페이지
// 전체 공연 목록을 예정/종료 탭으로 나눠 보여주고 취소 처리하는 화면
import { useState, useEffect } from 'react'; // useState: 상태 관리 / useEffect: 마운트 시 API 호출
import Icon from '../../components/Icon';     // 아이콘 컴포넌트
import { api } from '../../api/client';       // 백엔드 API 호출 함수 모음

// startTime에서 "YYYY-MM-DD HH:MM" 형식 문자열 반환
function fmtDateTime(startTime) {
  if (!startTime) return '';
  return startTime.replace('T', ' ').slice(0, 16);
}

// 공연이 예정 상태인지 판단 (백엔드에 status 필드 없으므로 직접 계산)
function isUpcoming(p) {
  if (p.cancelled) return false;
  return new Date(p.startTime) > new Date();
}

export default function ScreenAdminConcerts({ navigate, onToast }) {
  // performances: 백엔드에서 받아온 전체 공연 목록
  const [performances, setPerformances] = useState([]);

  // loading: API 응답 대기 중 여부
  const [loading, setLoading] = useState(true);

  // tab: 현재 선택된 탭 ('upcoming' = 예정 / 'past' = 종료)
  const [tab, setTab] = useState('upcoming');

  // 마운트 시 전체 공연 목록 로드
  useEffect(() => {
    api.getPerformances()
      .then((data) => setPerformances(data))
      .catch(() => onToast && onToast('공연 목록 조회 실패', 'ink'))
      .finally(() => setLoading(false));
  }, []);

  // 탭에 따라 공연 필터링
  const list = performances.filter((p) =>
    tab === 'upcoming' ? isUpcoming(p) : !isUpcoming(p)
  );

  // 공연 취소 처리 — PUT /api/admin/performances/{id} (cancelled: true)
  // 취소는 공연의 모든 기존 데이터를 유지한 채 cancelled 필드만 true로 변경
  const cancel = (p) => {
    const body = {
      venueId: p.venue?.id,
      startTime: p.startTime,
      title: p.title,
      genre: p.genre || null,
      setInfo: p.setInfo || null,
      setList: p.setList || null,
      cancelled: true,                // 취소 처리
      sourceUrl: p.sourceUrl || null,
    };
    api.updateAdminPerformance(p.id, body)
      .then((updated) => {
        // 성공: 로컬 목록에서 해당 항목을 최신 값으로 교체
        setPerformances((prev) => prev.map((x) => x.id === p.id ? updated : x));
        onToast && onToast('공연이 취소 처리됐습니다');
      })
      .catch(() => onToast && onToast('취소 처리 실패', 'ink'));
  };

  if (loading) {
    return (
      <div className="main dashboard-main">
        <div className="pad"><p className="muted">공연 목록을 불러오는 중...</p></div>
      </div>
    );
  }

  return (
    <div className="main dashboard-main">
      <div className="pad">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 className="h2 serif" style={{ margin: 0 }}>공연 관리 ({performances.length})</h1>
          {/* 공연 등록 버튼 — 별도 모달 구현 예정 */}
          <button className="btn primary sm" disabled style={{ opacity: 0.5 }}>
            <Icon name="plus" size={14} /> 공연 등록 준비 중
          </button>
        </div>

        {/* 예정/종료 탭 */}
        <div className="tab-row" style={{ marginBottom: 18 }}>
          <button className={`tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>
            예정 ({performances.filter(isUpcoming).length})
          </button>
          <button className={`tab ${tab === 'past' ? 'active' : ''}`} onClick={() => setTab('past')}>
            종료 ({performances.filter((p) => !isUpcoming(p)).length})
          </button>
        </div>

        <div className="card flush">
          <table className="admin-table">
            <thead>
              <tr>
                <th>공연명</th>
                <th>날짜·시간</th>  {/* startTime에서 추출 */}
                <th>공연장</th>     {/* p.venue.name (중첩 객체) */}
                <th>장르</th>       {/* p.genre */}
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>
                    <b style={{ fontSize: 13 }}>{p.title}</b>
                  </td>
                  {/* startTime: "2026-05-18T20:00:00" → "2026-05-18 20:00" */}
                  <td className="mono" style={{ fontSize: 12 }}>{fmtDateTime(p.startTime)}</td>
                  {/* p.venue: 백엔드가 중첩 객체로 반환 */}
                  <td className="muted">{p.venue?.name}</td>
                  <td className="muted">{p.genre || '—'}</td>
                  <td>
                    {p.cancelled
                      ? <span className="pill light sm">취소</span>
                      : isUpcoming(p)
                        ? <span className="pill wine sm">예정</span>
                        : <span className="pill light sm">종료</span>
                    }
                  </td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      {/* 상세 보기 버튼 — concert-detail 페이지로 이동 */}
                      <button className="btn ghost sm" onClick={() => navigate('concert-detail', { concertId: p.id })}>
                        <Icon name="external" size={13} />
                      </button>
                      {/* 취소 버튼 — 예정 공연이고 아직 취소되지 않은 경우만 표시 */}
                      {isUpcoming(p) && !p.cancelled && (
                        <button className="btn ghost sm" onClick={() => cancel(p)}>
                          <Icon name="x" size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {list.length === 0 && (
            <div className="empty-state sm">
              <p className="muted">{tab === 'upcoming' ? '예정 공연 없음' : '지난 공연 없음'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
