import Avatar from '../../components/Avatar';
import { buildEdges, DATA, findMusician } from '../../data/mockData';

export default function Collaborators({ uuid, navigate }) {
  const edges = buildEdges(uuid, DATA.shows).slice(0, 8);
  if (!edges.length) return null;
  return (
    <section>
      <h4 className="sub-section-label">주요 협연</h4>
      <div className="collab-grid">
        {edges.map(({ partner, weight }) => {
          const m = findMusician(partner);
          return (
            <a key={partner} className="collab-chip" onClick={() => navigate && navigate('profile-public', { uuid: partner })}>
              <Avatar name={m.name} tier={m.tier} size="sm" />
              <div className="col" style={{ gap: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{m.name}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--mute)' }}>{weight}회 협연</span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}