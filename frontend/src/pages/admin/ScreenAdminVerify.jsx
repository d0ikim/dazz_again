import { useState } from 'react';
import Icon from '../../components/Icon';
import Avatar from '../../components/Avatar';
import { DATA, findMusician } from '../../data/mockData';

export default function ScreenAdminVerify({ navigate, onToast }) {
  const [queue, setQueue] = useState(DATA.verifyQueue);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('PENDING');

  const list = queue.filter((r) => r.status === tab);
  const sel = selected ? queue.find((r) => r.id === selected) : null;

  const approve = (id) => {
    setQueue((q) => q.map((r) => r.id === id ? { ...r, status: 'APPROVED' } : r));
    onToast && onToast('승인 완료 — MUSICIAN 권한 부여됨');
    setSelected(null);
  };
  const reject = (id) => {
    setQueue((q) => q.map((r) => r.id === id ? { ...r, status: 'REJECTED' } : r));
    onToast && onToast('반려 처리됐습니다');
    setSelected(null);
  };

  return (
    <div className="main dashboard-main">
      <div className="pad">
        <h1 className="h2 serif" style={{ marginBottom: 16 }}>뮤지션 인증 관리</h1>

        <div className="tab-row" style={{ marginBottom: 18 }}>
          {['PENDING', 'APPROVED', 'REJECTED'].map((t) => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => { setTab(t); setSelected(null); }}>
              {t} ({queue.filter((r) => r.status === t).length})
            </button>
          ))}
        </div>

        <div className="verify-layout">
          <div className="verify-list">
            {list.map((r) => {
              const linked = r.musicianUuid ? findMusician(r.musicianUuid) : null;
              return (
                <div key={r.id} className={`verify-item ${selected === r.id ? 'active' : ''}`} onClick={() => setSelected(r.id)}>
                  <Avatar name={r.name} />
                  <div className="col grow" style={{ gap: 2 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <b style={{ fontSize: 14 }}>{r.name}</b>
                      <span className="pill light sm">{r.kind}</span>
                    </div>
                    <span className="muted" style={{ fontSize: 12 }}>{r.instrument} · {r.requestedAt}</span>
                    {linked ? <span className="muted" style={{ fontSize: 11 }}>→ {linked.name}</span> : null}
                  </div>
                  <Icon name="arrow-right" size={14} color="var(--mute)" />
                </div>
              );
            })}
            {list.length === 0 && (
              <div className="empty-state sm"><p className="muted">{tab} 항목 없음</p></div>
            )}
          </div>

          {sel ? (
            <div className="verify-detail card">
              <div className="row" style={{ gap: 12, marginBottom: 16 }}>
                <Avatar name={sel.name} size="lg" />
                <div className="col" style={{ gap: 3 }}>
                  <b style={{ fontSize: 17 }}>{sel.name}</b>
                  <div className="row" style={{ gap: 6 }}>
                    <span className={`pill ${sel.status === 'PENDING' ? 'wine' : sel.status === 'APPROVED' ? 'green' : 'light'} sm`}>{sel.status}</span>
                    <span className="pill light sm">{sel.kind}</span>
                  </div>
                  <span className="muted" style={{ fontSize: 12 }}>{sel.instrument}</span>
                </div>
              </div>

              <div className="vd-table">
                <div className="vd-row"><span>요청 ID</span><b className="mono">{sel.id}</b></div>
                <div className="vd-row"><span>신청일</span><b className="mono">{sel.requestedAt}</b></div>
                <div className="vd-row"><span>user_id</span><b className="mono">{sel.userId}</b></div>
                {sel.school ? <div className="vd-row"><span>학력</span><b>{sel.school}</b></div> : null}
                {sel.links?.instagram ? <div className="vd-row"><span>Instagram</span><b>@{sel.links.instagram}</b></div> : null}
                {sel.links?.youtube ? <div className="vd-row"><span>YouTube</span><b>{sel.links.youtube}</b></div> : null}
                {sel.musicianUuid ? <div className="vd-row"><span>연결 UUID</span><b className="mono">{sel.musicianUuid}</b></div> : null}
              </div>

              {sel.evidence && (
                <div className="field" style={{ marginTop: 14 }}>
                  <label className="label">활동 증빙</label>
                  <p style={{ fontSize: 13, color: 'var(--ink)', margin: 0 }}>{sel.evidence}</p>
                </div>
              )}
              {sel.note && (
                <div className="field" style={{ marginTop: 10 }}>
                  <label className="label">신청자 메모</label>
                  <p style={{ fontSize: 13, color: 'var(--ink)', margin: 0 }}>{sel.note}</p>
                </div>
              )}

              {sel.status === 'PENDING' && (
                <div className="row" style={{ gap: 10, marginTop: 20 }}>
                  <button className="btn wine grow" onClick={() => approve(sel.id)}><Icon name="check" size={16} stroke={2.5} /> 승인</button>
                  <button className="btn ghost grow" onClick={() => reject(sel.id)}><Icon name="x" size={16} /> 반려</button>
                </div>
              )}
            </div>
          ) : (
            <div className="verify-detail empty">
              <Icon name="inbox" size={28} color="var(--mute)" />
              <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>항목을 선택하면 상세 정보가 표시됩니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
