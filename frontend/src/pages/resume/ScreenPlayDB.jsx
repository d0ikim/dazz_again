import { useState } from 'react';
import GraphView from '../visitor/GraphView';
import Avatar from '../../components/Avatar';
import Tier from '../../components/Tier';
import Icon from '../../components/Icon';
import { DATA, buildEdges, findMusician } from '../../data/mockData';

function MusicianMap({ uuid, navigate }) {
  const musician = findMusician(uuid);
  const edges = buildEdges(uuid, DATA.shows);
  const partners = edges.slice(0, 10);

  return (
    <div className="main">
      <div className="pad tight">
        <a className="back-link" onClick={() => navigate('playdb')}><Icon name="arrow-left" size={15} /> 인맥지도 목록</a>

        <div className="profile-hero" style={{ paddingTop: 20 }}>
          <Avatar name={musician.name} tier={musician.tier} size="xl" />
          <div className="col" style={{ gap: 4 }}>
            <div className="row" style={{ gap: 8, alignItems: 'center' }}>
              <h1 className="h2 serif" style={{ margin: 0 }}>{musician.name}</h1>
              <Tier tier={musician.tier} />
            </div>
            <span className="role-label">{musician.role || musician.instrument}</span>
            <span className="muted" style={{ fontSize: 13 }}>협연 뮤지션 {partners.length}명</span>
          </div>
          <button className="btn ghost sm" style={{ alignSelf: 'flex-start', marginLeft: 'auto' }}
            onClick={() => navigate('profile-public', { uuid })}>
            프로필 보기 <Icon name="arrow-right" size={14} />
          </button>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 22 }}>
          <GraphView edges={edges} center={uuid} navigate={(_, p) => p?.uuid && navigate('playdb', { uuid: p.uuid })} size="full" />
        </div>

        <h3 className="section-label">협연 뮤지션 ({partners.length}명)</h3>
        <div className="card flush">
          {partners.map(({ partner, weight }) => {
            const m = findMusician(partner);
            return (
              <div key={partner} className="collab-list-row">
                <Avatar name={m.name} tier={m.tier} size="md" />
                <div className="col grow" style={{ gap: 2 }}>
                  <b style={{ fontSize: 14 }}>{m.name}</b>
                  <span className="muted" style={{ fontSize: 12 }}>{m.role} · {weight}회 함께 공연</span>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn ghost sm" onClick={() => navigate('playdb', { uuid: partner })}>
                    인맥지도 <Icon name="graph" size={13} />
                  </button>
                  <button className="btn ghost sm" onClick={() => navigate('profile-public', { uuid: partner })}>
                    <Icon name="arrow-right" size={14} />
                  </button>
                </div>
              </div>
            );
          })}
          {partners.length === 0 && (
            <div className="empty-state sm">
              <p className="muted">등록된 협연 기록이 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MusicianPicker({ navigate }) {
  const [query, setQuery] = useState('');
  const list = DATA.musicians.filter((m) => !query || m.name.includes(query) || m.role.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="main">
      <div className="pad tight">
        <h1 className="h2 serif" style={{ marginBottom: 6 }}>인맥지도</h1>
        <p className="muted" style={{ marginBottom: 18 }}>공연 데이터를 기반으로 뮤지션 간의 협연 관계를 시각화합니다. 뮤지션을 선택하세요.</p>

        <div className="field" style={{ marginBottom: 16 }}>
          <div className="prefix">
            <span><Icon name="search" size={14} /></span>
            <input type="text" placeholder="뮤지션 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        <div className="card flush">
          {list.map((m) => (
            <div key={m.uuid} className="collab-list-row" onClick={() => navigate('playdb', { uuid: m.uuid })}>
              <Avatar name={m.name} tier={m.tier} size="md" />
              <div className="col grow" style={{ gap: 2 }}>
                <div className="row" style={{ gap: 8 }}>
                  <b style={{ fontSize: 14 }}>{m.name}</b>
                  <Tier tier={m.tier} short />
                </div>
                <span className="muted" style={{ fontSize: 12 }}>{m.role} · {m.collabs}명과 협연</span>
              </div>
              <Icon name="graph" size={16} color="var(--mute)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ScreenPlayDB({ uuid, navigate }) {
  if (uuid) return <MusicianMap uuid={uuid} navigate={navigate} />;
  return <MusicianPicker navigate={navigate} />;
}
