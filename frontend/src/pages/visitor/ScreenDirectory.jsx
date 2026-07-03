// 뮤지션 디렉토리 페이지 — 서비스 메인 화면이자 뮤지션 목록을 보여주는 화면
import { useState, useEffect } from 'react'; // useState: 상태 관리 / useEffect: 마운트 시 API 호출
import Icon from '../../components/Icon';     // 아이콘 컴포넌트
import { api } from '../../api/client';       // 백엔드 API 호출 함수 모음

// 악기별 필터 버튼 목록 — 백엔드 position 필드값과 대소문자 무시해서 비교함
const FILTERS = ['all', 'Piano', 'Bass', 'Drums', 'Sax', 'Guitar', 'Vocal'];

export default function ScreenDirectory({ navigate, auth, onLoginClick }) {
  // musicians: 백엔드에서 받아온 뮤지션 목록 (초기값 빈 배열)
  const [musicians, setMusicians] = useState([]);

  // loading: API 응답 대기 중 여부
  const [loading, setLoading] = useState(true);

  // query: 검색창에 입력된 텍스트 (이름·악기 검색에 사용)
  const [query, setQuery] = useState('');

  // filter: 선택된 악기 필터 ('all' 또는 'Piano' 등)
  const [filter, setFilter] = useState('all');

  // 마운트 시 전체 뮤지션 목록을 백엔드에서 불러옴
  useEffect(() => {
    api.getMusicians()                        // GET /api/musicians
      .then((data) => setMusicians(data))     // 성공: 배열을 musicians 상태에 저장
      .catch(() => {})                        // 실패: 빈 목록 유지
      .finally(() => setLoading(false));      // 성공/실패 무관하게 로딩 종료
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
        <div className="hero">
          <div className="stamp" />
          <div className="eyebrow" style={{ marginBottom: 10 }}>K-JAZZ INSIGHT NAVIGATOR · MVP</div>
          <h1 className="h1 serif" style={{ fontSize: 44, marginBottom: 12, maxWidth: 720 }}>
            한국재즈 뮤지션을<br />뮤지션이 직접 정리합니다.
          </h1>
          <p className="lead" style={{ maxWidth: 560, marginBottom: 20 }}>
            DAZZ는 재즈 입문자가 길을 잃지 않도록 — 그리고 현역 뮤지션이 정돈된 디지털 이력서를 가질 수 있도록 — 뮤지션이 직접 관리하는 포트폴리오 플랫폼입니다.
          </p>

          {/* 로그인 상태에 따라 다른 버튼 표시 */}
          <div className="row" style={{ gap: 10 }}>
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
          </div>

          {/* 통계 바 — 실시간 뮤지션 수만 표시, 나머지는 추후 집계 API 구현 예정 */}
          <div className="statbar">
            <div className="stat"><b>{musicians.length}</b><span>뮤지션</span></div>
            <div className="stat"><b>—</b><span>등록된 공연</span></div>   {/* 공연 수 집계 API 준비 중 */}
            <div className="stat"><b>—</b><span>협업 엣지</span></div>     {/* 인맥 집계 API 준비 중 */}
          </div>
        </div>

        {/* 디렉토리 헤더 — 뮤지션 수 + 검색창 */}
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14, alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
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
              <div className="cover imgph">{m.stageName} 사진</div>
              <div className="meta">
                {/* stageName: 백엔드 필드명 (mock의 name에 해당) */}
                <div className="name serif">{m.stageName}</div>
                {/* position: 백엔드 필드명 (mock의 role에 해당, 예: PIANO, VOCAL) */}
                <div className="role">{m.position}</div>
                {/* 공연 수·협업 수 통계는 백엔드 미구현 — 준비 중 표시 */}
                <div className="nums">
                  <span className="muted" style={{ fontSize: 11 }}>공연 이력 준비 중</span>
                </div>
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
