import Icon from '../../components/Icon';
import Avatar from '../../components/Avatar';
import Tier from '../../components/Tier';
import ShowRow from '../visitor/ShowRow';
import AlbumRow from '../visitor/AlbumRow';
import UpcomingRow from '../resume/UpcomingRow';
import { DATA } from '../../data/mockData';

export default function ScreenDashboard({ navigate, me }) {
  return (
    <div className="main dashboard-main">
      <div className="pad">
        <div className="dash-hero">
          <Avatar name={me.name} tier={me.tier} size="xl" />
          <div className="col" style={{ gap: 6 }}>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <h1 className="h2 serif" style={{ margin: 0 }}>{me.name}</h1>
              <Tier tier={me.tier} />
            </div>
            <span className="role-label">{me.role}</span>
            {me.school ? <span className="muted" style={{ fontSize: 13 }}>{me.school}</span> : null}
          </div>
          <div className="dash-actions">
            <button className="btn primary" onClick={() => navigate('resume-public')}><Icon name="external" size={14} /> 이력서 보기</button>
            <button className="btn secondary" onClick={() => navigate('profile-edit')}><Icon name="edit" size={14} /> 프로필 편집</button>
          </div>
        </div>

        <div className="dash-stat-row">
          <div className="stat-card" onClick={() => navigate('shows-list')}>
            <span className="sc-val">{DATA.shows.length}</span>
            <span className="sc-key">총 공연</span>
          </div>
          <div className="stat-card" onClick={() => navigate('albums-list')}>
            <span className="sc-val">{DATA.albums.length}</span>
            <span className="sc-key">앨범 참여</span>
          </div>
          <div className="stat-card" onClick={() => navigate('graph-mine')}>
            <span className="sc-val">{DATA.upcoming.length}</span>
            <span className="sc-key">예정 공연</span>
          </div>
          <div className="stat-card" onClick={() => navigate('graph-mine')}>
            <span className="sc-val">{new Set(DATA.shows.flatMap((s) => s.lineup)).size - 1}</span>
            <span className="sc-key">협연 뮤지션</span>
          </div>
        </div>

        <div className="dash-two-col">
          <section>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 className="section-label" style={{ margin: 0 }}>예정 공연</h3>
              <button className="btn ghost sm" onClick={() => navigate('concerts')}>전체 보기 <Icon name="arrow-right" size={13} /></button>
            </div>
            <div className="card flush">
              {DATA.upcoming.map((u) => <UpcomingRow key={u.id} show={u} navigate={navigate} />)}
            </div>
          </section>

          <section>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 className="section-label" style={{ margin: 0 }}>최근 공연 이력</h3>
              <button className="btn ghost sm" onClick={() => navigate('shows-list')}>전체 보기 <Icon name="arrow-right" size={13} /></button>
            </div>
            <div className="card flush">
              {DATA.shows.slice(0, 3).map((s) => <ShowRow key={s.id} show={s} meUuid={me.uuid} navigate={navigate} />)}
            </div>
          </section>
        </div>

        <section style={{ marginTop: 22 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 className="section-label" style={{ margin: 0 }}>앨범 참여</h3>
          </div>
          <div className="card flush">
            {DATA.albums.map((a) => <AlbumRow key={a.id} album={a} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
