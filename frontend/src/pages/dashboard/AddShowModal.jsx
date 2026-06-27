import { useState } from 'react';
import Icon from '../../components/Icon';
import { DATA, findMusician } from '../../data/mockData';

export default function AddShowModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ date: '', venue: '', city: '', role: 'Leader', lineup: [] });
  const [lineupQ, setLineupQ] = useState('');

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const toggleLineup = (uuid) => {
    const has = form.lineup.includes(uuid);
    set('lineup', has ? form.lineup.filter((u) => u !== uuid) : [...form.lineup, uuid]);
  };

  const candidates = DATA.musicians.filter((m) => !lineupQ || m.name.includes(lineupQ));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 className="serif" style={{ fontSize: 20, fontWeight: 700 }}>공연 이력 추가</h2>
          <button className="btn icon ghost sm" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        <div className="form-grid">
          <div className="field">
            <label className="label">날짜</label>
            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>
          <div className="field">
            <label className="label">역할</label>
            <select value={form.role} onChange={(e) => set('role', e.target.value)}>
              <option value="Leader">Leader</option>
              <option value="Sideman">Sideman</option>
              <option value="Guest">Guest</option>
            </select>
          </div>
          <div className="field">
            <label className="label">공연장</label>
            <input type="text" placeholder="공연장 이름" value={form.venue} onChange={(e) => set('venue', e.target.value)} />
          </div>
          <div className="field">
            <label className="label">지역</label>
            <input type="text" placeholder="서울 · 홍대" value={form.city} onChange={(e) => set('city', e.target.value)} />
          </div>
        </div>

        <div className="field" style={{ marginTop: 4 }}>
          <label className="label">라인업 (함께 한 뮤지션)</label>
          <div className="prefix" style={{ marginBottom: 8 }}>
            <span><Icon name="search" size={13} /></span>
            <input type="text" placeholder="뮤지션 검색" value={lineupQ} onChange={(e) => setLineupQ(e.target.value)} />
          </div>
          <div className="lineup-pick">
            {candidates.slice(0, 8).map((m) => (
              <button key={m.uuid} className={`chip ${form.lineup.includes(m.uuid) ? 'on' : ''}`} onClick={() => toggleLineup(m.uuid)}>
                {m.name} <span className="muted">{m.role}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button className="btn ghost" onClick={onClose}>취소</button>
          <button className="btn primary" disabled={!form.date || !form.venue} onClick={() => { onAdd(form); onClose(); }}>
            <Icon name="plus" size={15} /> 추가
          </button>
        </div>
      </div>
    </div>
  );
}
