import Icon from '../../components/Icon';
import { findMusician } from '../../data/mockData';

export default function ShowRow({ show, meUuid, navigate }) {
  const lineup = (show.lineup || []).map(findMusician);
  const isLeader = show.role === 'Leader';
  return (
    <div className="show-row">
      <div className="sd">
        <span className="sm">{show.date?.slice(5, 7) || ''}</span>
        <span className="sdy">{show.date?.slice(8, 10) || ''}</span>
      </div>
      <div className="col grow" style={{ gap: 3 }}>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <span className={`pill ${isLeader ? 'wine' : 'light'}`} style={{ fontSize: 10 }}>{show.role}</span>
          <b style={{ fontSize: 14 }}>{show.venue}</b>
          {show.city ? <span className="muted" style={{ fontSize: 12 }}>— {show.city}</span> : null}
        </div>
        <div className="lineup">
          {lineup.map((m) => (
            <a key={m.uuid} className={`lm ${m.uuid === meUuid ? 'me' : ''}`} onClick={() => navigate && navigate('profile-public', { uuid: m.uuid })}>
              {m.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}