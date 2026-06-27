import Icon from '../../components/Icon';
import Avatar from '../../components/Avatar';
import { DATA, findMusician, findVenue } from '../../data/mockData';

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getFullYear()}년 ${dt.getMonth() + 1}월 ${dt.getDate()}일 (${['일','월','화','수','목','금','토'][dt.getDay()]})`;
}

export default function ScreenConcertDetail({ concertId, navigate }) {
  const c = DATA.concerts.find((x) => x.id === concertId);
  if (!c) return <div className="pad"><p className="muted">공연을 찾을 수 없습니다.</p></div>;

  const venue = findVenue(c.venueId);
  const leader = findMusician(c.leader);
  const lineup = (c.lineup || []).map(findMusician);

  return (
    <div className="main">
      <div className="pad tight">
        <a className="back-link" onClick={() => navigate('concerts')}><Icon name="arrow-left" size={15} /> 공연 목록</a>

        <div className="concert-hero">
          <span className={`pill ${c.status === 'upcoming' ? 'wine' : 'light'}`}>{c.status === 'upcoming' ? '예정 공연' : '지난 공연'}</span>
          <h1 className="h2 serif" style={{ marginTop: 10 }}>{c.title}</h1>

          <div className="concert-meta-grid">
            <div className="cm"><Icon name="calendar" size={14} color="var(--wine)" /><span>{fmtDate(c.date)} {c.time}</span></div>
            <div className="cm"><Icon name="building" size={14} color="var(--wine)" /><span>{venue?.name} — {venue?.area}</span></div>
            <div className="cm"><Icon name="ticket" size={14} color="var(--wine)" /><span>{c.price}</span></div>
            <div className="cm"><Icon name="users" size={14} color="var(--wine)" /><span>{venue?.cap}석 규모</span></div>
          </div>
        </div>

        <section style={{ marginTop: 24 }}>
          <h3 className="section-label">라인업</h3>
          <div className="card flush">
            {lineup.map((m) => (
              <div key={m.uuid} className="lineup-row" onClick={() => navigate('profile-public', { uuid: m.uuid })}>
                <Avatar name={m.name} tier={m.tier} size="md" />
                <div className="col grow" style={{ gap: 2 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <b style={{ fontSize: 14 }}>{m.name}</b>
                    {m.uuid === c.leader ? <span className="pill wine sm">리더</span> : null}
                  </div>
                  <span className="muted" style={{ fontSize: 12 }}>{m.role || m.instrument}</span>
                </div>
                <Icon name="arrow-right" size={14} color="var(--mute)" />
              </div>
            ))}
          </div>
        </section>

        {c.status === 'upcoming' && (
          <div className="concert-cta">
            <button className="btn primary lg">
              <Icon name="ticket" size={16} /> 예매하기
            </button>
            <button className="btn ghost lg">
              <Icon name="share" size={16} /> 공유
            </button>
          </div>
        )}
      </div>
    </div>
  );
}