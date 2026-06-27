import { useState } from 'react';
import Icon from '../../components/Icon';
import Avatar from '../../components/Avatar';
import { DATA, findMusician, findVenue } from '../../data/mockData';

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getMonth() + 1}월 ${dt.getDate()}일 (${['일','월','화','수','목','금','토'][dt.getDay()]})`;
}

export default function ScreenConcerts({ navigate }) {
  const [tab, setTab] = useState('upcoming');
  const list = DATA.concerts.filter((c) => c.status === tab);

  return (
    <div className="main">
      <div className="pad">
        <h1 className="h2 serif" style={{ marginBottom: 6 }}>공연 일정</h1>
        <p className="muted" style={{ marginBottom: 18 }}>DAZZ에 등록된 뮤지션들의 공연 일정을 확인하세요.</p>

        <div className="tab-row" style={{ marginBottom: 18 }}>
          <button className={`tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>예정 공연</button>
          <button className={`tab ${tab === 'past' ? 'active' : ''}`} onClick={() => setTab('past')}>지난 공연</button>
        </div>

        <div className="col" style={{ gap: 12 }}>
          {list.map((c) => {
            const venue = findVenue(c.venueId);
            const leader = findMusician(c.leader);
            return (
              <div key={c.id} className="concert-card" onClick={() => navigate('concert-detail', { concertId: c.id })}>
                <div className="cc-date">
                  <span className="ccm">{new Date(c.date).toLocaleString('ko', { month: 'short' })}</span>
                  <span className="ccd">{new Date(c.date).getDate()}</span>
                </div>
                <div className="col grow" style={{ gap: 4 }}>
                  <div className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <b style={{ fontSize: 15 }}>{c.title}</b>
                    {c.status === 'upcoming' ? <span className="pill wine sm">예정</span> : <span className="pill light sm">종료</span>}
                  </div>
                  <div className="row" style={{ gap: 10, alignItems: 'center' }}>
                    <span className="muted" style={{ fontSize: 12 }}><Icon name="building" size={11} /> {venue?.name}</span>
                    <span className="muted" style={{ fontSize: 12 }}><Icon name="clock" size={11} /> {c.time}</span>
                    <span className="muted" style={{ fontSize: 12 }}><Icon name="ticket" size={11} /> {c.price}</span>
                  </div>
                  <div className="lineup" style={{ marginTop: 2 }}>
                    {(c.lineup || []).map((uuid) => {
                      const m = findMusician(uuid);
                      return <a key={uuid} className="lm" onClick={(e) => { e.stopPropagation(); navigate('profile-public', { uuid }); }}>{m.name}</a>;
                    })}
                  </div>
                </div>
                <Icon name="arrow-right" size={16} color="var(--mute)" />
              </div>
            );
          })}
        </div>

        {list.length === 0 && (
          <div className="empty-state">
            <Icon name="calendar" size={28} color="var(--mute)" />
            <p className="muted">{tab === 'upcoming' ? '예정된 공연이 없습니다' : '지난 공연 기록이 없습니다'}</p>
          </div>
        )}
      </div>
    </div>
  );
}