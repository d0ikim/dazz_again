// 공연 이력 한 줄 컴포넌트 — 공연 목록/프로필/대시보드에서 공통으로 사용
// show: 백엔드 Performance 객체 { id, startTime, title, venue, genre, cancelled }
import Icon from '../../components/Icon'; // 아이콘 컴포넌트

export default function ShowRow({ show, navigate }) {
  // startTime: "2026-05-18T20:00:00" 형식의 ISO 문자열
  const dt = show.startTime ? new Date(show.startTime) : null;

  // 월/일 표시: 예) "5/18"
  const dateStr = dt ? `${dt.getMonth() + 1}/${dt.getDate()}` : '';

  return (
    <div
      className="show-row"
      style={{ cursor: navigate ? 'pointer' : 'default' }}
      onClick={() => navigate && navigate('concert-detail', { concertId: show.id })}
    >
      {/* 날짜 — 왼쪽 정렬 */}
      <span className="date-inline">{dateStr}</span>

      {/* 공연명 + 부가정보 — 가운데 정렬 */}
      <div className="col" style={{ gap: 3, alignItems: 'center', textAlign: 'center' }}>
        <b style={{ fontSize: 16 }}>{show.title}</b>

        <div className="row" style={{ gap: 10, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          {/* 공연장명 — venue는 백엔드가 중첩 객체로 반환 */}
          {show.venue?.name && (
            <span className="muted" style={{ fontSize: 12 }}>
              <Icon name="building" size={11} /> {show.venue.name}
            </span>
          )}

          {/* 장르 — 값이 있을 때만 표시 */}
          {show.genre && (
            <span className="pill light" style={{ fontSize: 10 }}>{show.genre}</span>
          )}

          {/* 취소된 공연 표시 */}
          {show.cancelled && (
            <span className="pill light" style={{ fontSize: 10 }}>취소</span>
          )}
        </div>
      </div>

      {/* 상세 페이지 이동 화살표 — 오른쪽 정렬 */}
      {navigate && <Icon name="arrow-right" size={14} color="var(--mute)" />}
    </div>
  );
}
