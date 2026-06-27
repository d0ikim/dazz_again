import { useState } from 'react';
import Tier from '../../components/Tier';
import Icon from '../../components/Icon';
import { DATA } from '../../data/mockData';

const FILTERS = ['all', 'Piano', 'Bass', 'Drums', 'Sax', 'Guitar', 'Vocal'];

export default function ScreenDirectory({ navigate, auth, onLoginClick }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const list = DATA.musicians.filter((m) => {
    if (filter !== 'all' && m.role !== filter) return false;
    if (query && !m.name.includes(query) && !m.role.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="main">
      <div className="pad wide">

        <div className="hero">
          <div className="stamp" />
          <div className="eyebrow" style={{ marginBottom: 10 }}>K-JAZZ INSIGHT NAVIGATOR · MVP</div>
          <h1 className="h1 serif" style={{ fontSize: 44, marginBottom: 12, maxWidth: 720 }}>
            한국재즈 뮤지션을<br />뮤지션이 직접 정리합니다.
          </h1>
          <p className="lead" style={{ maxWidth: 560, marginBottom: 20 }}>
            DAZZ는 재즈 입문자가 길을 잃지 않도록 — 그리고 현역 뮤지션이 정돈된 디지털 이력서를 가질 수 있도록 — 뮤지션이 직접 관리하는 포트폴리오 플랫폼입니다.
          </p>
          <div className="row" style={{ gap: 10 }}>
            {auth?.role === 'guest' ? (
              <button className="btn primary lg" onClick={() => onLoginClick && onLoginClick('become')}>
                내 프로필 만들기 <Icon name="arrow-right" size={16} />
              </button>
            ) : auth?.role === 'general' ? (
              <button className="btn primary lg" onClick={() => navigate('become-musician')}>
                내 프로필 만들기 <Icon name="arrow-right" size={16} />
              </button>
            ) : (
              <button className="btn primary lg" onClick={() => navigate('dashboard')}>
                대시보드 <Icon name="arrow-right" size={16} />
              </button>
            )}
            <button className="btn secondary lg" onClick={() => navigate('profile-public', { uuid: DATA.me.uuid })}>
              샘플 프로필 보기
            </button>
          </div>
          <div className="statbar">
            <div className="stat"><b>{DATA.musicians.length}</b><span>뮤지션</span></div>
            <div className="stat"><b>{DATA.shows.length * 14}</b><span>등록된 공연</span></div>
            <div className="stat"><b>{DATA.shows.length * 9}</b><span>협업 엣지</span></div>
          </div>
        </div>

        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14, alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>뮤지션 디렉토리</div>
            <h2 className="h2 serif" style={{ margin: 0 }}>활동중인 뮤지션 {DATA.musicians.length}명</h2>
          </div>
          <div className="field" style={{ width: 240, marginBottom: 0 }}>
            <div className="prefix">
              <span><Icon name="search" size={14} /></span>
              <input type="text" placeholder="이름·악기 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="row" style={{ gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`pill lg ${filter === f ? 'wine-solid' : ''}`}
              style={{ cursor: 'pointer', border: 0 }}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? '전체' : f}
            </button>
          ))}
        </div>

        <div className="dir">
          {list.map((m) => (
            <div key={m.uuid} className="card-m" onClick={() => navigate('profile-public', { uuid: m.uuid })}>
              <div className="cover imgph">{m.name} 사진</div>
              <div className="meta">
                <div className="name serif">
                  {m.name}
                  {m.tier === 'pro' ? <Tier tier="pro" short /> : null}
                </div>
                <div className="role">{m.role}</div>
                <div className="nums">
                  <span><b>{m.shows}</b> 공연</span>
                  <span><b>{m.collabs}</b> 협업</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {list.length === 0 && (
          <div className="empty-state">
            <Icon name="search" size={28} color="var(--mute)" />
            <p className="muted">검색 결과가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
