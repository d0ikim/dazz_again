import Icon from '../../components/Icon';
import { DATA } from '../../data/mockData';

export default function ScreenAdminHome({ navigate }) {
  const pending = DATA.verifyQueue.filter((r) => r.status === 'PENDING');

  const stats = [
    { label: '등록 뮤지션', val: DATA.musicians.length, icon: 'users', route: 'directory' },
    { label: '인증 대기', val: pending.length, icon: 'shield', route: 'admin-verify', alert: pending.length > 0 },
    { label: '공연장', val: DATA.venues.length, icon: 'building', route: 'admin-venues' },
    { label: '등록 공연', val: DATA.concerts.length, icon: 'ticket', route: 'admin-concerts' },
  ];

  return (
    <div className="main dashboard-main">
      <div className="pad">
        <h1 className="h2 serif" style={{ marginBottom: 6 }}>관리자 대시보드</h1>
        <p className="muted" style={{ marginBottom: 20 }}>DAZZ 플랫폼 현황을 한눈에 확인하세요.</p>

        {pending.length > 0 && (
          <div className="banner alert" style={{ marginBottom: 20 }}>
            <Icon name="shield" size={16} color="var(--wine)" />
            <span className="grow" style={{ fontSize: 13 }}>
              <b>{pending.length}건</b>의 뮤지션 인증 요청이 대기 중입니다.
            </span>
            <button className="btn primary sm" onClick={() => navigate('admin-verify')}>검토하기</button>
          </div>
        )}

        <div className="admin-stat-grid">
          {stats.map((s) => (
            <div key={s.label} className={`admin-stat-card ${s.alert ? 'alert' : ''}`} onClick={() => navigate(s.route)}>
              <div className="row" style={{ gap: 10, alignItems: 'center' }}>
                <span className="asc-ico"><Icon name={s.icon} size={18} color={s.alert ? 'var(--wine)' : 'var(--ink)'} /></span>
                <span className="asc-label">{s.label}</span>
              </div>
              <span className={`asc-val ${s.alert ? 'alert' : ''}`}>{s.val}</span>
            </div>
          ))}
        </div>

        <section style={{ marginTop: 28 }}>
          <h3 className="section-label">최근 인증 요청</h3>
          <div className="card flush">
            {DATA.verifyQueue.slice(0, 3).map((r) => (
              <div key={r.id} className="verify-row" onClick={() => navigate('admin-verify')}>
                <div className="col grow" style={{ gap: 2 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <b style={{ fontSize: 14 }}>{r.name}</b>
                    <span className={`pill ${r.status === 'PENDING' ? 'wine' : r.status === 'APPROVED' ? 'green' : 'light'} sm`}>{r.status}</span>
                    <span className="pill light sm">{r.kind}</span>
                  </div>
                  <span className="muted" style={{ fontSize: 12 }}>{r.instrument} · {r.requestedAt}</span>
                </div>
                <Icon name="arrow-right" size={14} color="var(--mute)" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
