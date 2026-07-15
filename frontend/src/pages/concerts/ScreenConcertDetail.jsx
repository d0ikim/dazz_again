// 공연 상세 페이지 — 공연 1건의 상세 정보를 보여주는 화면
import { useState, useEffect } from 'react'; // useState: 상태 관리 / useEffect: 마운트 시 API 호출
import Avatar from '../../components/Avatar'; // 이니셜/프로필 아바타 컴포넌트
import Icon from '../../components/Icon';     // 아이콘 컴포넌트
import { api } from '../../api/client';       // 백엔드 API 호출 함수 모음

// startTime(ISO 문자열)을 "2026년 5월 18일 (월)" 형식으로 변환하는 함수
function fmtDate(startTime) {
  if (!startTime) return '';
  const dt = new Date(startTime);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${dt.getFullYear()}년 ${dt.getMonth() + 1}월 ${dt.getDate()}일 (${days[dt.getDay()]})`;
}

// startTime에서 "20:00" 형식의 시간 문자열을 반환하는 함수
function fmtTime(startTime) {
  if (!startTime) return '';
  const dt = new Date(startTime);
  return `${dt.getHours()}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

// 공연이 예정 상태인지 판단 (백엔드에 status 필드 없으므로 직접 계산)
function isUpcoming(p) {
  if (p.cancelled) return false;              // 취소된 공연은 종료로 분류
  return new Date(p.startTime) > new Date(); // 현재 시각 이후면 예정
}

// concertId: App.jsx에서 navigate('concert-detail', { concertId: p.id }) 로 넘어온 공연 ID (숫자)
// onToast: 공유 버튼 클릭 시 "링크가 복사되었습니다" 안내를 띄우는 전역 토스트 함수 (App.jsx의 showToast)
export default function ScreenConcertDetail({ concertId, navigate, onToast }) {
  // performance: 백엔드에서 받아온 공연 단건 데이터 (초기값 null)
  const [performance, setPerformance] = useState(null);

  // lineup: 이 공연에 출연하는 뮤지션 목록 (초기값 빈 배열)
  const [lineup, setLineup] = useState([]);

  // loading: API 응답 대기 중 여부
  const [loading, setLoading] = useState(true);

  // notFound: 해당 ID의 공연이 없을 때 true
  const [notFound, setNotFound] = useState(false);

  // concertId가 바뀔 때마다(다른 공연 상세로 이동) 새로 API 호출
  useEffect(() => {
    if (!concertId) return; // concertId가 없으면 호출 안 함

    setLoading(true);       // 새 공연 로딩 시작 시 로딩 상태 초기화
    setNotFound(false);

    // 공연 정보 + 라인업을 동시에 호출 (Promise.all: 둘 다 완료될 때까지 대기)
    Promise.all([
      api.getPerformance(concertId),       // GET /api/performances/{id}
      api.getPerformanceLineup(concertId), // GET /api/performances/{id}/lineup
    ])
      .then(([p, lu]) => {
        setPerformance(p);
        setLineup(lu);
      })
      .catch(() => setNotFound(true))      // 실패(404 등): 찾을 수 없음 처리
      .finally(() => setLoading(false));   // 로딩 종료
  }, [concertId]); // concertId가 바뀔 때마다 재실행

  // 로딩 중
  if (loading) {
    return <div className="main"><div className="pad"><p className="muted">공연 정보를 불러오는 중...</p></div></div>;
  }

  // 공연을 찾을 수 없음 (404 또는 잘못된 ID)
  if (notFound || !performance) {
    return <div className="main"><div className="pad"><p className="muted">공연을 찾을 수 없습니다.</p></div></div>;
  }

  // p: performance의 별칭 (코드 가독성을 위해)
  const p = performance;
  const upcoming = isUpcoming(p);

  // 공유 버튼 — 해시 라우터라 window.location.href 자체가 이 공연 상세페이지의 공유 가능한 URL
  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
      .then(() => onToast && onToast('링크가 복사되었습니다'))
      .catch(() => onToast && onToast('링크 복사에 실패했습니다', 'ink'));
  }

  return (
    <div className="main">
      <div className="pad tight">
        <a className="back-link" onClick={() => navigate('concerts')}>
          <Icon name="arrow-left" size={15} /> 공연 목록
        </a>

        {/* 공연 히어로 영역 */}
        <div className="concert-hero">
          {/* 예정/종료/취소 상태 뱃지 */}
          {p.cancelled
            ? <span className="pill light">취소된 공연</span>
            : upcoming
              ? <span className="pill wine">예정 공연</span>
              : <span className="pill light">지난 공연</span>
          }

          <h1 className="h2 serif" style={{ marginTop: 10 }}>{p.title}</h1>

          {/* 공연 메타 정보 그리드 */}
          <div className="concert-meta-grid">
            {/* 날짜·시간 — startTime에서 추출 */}
            <div className="cm">
              <Icon name="calendar" size={14} color="var(--wine)" />
              <span>{fmtDate(p.startTime)} {fmtTime(p.startTime)}</span>
            </div>

            {/* 공연장 — p.venue: 백엔드가 중첩 객체로 반환 */}
            <div className="cm">
              <Icon name="building" size={14} color="var(--wine)" />
              <span>{p.venue?.name} — {p.venue?.location}</span>
            </div>

            {/* 장르 — 값이 있을 때만 표시 */}
            {p.genre && (
              <div className="cm">
                <Icon name="music" size={14} color="var(--wine)" />
                <span>{p.genre}</span>
              </div>
            )}

            {/* 출처 링크 — 인스타 포스트 등, 값이 있을 때만 표시 */}
            {p.sourceUrl && (
              <div className="cm">
                <Icon name="external" size={14} color="var(--wine)" />
                <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                  공연 원본 링크
                </a>
              </div>
            )}
          </div>
        </div>

        {/* 세트 정보 — setInfo 있을 때만 표시 (예: "1부 20:00~20:40 / 2부 21:00~21:40") */}
        {p.setInfo && (
          <section style={{ marginTop: 20 }}>
            <h3 className="section-label">세트 정보</h3>
            <div className="card" style={{ fontSize: 14 }}>{p.setInfo}</div>
          </section>
        )}

        {/* 셋리스트 — setList 있을 때만 표시 (쉼표로 구분된 곡명 목록) */}
        {p.setList && (
          <section style={{ marginTop: 20 }}>
            <h3 className="section-label">셋리스트</h3>
            <div className="card" style={{ fontSize: 14, lineHeight: 1.7 }}>
              {/* 쉼표로 구분된 문자열을 줄바꿈으로 표시 */}
              {p.setList.split(',').map((song, i) => (
                <div key={i}>{song.trim()}</div>
              ))}
            </div>
          </section>
        )}

        {/* 라인업 — api.getPerformanceLineup() 결과. 등록된 라인업이 없으면 준비 중 박스 표시 */}
        <section style={{ marginTop: 20 }}>
          <h3 className="section-label">라인업 ({lineup.length}명)</h3>
          {lineup.length > 0 ? (
            <div className="partner-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}>
              {lineup.map((m) => (
                <div
                  key={m.id}
                  className="partner-card"
                  onClick={() => navigate('profile-public', { uuid: m.id })}
                >
                  <Avatar name={m.stageName} size="md" profileImageUrl={m.profileImageUrl} />
                  <b className="cc-name">{m.stageName}</b>
                  <span className="muted" style={{ fontSize: 11 }}>{m.position}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="coming-soon-box">
              <Icon name="users" size={22} color="var(--mute)" />
              <span className="coming-soon-label">등록된 라인업이 없습니다</span>
              <span className="coming-soon-sub">이 공연은 아직 출연진 정보가 등록되지 않았습니다</span>
            </div>
          )}
        </section>

        {/* 하단 CTA 버튼 — 예매 기능 미구현이므로 비활성화 */}
        <div className="concert-cta">
          {/* disabled: 클릭 불가, opacity로 시각적으로도 비활성화 표시 */}
          <button className="btn primary lg" disabled style={{ opacity: 0.45, cursor: 'not-allowed' }}>
            <Icon name="ticket" size={16} /> 예매 기능 준비 중
          </button>
          <button className="btn ghost lg" onClick={handleShare}>
            <Icon name="share" size={16} /> 공유
          </button>
        </div>
      </div>
    </div>
  );
}
