import { useState } from 'react';
import Icon from '../../components/Icon';
import { DATA, findMusician, findVenue } from '../../data/mockData';

export default function ScreenAdminConcerts({ navigate, onToast }) {
  const [concerts, setConcerts] = useState(DATA.concerts);
  const [tab, setTab] = useState('upcoming');

  const list = concerts.filter((c) => c.status === tab);

  const cancel = (id) => {
    setConcerts((p) => p.map((c) => c.id === id ? { ...c, status: 'past' } : c));
    onToast && onToast('공연이 취소(종료)됐습니다');
  };

  return (
    <div className="main dashboard-main">
      <div className="pad">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 className="h2 serif" style={{ margin: 0 }}>공연 관리 ({concerts.length})</h1>
          <button className="btn primary sm"><Icon name="plus" size={14} /> 공연 등록</button>
        </div>

        <div className="tab-row" style={{ marginBottom: 18 }}>
          <button className={`tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>예정 ({concerts.filter((c) => c.status === 'upcoming').length})</button>
          <button className={`tab ${tab === 'past' ? 'active' : ''}`} onClick={() => setTab('past')}>종료 ({concerts.filter((c) => c.status === 'past').length})</button>
        </div>

        <div className="card flush">
          <table className="admin-table">
            <thead>
              <tr>
                <th>공연명</th>
                <th>날짜</th>
                <th>공연장</th>
                <th>가격</th>
                <th>라인업</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const venue = findVenue(c.venueId);
                const leader = findMusician(c.leader);
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="col" style={{ gap: 2 }}>
                        <b style={{ fontSize: 13 }}>{c.title}</b>
                        <span className="muted" style={{ fontSize: 11 }}>리더: {leader?.name}</span>
                      </div>
                    </td>
                    <td className="mono">{c.date} {c.time}</td>
                    <td className="muted">{venue?.name}</td>
                    <td className="mono">{c.price}</td>
                    <td>
                      <div className="lineup" style={{ flexWrap: 'nowrap', gap: 4 }}>
                        {(c.lineup || []).slice(0, 3).map((uuid) => {
                          const m = findMusician(uuid);
                          return <span key={uuid} className="lm" style={{ fontSize: 11 }}>{m.name}</span>;
                        })}
                        {c.lineup?.length > 3 ? <span className="muted" style={{ fontSize: 11 }}>+{c.lineup.length - 3}</span> : null}
                      </div>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <button className="btn ghost sm" onClick={() => navigate('concert-detail', { concertId: c.id })}>
                          <Icon name="external" size={13} />
                        </button>
                        {c.status === 'upcoming' && (
                          <button className="btn ghost sm" onClick={() => cancel(c.id)}>
                            <Icon name="x" size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.length === 0 && (
            <div className="empty-state sm"><p className="muted">{tab === 'upcoming' ? '예정 공연 없음' : '지난 공연 없음'}</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
