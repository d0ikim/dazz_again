// 공연 목록 페이지 — 예정/지난 공연을 탭으로 나눠 보여주는 화면
import { useState, useEffect } from 'react'; // useState: 상태 관리 / useEffect: 마운트 시 API 호출
import Icon from '../../components/Icon';     // 아이콘 컴포넌트
import { api } from '../../api/client';       // 백엔드 API 호출 함수 모음

// startTime(ISO 문자열)에서 월 표시용 문자열을 반환하는 함수
// 예: "2026-05-18T20:00:00" → "5월"
function fmtMonth(startTime) {
  if (!startTime) return '';
  return new Date(startTime).toLocaleString('ko', { month: 'short' }); // 'ko': 한국어 로케일
}

// startTime에서 일(day) 숫자를 반환하는 함수
// 예: "2026-05-18T20:00:00" → 18
function fmtDay(startTime) {
  if (!startTime) return '';
  return new Date(startTime).getDate();
}

// startTime에서 시:분 형식 문자열을 반환하는 함수
// 예: "2026-05-18T20:00:00" → "20:00"
// padStart(2, '0'): 분이 한 자리면 앞에 0을 채움 (예: 5분 → "05")
function fmtTime(startTime) {
  if (!startTime) return '';
  const dt = new Date(startTime);
  return `${dt.getHours()}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

// 공연이 '예정' 상태인지 판단하는 함수
// 백엔드에 status 필드가 없으므로 startTime과 현재 시각을 비교해서 직접 계산
// cancelled가 true면 무조건 종료(past)로 처리
function isUpcoming(performance) {
  if (performance.cancelled) return false;              // 취소된 공연은 종료로 분류
  return new Date(performance.startTime) > new Date(); // 공연 시작 시각이 현재보다 미래면 예정
}

export default function ScreenConcerts({ navigate }) {
  // performances: 백엔드에서 받아온 전체 공연 목록
  const [performances, setPerformances] = useState([]);

  // loading: API 응답 대기 중 여부
  const [loading, setLoading] = useState(true);

  // tab: 현재 선택된 탭 ('upcoming' = 예정 / 'past' = 지난)
  const [tab, setTab] = useState('upcoming');

  // 마운트 시 전체 공연 목록을 백엔드에서 불러옴
  useEffect(() => {
    api.getPerformances()                           // GET /api/performances
      .then((data) => setPerformances(data))        // 성공: 배열을 performances 상태에 저장
      .catch(() => {})                              // 실패: 빈 목록 유지
      .finally(() => setLoading(false));            // 로딩 종료
  }, []);

  // 선택된 탭에 맞게 공연 필터링
  // isUpcoming() 함수로 예정/지난 여부를 직접 판단 (백엔드 status 필드 없음)
  const list = performances.filter((p) =>
    tab === 'upcoming' ? isUpcoming(p) : !isUpcoming(p)
  );

  if (loading) {
    return (
      <div className="main">
        <div className="pad">
          <p className="muted">공연 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="pad">
        <h1 className="h2 serif" style={{ marginBottom: 6 }}>공연 일정</h1>
        <p className="muted" style={{ marginBottom: 18 }}>DAZZ에 등록된 뮤지션들의 공연 일정을 확인하세요.</p>

        {/* 예정/지난 공연 탭 */}
        <div className="tab-row" style={{ marginBottom: 18 }}>
          <button className={`tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>예정 공연</button>
          <button className={`tab ${tab === 'past' ? 'active' : ''}`} onClick={() => setTab('past')}>지난 공연</button>
        </div>

        <div className="col" style={{ gap: 12 }}>
          {list.map((p) => (
            // p.id: 백엔드 DB의 숫자형 PK
            // concertId 파라미터로 공연 상세 페이지에 전달
            <div key={p.id} className="concert-card" onClick={() => navigate('concert-detail', { concertId: p.id })}>

              {/* 날짜 표시 — startTime에서 월/일을 추출 */}
              <div className="cc-date">
                <span className="ccm">{fmtMonth(p.startTime)}</span>
                <span className="ccd">{fmtDay(p.startTime)}</span>
              </div>

              <div className="col grow" style={{ gap: 4 }}>
                <div className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <b style={{ fontSize: 15 }}>{p.title}</b>
                  {/* 취소된 공연이면 '취소' 뱃지, 아니면 예정/종료 뱃지 */}
                  {p.cancelled
                    ? <span className="pill light sm">취소</span>
                    : isUpcoming(p)
                      ? <span className="pill wine sm">예정</span>
                      : <span className="pill light sm">종료</span>
                  }
                  {/* 장르 뱃지 — 값이 있을 때만 표시 */}
                  {p.genre && <span className="pill light sm">{p.genre}</span>}
                </div>

                <div className="row" style={{ gap: 10, alignItems: 'center' }}>
                  {/* p.venue: 백엔드가 중첩 객체로 반환 (findVenue() 함수 불필요) */}
                  <span className="muted" style={{ fontSize: 12 }}><Icon name="building" size={11} /> {p.venue?.name}</span>
                  {/* startTime에서 시:분 추출 */}
                  <span className="muted" style={{ fontSize: 12 }}><Icon name="clock" size={11} /> {fmtTime(p.startTime)}</span>
                </div>

                {/* 라인업 — 백엔드 API 응답에 출연진 정보 미포함, 추후 제공 예정 */}
                <div className="coming-soon-inline">
                  <Icon name="users" size={11} color="var(--mute)" />
                  <span>라인업 정보 준비 중</span>
                </div>
              </div>

              <Icon name="arrow-right" size={16} color="var(--mute)" />
            </div>
          ))}
        </div>

        {/* 빈 상태 */}
        {list.length === 0 && (
          <div className="empty-state">
            <Icon name="calendar" size={28} color="var(--mute)" />
            <p className="muted">{tab === 'upcoming' ? '예정된 공연이 없습니다' : '지난 공연 기록이 없습니다'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
