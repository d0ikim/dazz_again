import { useState } from 'react';
import Icon from '../../components/Icon';
import Avatar from '../../components/Avatar';
import Tier from '../../components/Tier';
import { DATA, findMusician } from '../../data/mockData';

export default function ScreenClaimExisting({ navigate, onSubmitRequest }) {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState(null);

  const claimable = DATA.musicians.filter((m) => m.uuid !== DATA.me.uuid);
  const list = claimable.filter((m) => !query || m.name.includes(query) || m.role.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="main" style={{ background: 'var(--paper)' }}>
      <div className="pad tight">
        <a className="back-link" onClick={() => navigate('become-musician')}><Icon name="arrow-left" size={15} /> 뒤로</a>
        <h1 className="h2 serif" style={{ margin: '14px 0 6px' }}>본인 프로필 찾기</h1>
        <p className="muted" style={{ marginBottom: 20 }}>초기 데이터에 등록된 뮤지션 중 본인을 선택하세요. 동명이인 방지를 위해 악기·공연 수를 함께 확인해주세요.</p>

        <div className="field" style={{ marginBottom: 16 }}>
          <div className="prefix">
            <span><Icon name="search" size={14} /></span>
            <input type="text" placeholder="본인 활동명 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        <div className="card flush" style={{ marginBottom: 22 }}>
          {list.map((m) => (
            <div key={m.uuid} className={`claim-row ${picked === m.uuid ? 'on' : ''}`} onClick={() => setPicked(m.uuid)}>
              <Avatar name={m.name} tier={m.tier} size="lg" />
              <div className="col grow" style={{ gap: 2 }}>
                <div className="row" style={{ gap: 8 }}><b style={{ fontSize: 15 }}>{m.name}</b><Tier tier={m.tier} short /></div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--mute)' }}>{m.role} · {m.shows}회 공연 · UUID {m.uuid}</span>
              </div>
              <span className={`radio ${picked === m.uuid ? 'on' : ''}`}>{picked === m.uuid ? <Icon name="check" size={13} stroke={3} /> : null}</span>
            </div>
          ))}
        </div>

        <div className="banner" style={{ marginBottom: 20 }}>
          <Icon name="shield" size={16} color="var(--wine)" />
          <span className="grow" style={{ fontSize: 13 }}>본인이 아닌 프로필을 신청하면 거절됩니다. 승인 심사 시 활동 증빙을 확인합니다.</span>
        </div>

        <div className="row" style={{ justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn ghost" onClick={() => navigate('become-musician')}>취소</button>
          <button className="btn primary" disabled={!picked} onClick={() => {
            const m = findMusician(picked);
            onSubmitRequest({ kind: 'claim', musicianUuid: picked, name: m.name, instrument: m.role });
          }}>
            <Icon name="shield" size={16} /> 이 프로필로 본인 인증 신청
          </button>
        </div>
      </div>
    </div>
  );
}