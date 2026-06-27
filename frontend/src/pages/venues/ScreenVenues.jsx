import { useState } from 'react';
import VenueMap from './VenueMap';
import Icon from '../../components/Icon';
import { DATA } from '../../data/mockData';

export default function ScreenVenues({ navigate }) {
  const [selected, setSelected] = useState(null);
  const [district, setDistrict] = useState('전체');

  const districts = ['전체', ...new Set(DATA.venues.map((v) => v.area.split(' · ')[0]))];
  const list = DATA.venues.filter((v) => district === '전체' || v.area.startsWith(district));
  const sel = selected ? DATA.venues.find((v) => v.id === selected) : null;

  return (
    <div className="main">
      <div className="pad">
        <h1 className="h2 serif" style={{ marginBottom: 6 }}>재즈 공연장</h1>
        <p className="muted" style={{ marginBottom: 18 }}>서울 주요 재즈 공연장을 지도와 목록으로 확인하세요. 오늘 공연 중인 곳은 강조 표시됩니다.</p>

        <VenueMap venues={list} selected={selected} onSelect={(id) => setSelected(id === selected ? null : id)} />

        <div className="chip-group" style={{ marginTop: 18, marginBottom: 16 }}>
          {districts.map((d) => (
            <button key={d} className={`chip ${district === d ? 'on' : ''}`} onClick={() => { setDistrict(d); setSelected(null); }}>{d}</button>
          ))}
        </div>

        <div className="venue-list">
          {list.map((v) => (
            <div key={v.id} className={`venue-card ${selected === v.id ? 'selected' : ''}`} onClick={() => setSelected(v.id === selected ? null : v.id)}>
              <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                <div className="col grow" style={{ gap: 3 }}>
                  <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                    <b style={{ fontSize: 15 }}>{v.name}</b>
                    {v.tonight ? <span className="pill wine sm"><Icon name="music" size={11} /> Live Tonight</span> : null}
                  </div>
                  <span className="muted" style={{ fontSize: 12 }}>{v.eng} · {v.area}</span>
                  <div className="row" style={{ gap: 12, marginTop: 2 }}>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--mute)' }}><Icon name="users" size={11} /> {v.cap}석</span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--mute)' }}>Since {v.since}</span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--mute)' }}>{v.dist}km</span>
                  </div>
                  <div className="row" style={{ gap: 6, marginTop: 4 }}>
                    {v.tags.map((t) => <span key={t} className="pill light">{t}</span>)}
                  </div>
                </div>
              </div>
              {v.tonight && selected === v.id && (
                <div className="tonight-box">
                  <Icon name="music" size={13} color="var(--wine)" />
                  <span style={{ fontSize: 13 }}>오늘 공연: <b>{v.tonight}</b></span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}