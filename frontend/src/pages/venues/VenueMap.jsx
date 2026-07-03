// 공연장 위치를 카카오맵 위에 마커로 표시하는 컴포넌트
import { useEffect, useRef, useState } from 'react'; // useEffect: SDK 로드/마커 갱신 / useRef: 지도・마커 객체 보관 / useState: 지도 준비 여부 표시

// 좌표가 있는 공연장이 하나도 없을 때 사용할 기본 중심점 (서울시청 좌표)
const SEOUL_CENTER = { lat: 37.5665, lng: 126.9780 };

// 공연장 이름/주소를 인포윈도우 HTML에 그대로 끼워넣기 전에 이스케이프 처리 (특수문자로 HTML이 깨지는 것 방지)
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

// 마커 위에 표시할 인포윈도우(말풍선) HTML 내용을 만듦
function buildInfoWindowContent(venue) {
  return `
    <div style="padding:8px 12px;min-width:150px;max-width:220px;font-family:'Noto Sans KR',sans-serif;">
      <strong style="font-size:13px;">${escapeHtml(venue.name)}</strong>
      <div style="margin-top:2px;font-size:12px;color:#888;">${escapeHtml(venue.location)}</div>
    </div>
  `;
}

export default function VenueMap({ venues = [], selected, onSelect }) {
  const boxRef = useRef(null);   // 카카오맵이 실제로 그려질 div DOM 요소를 가리킴
  const mapRef = useRef(null);   // 생성된 카카오 지도 객체 (한 번만 만들고 계속 재사용)
  const markersRef = useRef([]); // 지도 위에 그려둔 마커 목록 (venues가 바뀔 때 지우고 다시 그리기 위해 보관)
  const [ready, setReady] = useState(false); // 카카오맵 SDK 로드 + 지도 생성이 끝났는지 여부

  // 1) 컴포넌트가 처음 화면에 나타날 때 딱 한 번 — 카카오맵 SDK로 지도를 생성
  useEffect(() => {
    // window.kakao: index.html의 <script>가 불러온 카카오맵 SDK가 등록해두는 전역 객체
    if (!window.kakao || !window.kakao.maps) {
      // 키가 잘못됐거나 도메인 등록이 안 되어 있으면 SDK 자체가 로드되지 않음
      console.error('[VenueMap] 카카오맵 SDK를 불러오지 못했습니다. .env의 VITE_KAKAO_MAP_KEY와 플랫폼 도메인 등록을 확인하세요.');
      return;
    }

    // index.html에서 autoload=false로 불러왔기 때문에, 지도 관련 기능을 쓰기 전에 직접 load를 호출해야 함
    window.kakao.maps.load(() => {
      mapRef.current = new window.kakao.maps.Map(boxRef.current, {
        center: new window.kakao.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng),
        level: 7, // 지도 확대 레벨 — 숫자가 작을수록 확대됨 (1~14)
      });
      setReady(true); // 아래 useEffect들이 이제 지도를 다뤄도 된다는 신호
    });
  }, []);

  // 2) venues 목록이 바뀔 때마다 — 기존 마커를 지우고, 좌표가 있는 공연장만 새로 마커로 표시
  useEffect(() => {
    if (!ready) return; // 지도가 아직 준비되지 않았으면 아무것도 하지 않음

    // 이전에 그려둔 마커와 인포윈도우를 모두 제거 (지도가 아니라 마커만 제거, 지도 자체는 재사용)
    markersRef.current.forEach(({ marker, infowindow }) => {
      infowindow.close();
      marker.setMap(null);
    });
    markersRef.current = [];

    // 좌표값이 있는 공연장만 필터링 (아직 좌표를 못 구한 곳은 지도에 표시할 수 없음)
    const withCoords = venues.filter((v) => v.latitude != null && v.longitude != null);

    withCoords.forEach((v) => {
      const position = new window.kakao.maps.LatLng(v.latitude, v.longitude);
      const marker = new window.kakao.maps.Marker({ position, title: v.name });
      marker.setMap(mapRef.current);

      // 마커 위에 마우스를 올리면 뜨는 말풍선(공연장 이름 + 위치) — removable: false는 닫기(x) 버튼 없이 마우스를 떼면 자동으로 닫힘
      const infowindow = new window.kakao.maps.InfoWindow({
        content: buildInfoWindowContent(v),
        removable: false,
      });

      window.kakao.maps.event.addListener(marker, 'mouseover', () => infowindow.open(mapRef.current, marker));
      window.kakao.maps.event.addListener(marker, 'mouseout', () => infowindow.close());

      // 마커 클릭 시 말풍선도 띄우고, 부모 컴포넌트(ScreenVenues)에게 선택된 공연장 id를 알려줌
      window.kakao.maps.event.addListener(marker, 'click', () => {
        infowindow.open(mapRef.current, marker);
        onSelect(v.id);
      });

      markersRef.current.push({ marker, infowindow });
    });

    // 좌표가 있는 공연장이 하나라도 있으면, 모든 마커가 한 화면에 들어오도록 지도 범위를 자동 조정
    if (withCoords.length > 0) {
      const bounds = new window.kakao.maps.LatLngBounds();
      withCoords.forEach((v) => bounds.extend(new window.kakao.maps.LatLng(v.latitude, v.longitude)));
      mapRef.current.setBounds(bounds);
    }
  }, [venues, ready, onSelect]);

  // 3) 선택된 공연장(selected)이 바뀔 때마다 — 그 공연장 좌표로 지도 중심을 부드럽게 이동
  useEffect(() => {
    if (!ready || !selected) return;

    const target = venues.find((v) => v.id === selected);
    if (!target || target.latitude == null || target.longitude == null) return;

    mapRef.current.panTo(new window.kakao.maps.LatLng(target.latitude, target.longitude));
  }, [selected, ready, venues]);

  return (
    <div className="venue-map">
      {/* 카카오맵 SDK가 실제 지도를 그려 넣는 영역 */}
      <div ref={boxRef} style={{ width: '100%', height: '100%' }} />
      <div className="map-legend">
        <span className="legend-item"><span className="dot" /> 공연장</span>
      </div>
    </div>
  );
}