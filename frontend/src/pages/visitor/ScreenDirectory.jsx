// 뮤지션 디렉토리 페이지 — 서비스 메인 화면이자 뮤지션 목록을 보여주는 화면
import { useState, useEffect, useRef } from 'react'; // useState: 상태 관리 / useEffect: 마운트 시 API 호출 / useRef: 스크롤 기준점·마운트 여부 기억
import Icon from '../../components/Icon';     // 아이콘 컴포넌트
import { api } from '../../api/client';       // 백엔드 API 호출 함수 모음

// 악기별 필터 버튼 목록 — 백엔드 position 필드값과 대소문자 무시해서 비교함
const FILTERS = ['all', 'Piano', 'Bass', 'Drums', 'Sax', 'Guitar', 'Vocal'];

export default function ScreenDirectory({ navigate, auth, onLoginClick }) {
  // musicians: 백엔드에서 받아온 뮤지션 목록 (초기값 빈 배열)
  const [musicians, setMusicians] = useState([]);

  // performanceCount: 통계 바의 "등록된 공연" 수 — 목록 전체를 렌더링할 필요는 없으니 개수만 저장
  const [performanceCount, setPerformanceCount] = useState(null);

  // loading: API 응답 대기 중 여부
  const [loading, setLoading] = useState(true);

  // query: 검색창에 입력된 텍스트 (이름·악기 검색에 사용)
  const [query, setQuery] = useState('');

  // filter: 선택된 악기 필터 ('all' 또는 'Piano' 등)
  const [filter, setFilter] = useState('all');

  // 필터 변경 시 스크롤을 맞출 기준점 (디렉토리 헤더 div를 가리킴)
  const listTopRef = useRef(null);
  // 첫 렌더인지 여부 — 페이지에 처음 들어왔을 때는 스크롤을 건드리면 안 되므로 구분
  const didMountRef = useRef(false);

  // 악기 필터를 바꾸면 목록 길이가 확 줄면서 페이지 높이가 짧아지고,
  // 브라우저가 스크롤 위치를 잃어 화면이 최상단(히어로)으로 튀는 문제가 있었음.
  // → 필터가 바뀔 때마다 "디렉토리 헤더"가 화면 상단에 오도록 스크롤을 고정해서
  //   히어로를 다시 지나칠 필요 없이 바로 목록을 볼 수 있게 함
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true; // 첫 렌더는 건너뜀 (페이지 진입 시에는 맨 위부터 보여야 함)
      return;
    }
    listTopRef.current?.scrollIntoView({ block: 'start' });
  }, [filter]); // filter가 바뀔 때만 실행 (검색어 입력 중에는 스크롤하지 않음)

  // 마운트 시 전체 뮤지션 목록을 백엔드에서 불러옴
  useEffect(() => {
    api.getMusicians()                        // GET /api/musicians
      .then((data) => setMusicians(data))     // 성공: 배열을 musicians 상태에 저장
      .catch(() => {})                        // 실패: 빈 목록 유지
      .finally(() => setLoading(false));      // 성공/실패 무관하게 로딩 종료

    // 통계 바의 "등록된 공연" 수 — 전체 목록을 받아서 길이만 씀 (별도 count API가 없음)
    api.getPerformances()                     // GET /api/performances
      .then((data) => setPerformanceCount(data.length))
      .catch(() => {});                       // 실패해도 "—"로 남겨두면 되므로 무시
  }, []); // 빈 배열: 마운트 시 1회만 실행

  // 검색 + 악기 필터를 조합해서 보여줄 목록 계산
  // 백엔드 필드: stageName(활동명), position(악기)
  const list = musicians.filter((m) => {
    // 악기 필터: 'all'이면 전체 / 아니면 position과 대소문자 무시 비교
    if (filter !== 'all' && m.position?.toLowerCase() !== filter.toLowerCase()) return false;
    // 텍스트 검색: stageName 또는 position에 검색어 포함 여부
    if (query && !m.stageName?.includes(query) && !m.position?.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="main">
        <div className="pad wide">
          <p className="muted">뮤지션 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="pad wide">

        {/* 히어로 섹션 — 서비스 소개 + 주요 진입 버튼 */}
        <div className="hero" style={{ marginBottom: 20 }}>
          <div className="stamp" />
          <div className="eyebrow" style={{ marginBottom: 8 }}>K-JAZZ INSIGHT NAVIGATOR</div>
          {/* 제목 크기는 인라인이 아니라 CSS(.hero-title)로 지정 — 모바일 미디어 쿼리로 줄일 수 있게 */}
          <h1 className="h1 serif hero-title" style={{ marginBottom: 8, maxWidth: 720 }}>
            한국재즈 뮤지션을<br />뮤지션이 직접 정리합니다.
          </h1>
          <p className="lead" style={{ maxWidth: 560, marginBottom: 16 }}>
            DAZZ는 재즈 입문자가 길을 잃지 않도록 — 그리고 현역 뮤지션이 정돈된 디지털 이력서를 가질 수 있도록 — 뮤지션이 직접 관리하는 포트폴리오 플랫폼입니다.
          </p>

          {/* 로그인 상태에 따라 다른 버튼 표시 */}
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            {auth?.role === 'guest' ? (
              <button className="btn primary lg" onClick={() => onLoginClick && onLoginClick('become')}>
                내 프로필 만들기 <Icon name="arrow-right" size={16} />
              </button>
            ) : auth?.role === 'general' ? (
              <button className="btn primary lg" onClick={() => navigate('become-musician')}>
                내 프로필 만들기 <Icon name="arrow-right" size={16} />
              </button>
            ) : (
              <button className="btn primary lg" onClick={() => navigate('dashboard')}>
                대시보드 <Icon name="arrow-right" size={16} />
              </button>
            )}
            {/* 첫 번째 뮤지션의 프로필을 샘플로 보여줌 — 목록이 비면 버튼 숨김 */}
            {musicians.length > 0 && (
              <button className="btn secondary lg" onClick={() => navigate('profile-public', { uuid: musicians[0].id })}>
                샘플 프로필 보기
              </button>
            )}
            {/* 처음 온 방문자를 위한 이용 가이드 링크 — ghost(테두리 없음)로 하면 다른 두 버튼과
                나란히 있을 때 버튼처럼 안 보이고 텍스트만 붕 떠 보여서 secondary로 통일 */}
            <button className="btn secondary lg" onClick={() => navigate('guide')}>
              이용 가이드 보기
            </button>
          </div>

          {/* 통계 바 — 뮤지션 수/공연 수는 실제 데이터, 협업 엣지는 집계 API가 없어 준비 중 */}
          <div className="statbar" style={{ marginTop: 14 }}>
            <div className="statbar-item"><b>{musicians.length}</b><span>뮤지션</span></div>
            <div className="statbar-item"><b>{performanceCount ?? '—'}</b><span>등록된 공연</span></div>
            <div className="statbar-item"><b>—</b><span>협업 엣지</span></div>     {/* 인맥 집계 API 준비 중 */}
          </div>
        </div>

        {/* 디렉토리 헤더 — 뮤지션 수 + 검색창 (ref: 필터 변경 시 이 위치로 스크롤) */}
        <div ref={listTopRef} className="row" style={{ justifyContent: 'space-between', marginBottom: 14, alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, scrollMarginTop: 68 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>뮤지션 디렉토리</div>
            <h2 className="h2 serif" style={{ margin: 0 }}>활동중인 뮤지션 {list.length}명</h2>
          </div>
          <div className="field" style={{ width: 240, marginBottom: 0 }}>
            <div className="prefix">
              <span><Icon name="search" size={14} /></span>
              <input
                type="text"
                placeholder="이름·악기 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 악기 필터 칩 버튼 */}
        <div className="row" style={{ gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`pill lg ${filter === f ? 'wine-solid' : ''}`}
              style={{ cursor: 'pointer', border: 0 }}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? '전체' : f}
            </button>
          ))}
        </div>

        {/* 뮤지션 카드 그리드 */}
        <div className="dir">
          {list.map((m) => (
            // m.id: 백엔드 DB의 숫자형 PK (mock의 문자열 uuid 대신 사용)
            <div key={m.id} className="card-m" onClick={() => navigate('profile-public', { uuid: m.id })}>
              <div className="cover">
                {m.profileImageUrl ? (
                  <img src={m.profileImageUrl} alt={`${m.stageName} 프로필`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div className="imgph">{m.stageName} 사진</div>
                )}
              </div>
              <div className="meta">
                {/* stageName: 백엔드 필드명 (mock의 name에 해당) */}
                <div className="name serif">{m.stageName}</div>
                {/* position: 백엔드 필드명 (mock의 role에 해당, 예: PIANO, VOCAL) */}
                <div className="role">{m.position}</div>
                {/* 공연 수·협업 수 통계는 뮤지션별로 한 번에 세는 API가 없어 여기서는 표시하지 않음
                    (실제 공연 이력이 있는 뮤지션도 있어 "준비 중" 문구가 부정확했음) — 프로필 페이지에서 확인 가능 */}
              </div>
            </div>
          ))}
        </div>

        {/* 검색 결과 없음 */}
        {list.length === 0 && !loading && (
          <div className="empty-state">
            <Icon name="search" size={28} color="var(--mute)" />
            <p className="muted">검색 결과가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
