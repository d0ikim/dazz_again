import Icon from '../../components/Icon';

export default function VenueMap({ venues = [], selected, onSelect }) {
  return (
    <div className="venue-map">
      <div className="map-bg">
        {venues.map((v) => (
          <button
            key={v.id}
            className={`map-pin ${selected === v.id ? 'active' : ''} ${v.tonight ? 'live' : ''}`}
            style={{ left: `${v.x * 100}%`, top: `${v.y * 100}%` }}
            onClick={() => onSelect(v.id)}
            title={v.name}
          >
            <Icon name="pin" size={selected === v.id ? 20 : 16} color={selected === v.id ? 'var(--wine)' : v.tonight ? 'var(--ink)' : 'var(--mute)'} />
            {v.tonight && <span className="live-dot" />}
          </button>
        ))}
      </div>
      <div className="map-legend">
        <span className="legend-item"><span className="dot live" /> 오늘 공연</span>
        <span className="legend-item"><span className="dot" /> 공연장</span>
      </div>
    </div>
  );
}