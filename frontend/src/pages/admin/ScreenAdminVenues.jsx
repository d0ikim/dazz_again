import { useState } from 'react';
import Icon from '../../components/Icon';
import { DATA } from '../../data/mockData';

export default function ScreenAdminVenues({ navigate, onToast }) {
  const [venues, setVenues] = useState(DATA.venues);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const startEdit = (v) => { setEditing(v.id); setForm({ ...v }); };
  const save = () => {
    setVenues((p) => p.map((v) => v.id === editing ? { ...v, ...form } : v));
    onToast && onToast('공연장 정보가 저장됐습니다');
    setEditing(null);
  };

  return (
    <div className="main dashboard-main">
      <div className="pad">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 className="h2 serif" style={{ margin: 0 }}>공연장 관리 ({venues.length})</h1>
          <button className="btn primary sm"><Icon name="plus" size={14} /> 추가</button>
        </div>

        <div className="card flush">
          <table className="admin-table">
            <thead>
              <tr>
                <th>공연장명</th>
                <th>영문명</th>
                <th>위치</th>
                <th>수용</th>
                <th>오픈</th>
                <th>Tonight</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {venues.map((v) => (
                <tr key={v.id} className={editing === v.id ? 'editing' : ''}>
                  {editing === v.id ? (
                    <>
                      <td><input className="table-input" value={form.name || ''} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></td>
                      <td><input className="table-input" value={form.eng || ''} onChange={(e) => setForm((p) => ({ ...p, eng: e.target.value }))} /></td>
                      <td><input className="table-input" value={form.area || ''} onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))} /></td>
                      <td><input className="table-input" type="number" value={form.cap || ''} onChange={(e) => setForm((p) => ({ ...p, cap: +e.target.value }))} /></td>
                      <td><input className="table-input" type="number" value={form.since || ''} onChange={(e) => setForm((p) => ({ ...p, since: +e.target.value }))} /></td>
                      <td><input className="table-input" value={form.tonight || ''} onChange={(e) => setForm((p) => ({ ...p, tonight: e.target.value }))} /></td>
                      <td>
                        <div className="row" style={{ gap: 6 }}>
                          <button className="btn wine sm" onClick={save}><Icon name="check" size={13} stroke={2.5} /></button>
                          <button className="btn ghost sm" onClick={() => setEditing(null)}><Icon name="x" size={13} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td><b>{v.name}</b></td>
                      <td className="muted">{v.eng}</td>
                      <td className="muted">{v.area}</td>
                      <td className="mono">{v.cap}석</td>
                      <td className="mono">{v.since}</td>
                      <td>{v.tonight ? <span className="pill wine sm"><Icon name="music" size={10} /> {v.tonight}</span> : <span className="muted">—</span>}</td>
                      <td>
                        <button className="btn ghost sm" onClick={() => startEdit(v)}><Icon name="edit" size={13} /></button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
