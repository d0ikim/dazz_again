import Avatar from '../../components/Avatar';
import { findMusician } from '../../data/mockData';

export default function TeamsList({ teams = [], navigate }) {
  if (!teams.length) return null;
  return (
    <section>
      <h4 className="sub-section-label">소속 팀 / 밴드</h4>
      <div className="col" style={{ gap: 12 }}>
        {teams.map((t, i) => (
          <div key={i} className="team-block">
            <div className="row" style={{ gap: 10, alignItems: 'center' }}>
              <b style={{ fontSize: 14 }}>{t.name}</b>
              <span className="pill light sm">{t.role}</span>
            </div>
            <div className="member-chips">
              {(t.members || []).map((uuid) => {
                const m = findMusician(uuid);
                return (
                  <a key={uuid} className="member-chip" onClick={() => navigate && navigate('profile-public', { uuid })}>
                    <Avatar name={m.name} size="sm" />
                    <span style={{ fontSize: 12 }}>{m.name}</span>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}