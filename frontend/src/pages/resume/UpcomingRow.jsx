import Icon from '../../components/Icon';
import { findMusician, findVenue } from '../../data/mockData';

export default function UpcomingRow({ show, navigate }) {
  const venue = findVenue(show.venueId);
  const lineup = (show.lineup || []).map(findMusician);
  return (
    <div className="upcoming-row">
      <div className="ur-date">
        <span className="urm">{new Date(show.date).toLocaleString('ko', { month: 'short' })}</span>
        <span className="urd">{new Date(show.date).getDate()}</span>
      </div>
      <div className="col grow" style={{ gap: 3 }}>
        <div className="row" style={{ gap: 8 }}>
          <b style={{ fontSize: 14 }}>{show.venue || venue?.name}</b>
          <span className="pill wine sm">{show.role}</span>
          {show.ticket ? <span className="pill light sm">{show.ticket}</span> : null}
        </div>
        <span className="muted" style={{ fontSize: 12 }}>{show.city || venue?.area} · {show.time}</span>
        <div className="lineup" style={{ marginTop: 2 }}>
          {lineup.map((m) => (
            <a key={m.uuid} className="lm" onClick={() => navigate && navigate('profile-public', { uuid: m.uuid })}>{m.name}</a>
          ))}
        </div>
      </div>
    </div>
  );
}