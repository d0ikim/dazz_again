// 공연 목록 페이지 — 공연 일정을 월별 달력으로 보여주는 화면
import { useState, useEffect, useMemo } from 'react'; // useMemo: 달력 그리드/날짜별 그룹 계산을 매 렌더마다 다시 하지 않도록 캐싱
import Icon from '../../components/Icon';     // 아이콘 컴포넌트
import Spinner from '../../components/Spinner'; // 로딩 스피너
import { api } from '../../api/client';       // 백엔드 API 호출 함수 모음

// startTime에서 시:분 형식 문자열을 반환하는 함수
// 예: "2026-05-18T20:00:00" → "20:00"
function fmtTime(startTime) {
  if (!startTime) return '';
  const dt = new Date(startTime);
  return `${dt.getHours()}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

// 공연이 '예정' 상태인지 판단하는 함수
// 백엔드에 status 필드가 없으므로 startTime과 현재 시각을 비교해서 직접 계산
// cancelled가 true면 무조건 종료(past)로 처리
function isUpcoming(performance) {
  if (performance.cancelled) return false;
  return new Date(performance.startTime) > new Date();
}

// 요일 헤더에 쓸 라벨 (일요일부터 시작 — Date.getDay()의 0=일요일 순서와 맞춤)
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 공연장 구분용 색상환 — 서로 색상환에서 멀리 떨어진 색조를 고정된 순서로 배정
// (뮤지션 수만큼 색을 만드는 게 아니라, 공연장이라는 '항목(카테고리)'을 구분하는 용도라
//  임의 생성이 아닌 고정된 순서의 팔레트를 씀)
const VENUE_HUES = [250, 40, 145, 320, 200, 28]; // 파랑/주황/초록/자홍/청록/와인(브랜드 기본색)

// venueId로 팔레트에서 색을 하나 고르는 함수 — 같은 공연장은 항상 같은 색이 나오도록 id를 그대로 나눔
// bg: 칩 전체를 물들이는 옅은 파스텔 배경색 / fg: 그 위에서 읽히는 살짝 진한 글자색
// (동그라미 하나보다 칸 전체를 색으로 물들이는 게 더 잘 구분된다는 피드백 반영,
//  명도를 더 높이고 채도를 낮춰 파스텔톤으로 조정)
function venueColor(venueId) {
  const hue = VENUE_HUES[(venueId ?? 0) % VENUE_HUES.length];
  return {
    bg: `oklch(0.95 0.045 ${hue})`,
    fg: `oklch(0.42 0.10 ${hue})`,
  };
}

// Date 객체를 "2026-7-18" 형태의 키로 변환 — 달력 칸과 공연을 날짜 기준으로 매칭할 때 사용
// (ISO 문자열 대신 로컬 연/월/일을 직접 조합해서 시간대 차이로 날짜가 하루 밀리는 문제를 피함)
function dateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function ScreenConcerts({ navigate }) {
  // performances: 백엔드에서 받아온 전체 공연 목록
  const [performances, setPerformances] = useState([]);

  // loading: API 응답 대기 중 여부
  const [loading, setLoading] = useState(true);

  // query: 검색창에 입력된 공연명 검색어 (실시간 필터링)
  const [query, setQuery] = useState('');

  // selectedVenueId: 범례에서 선택한 공연장 id — null이면 전체 표시, 값이 있으면 그 공연장만 표시
  const [selectedVenueId, setSelectedVenueId] = useState(null);

  // 범례 클릭 시 필터 토글 — 이미 선택된 공연장을 다시 누르면 필터 해제(전체 보기)
  const toggleVenueFilter = (venueId) =>
    setSelectedVenueId((prev) => (prev === venueId ? null : venueId));

  // today: 오늘 날짜 — "오늘로 이동" 버튼과 오늘 칸 강조에 사용 (컴포넌트 생명주기 동안 고정)
  const [today] = useState(() => new Date());

  // viewDate: 현재 달력에 표시 중인 '달'의 1일 — 이 값만 바꾸면 달력 전체가 다시 계산됨
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  // expandedDays: "+N개"를 눌러 전체 공연을 펼쳐본 날짜 칸들의 키 모음 (Set)
  // 날짜 키가 이 안에 있으면 그 칸은 3개로 자르지 않고 전부 보여줌
  const [expandedDays, setExpandedDays] = useState(new Set());

  // "+N개" 클릭 시 그 날짜를 펼침 목록에 추가하는 함수
  const expandDay = (key) => setExpandedDays((prev) => new Set(prev).add(key));

  // 마운트 시 전체 공연 목록을 백엔드에서 불러옴
  useEffect(() => {
    api.getPerformances()                           // GET /api/performances
      .then((data) => setPerformances(data))        // 성공: 배열을 performances 상태에 저장
      .catch(() => {})                              // 실패: 빈 목록 유지
      .finally(() => setLoading(false));            // 로딩 종료
  }, []);

  // 검색어 + 범례에서 선택한 공연장으로 걸러낸 공연 목록 (달력에는 이 목록만 표시)
  const filtered = performances.filter((p) => {
    const matchQuery = query === '' || p.title.toLowerCase().includes(query.toLowerCase());
    const matchVenue = selectedVenueId === null || p.venue?.id === selectedVenueId;
    return matchQuery && matchVenue;
  });

  // 날짜별로 공연을 묶은 맵 — { "2026-6-18": [공연, 공연...] } 형태
  // filtered가 바뀔 때만 다시 계산 (검색어 입력 중이 아니면 재사용)
  const byDate = useMemo(() => {
    const map = {};
    filtered.forEach((p) => {
      if (!p.startTime) return;
      const key = dateKey(new Date(p.startTime));
      (map[key] = map[key] || []).push(p);
    });
    return map;
  }, [filtered]);

  // 이번 달 달력 칸 목록 계산 — 1일 앞의 빈 칸(null) + 이번 달 날짜들
  // viewDate가 바뀔 때(달 이동)만 다시 계산
  const cells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay(); // 이번 달 1일이 무슨 요일인지 (0=일요일)
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // 이번 달의 마지막 날짜 (다음 달 0일 = 이번 달 말일)

    const list = [];
    for (let i = 0; i < firstWeekday; i++) list.push(null);           // 1일 앞의 빈 칸
    for (let d = 1; d <= daysInMonth; d++) list.push(new Date(year, month, d)); // 이번 달 날짜들
    return list;
  }, [viewDate]);

  // 범례용 — 실제로 등장하는 공연장만, 이름 기준으로 중복 없이 뽑음 (id 오름차순으로 항상 같은 순서)
  const venueLegend = useMemo(() => {
    const map = new Map();
    performances.forEach((p) => {
      if (p.venue && !map.has(p.venue.id)) map.set(p.venue.id, p.venue);
    });
    return [...map.values()].sort((a, b) => a.id - b.id);
  }, [performances]);

  const monthLabel = `${viewDate.getFullYear()}년 ${viewDate.getMonth() + 1}월`;

  // 이전/다음 달로 이동 — month에 -1/+1을 넣으면 Date가 연도 넘어가는 것까지 알아서 계산해줌
  const goPrevMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToday = () => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));

  if (loading) {
    return (
      <div className="main">
        <div className="pad">
          <Spinner label="공연 정보를 불러오는 중..." />
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="pad">
        <h1 className="h2 serif" style={{ marginBottom: 6 }}>공연 일정</h1>
        <p className="muted" style={{ marginBottom: 18 }}>DAZZ에 등록된 뮤지션들의 공연 일정을 달력으로 확인하세요.</p>

        {/* 공연명 검색 */}
        <div className="field" style={{ marginBottom: 16, width: 'auto', maxWidth: 320 }}>
          <div className="prefix">
            <span><Icon name="search" size={14} /></span>
            <input
              type="text"
              placeholder="공연명 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)} // 입력값 변경 시 실시간 필터링
            />
          </div>
        </div>

        {/* 달 이동 헤더 */}
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div className="row" style={{ gap: 6, alignItems: 'center' }}>
            <button className="btn ghost icon" onClick={goPrevMonth} aria-label="이전 달">
              <Icon name="arrow-left" size={16} />
            </button>
            <h2 className="h3 serif" style={{ margin: 0, minWidth: 120, textAlign: 'center' }}>{monthLabel}</h2>
            <button className="btn ghost icon" onClick={goNextMonth} aria-label="다음 달">
              <Icon name="arrow-right" size={16} />
            </button>
          </div>
          <button className="btn ghost sm" onClick={goToday}>오늘</button>
        </div>

        {/* 공연장 범례 — 클릭하면 그 공연장의 공연만 필터링, 다시 누르면 전체 보기로 해제 */}
        <div className="cal-legend">
          {venueLegend.map((v) => {
            const { bg, fg } = venueColor(v.id);
            const isSelected = selectedVenueId === v.id;
            // 다른 공연장이 선택돼 있으면 이 항목은 흐리게 — 지금 뭐가 필터링 중인지 눈에 띄게
            const isDimmed = selectedVenueId !== null && !isSelected;
            return (
              <button
                key={v.id}
                type="button"
                className={`cal-legend-item ${isSelected ? 'selected' : ''}`}
                style={{ background: bg, color: fg, opacity: isDimmed ? 0.4 : 1 }}
                onClick={() => toggleVenueFilter(v.id)}
              >
                {v.name}
              </button>
            );
          })}
        </div>

        {/* 요일 헤더 */}
        <div className="cal-weekdays">
          {WEEKDAYS.map((w) => <div key={w} className="cal-weekday">{w}</div>)}
        </div>

        {/* 달력 그리드 — 7열, 날짜만큼의 행 */}
        <div className="cal-grid">
          {cells.map((date, i) => {
            if (!date) return <div key={i} className="cal-day empty" />; // 1일 앞의 빈 칸

            const key = dateKey(date);
            const dayPerformances = byDate[key] || [];
            const isToday = key === dateKey(today);
            const isExpanded = expandedDays.has(key);
            // 펼친 상태가 아니면 4개까지만, 펼쳤으면 전부 보여줌
            const visiblePerformances = isExpanded ? dayPerformances : dayPerformances.slice(0, 4);
            const hiddenCount = dayPerformances.length - visiblePerformances.length;

            return (
              <div key={i} className={`cal-day ${isToday ? 'today' : ''}`}>
                <span className="cal-day-num">{date.getDate()}</span>
                <div className="cal-chips">
                  {visiblePerformances.map((p) => {
                    const { bg, fg } = venueColor(p.venue?.id);
                    return (
                      <div
                        key={p.id}
                        className={`cal-chip ${p.cancelled ? 'cancelled' : isUpcoming(p) ? 'upcoming' : 'past'}`}
                        style={{ background: bg, color: fg }} // 공연장 색으로 칸 전체를 물들여서 한눈에 구분
                        onClick={() => navigate('concert-detail', { concertId: p.id })}
                        title={`${p.venue?.name ? `[${p.venue.name}] ` : ''}${p.title}`}
                      >
                        <span className="cal-chip-time">{fmtTime(p.startTime)}</span>
                        <span className="cal-chip-title">{p.title}</span>
                      </div>
                    );
                  })}
                  {/* "+N개" 클릭 시 그 칸에 한해 나머지 공연도 전부 펼쳐 보여줌 */}
                  {hiddenCount > 0 && (
                    <div
                      className="cal-chip more"
                      onClick={(e) => { e.stopPropagation(); expandDay(key); }}
                    >
                      +{hiddenCount}개
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 검색 결과 자체가 없을 때 */}
        {filtered.length === 0 && (
          <div className="empty-state" style={{ marginTop: 20 }}>
            <Icon name="calendar" size={28} color="var(--mute)" />
            <p className="muted">검색 결과가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
