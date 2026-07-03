// 공연장 목록 페이지 — 서울 재즈 공연장을 목록으로 보여주는 화면
import { useState, useEffect, useMemo, useCallback } from 'react'; // useState: 상태 관리 / useEffect: 마운트 시 API 호출 / useMemo·useCallback: 불필요한 재계산 방지
import Icon from '../../components/Icon';     // 아이콘 컴포넌트
import { api } from '../../api/client';       // 백엔드 API 호출 함수 모음
import VenueMap from './VenueMap';            // 카카오맵 위에 공연장 마커를 그리는 컴포넌트

export default function ScreenVenues({ navigate }) {
  // venues: 백엔드에서 받아온 공연장 목록 (초기값은 빈 배열)
  const [venues, setVenues] = useState([]);

  // loading: API 응답을 기다리는 동안 true, 받아오면 false
  const [loading, setLoading] = useState(true);

  // selected: 현재 선택된 공연장의 id (클릭하면 상세 정보 펼침, 다시 클릭하면 null로 닫힘)
  const [selected, setSelected] = useState(null);

  // district: 현재 선택된 구 필터 (예: '마포구', '전체')
  const [district, setDistrict] = useState('전체');

  // query: 검색창에 입력된 공연장명 검색어 (실시간 필터링)
  const [query, setQuery] = useState('');

  // useEffect: 컴포넌트가 처음 화면에 나타날 때(마운트 시) 딱 한 번 실행
  // 의존성 배열이 []이므로 재렌더링 시에는 재실행되지 않음
  useEffect(() => {
    api.getVenues()
      .then((data) => setVenues(data))
      .catch((err) => console.error('[ScreenVenues] getVenues 실패:', err))
      .finally(() => setLoading(false));
  }, []);

  // location 문자열에서 구 이름을 추출하는 함수
  // 예: "서울시 마포구 서교동 358-1" → "마포구"
  // 정규식 /([가-힣]+구)/: 한글로 이루어진 '구'로 끝나는 단어를 찾음
  const extractDistrict = (location) => {
    const match = location?.match(/([가-힣]+구)/);
    return match ? match[1] : '기타'; // '구'가 없으면 '기타'로 분류
  };

  // 공연장 목록에서 중복 없이 구 이름 목록을 만듦
  // new Set(): 중복 제거 / 스프레드 연산자(...)로 다시 배열로 변환
  const districts = ['전체', ...new Set(venues.map((v) => extractDistrict(v.location)))];

  // 선택된 구 + 검색어로 공연장 필터링 (두 조건 모두 만족해야 표시)
  // useMemo: district/query/venues가 실제로 바뀔 때만 새 배열을 만듦 — 매 렌더링마다 새 배열을 만들면
  // VenueMap의 마커 그리기 useEffect가 (내용은 같아도 배열 참조가 달라졌다는 이유로) 계속 재실행돼서
  // 마커를 클릭할 때마다 지도가 "전체 보기"로 리셋됐다가 다시 이동하는 버벅임(튕김)이 생김
  const list = useMemo(() => venues.filter((v) => {
    const matchDistrict = district === '전체' || extractDistrict(v.location) === district; // 구 필터 만족 여부
    const matchQuery = query === '' || v.name.toLowerCase().includes(query.toLowerCase()); // 이름 검색 만족 여부
    return matchDistrict && matchQuery; // 둘 다 만족하면 표시
  }), [venues, district, query]);

  // 마커/카드 클릭 시 선택 토글 — useCallback으로 함수 참조를 고정해 위와 같은 이유로 마커가 다시 그려지는 것을 방지
  // setSelected(prev => ...) 형태(함수형 업데이트)를 쓰면 selected 값을 클로저로 참조할 필요가 없어 deps 배열을 비워둘 수 있음
  const handleSelectVenue = useCallback((id) => {
    setSelected((prev) => (id === prev ? null : id));
  }, []);

  // 현재 선택(펼쳐진) 공연장 객체 — 없으면 null
  const sel = selected ? venues.find((v) => v.id === selected) : null;

  // 로딩 중일 때 보여줄 화면
  if (loading) {
    return (
      <div className="main">
        <div className="pad">
          <p className="muted">공연장 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="pad">
        <h1 className="h2 serif" style={{ marginBottom: 6 }}>재즈 공연장</h1>
        <p className="muted" style={{ marginBottom: 18 }}>서울 주요 재즈 공연장을 확인하세요.</p>

        {/* 지도 영역 — 필터링된 공연장 목록(list)을 카카오맵 위에 마커로 표시 */}
        <VenueMap
          venues={list}
          selected={selected}
          onSelect={handleSelectVenue} // 같은 마커 다시 클릭하면 선택 해제
        />

        {/* 공연장명 검색 */}
        <div className="field" style={{ marginTop: 18, marginBottom: 16, width: 'auto' }}>
          <div className="prefix">
            <span><Icon name="search" size={14} /></span>
            <input
              type="text"
              placeholder="공연장명 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)} // 입력값 변경 시 실시간 필터링
            />
          </div>
        </div>

        {/* 구 단위 필터 칩 버튼 목록 */}
        <div className="chip-group" style={{ marginBottom: 16 }}>
          {districts.map((d) => (
            <button
              key={d}
              className={`chip ${district === d ? 'on' : ''}`} // 선택된 칩에 'on' 클래스 추가
              onClick={() => { setDistrict(d); setSelected(null); }} // 필터 변경 시 선택 상태도 초기화
            >
              {d}
            </button>
          ))}
        </div>

        {/* 공연장 카드 목록 */}
        <div className="venue-list">
          {list.map((v) => (
            <div
              key={v.id}
              className={`venue-card ${selected === v.id ? 'selected' : ''}`}
              onClick={() => setSelected(v.id === selected ? null : v.id)} // 같은 카드 클릭 시 토글(닫힘)
            >
              <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                <div className="col grow" style={{ gap: 3 }}>

                  {/* 공연장 이름 */}
                  <b style={{ fontSize: 15 }}>{v.name}</b>

                  {/* 위치 정보 — 백엔드 필드명은 location */}
                  <span className="muted" style={{ fontSize: 12 }}>
                    <Icon name="map-pin" size={11} /> {v.location}
                  </span>

                  {/* 설명 — 관리자가 입력한 메모, 없으면 렌더링 안 함 */}
                  {v.description && (
                    <span className="muted" style={{ fontSize: 12, marginTop: 2 }}>{v.description}</span>
                  )}

                  {/* SNS / 홈페이지 링크 — 값이 있을 때만 표시 */}
                  <div className="row" style={{ gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    {v.instagramUrl && (
                      <a
                        className="link-chip"
                        href={v.instagramUrl}
                        target="_blank"     // 새 탭에서 열기
                        rel="noopener noreferrer" // 보안: 새 탭이 원래 페이지에 접근 못하게 막음
                        onClick={(e) => e.stopPropagation()} // 카드 클릭 이벤트로 전파되지 않도록 차단
                      >
                        <Icon name="instagram" size={12} /> Instagram
                      </a>
                    )}
                    {v.homepageUrl && (
                      <a
                        className="link-chip"
                        href={v.homepageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Icon name="globe" size={12} /> 홈페이지
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 필터 결과가 없을 때 빈 상태 표시 */}
        {list.length === 0 && (
          <div className="empty-state">
            <Icon name="building" size={28} color="var(--mute)" />
            <p className="muted">등록된 공연장이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
