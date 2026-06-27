import Avatar from '../../components/Avatar';
import Tier from '../../components/Tier';
import Icon from '../../components/Icon';
import ShowRow from '../visitor/ShowRow';
import AlbumRow from '../visitor/AlbumRow';
import UpcomingRow from './UpcomingRow';
import EduAwards from './EduAwards';
import CareerList from './CareerList';
import TeamsList from './TeamsList';
import Collaborators from './Collaborators';
import { DATA } from '../../data/mockData';

export default function ResumeModern({ me, navigate }) {
  return (
    <div className="resume modern">
      <div className="rm-sidebar">
        <Avatar name={me.name} tier={me.tier} size="xl" />
        <h2 className="serif" style={{ fontSize: 20, fontWeight: 700, marginTop: 12, textAlign: 'center' }}>{me.name}</h2>
        <Tier tier={me.tier} />
        <span className="role-label">{me.role}</span>
        {me.school ? <span className="muted" style={{ fontSize: 12, textAlign: 'center' }}>{me.school}</span> : null}
        <div className="rm-stats">
          <div className="stat sm"><span className="sv">{DATA.shows.length}</span><span className="sk">공연</span></div>
          <div className="stat sm"><span className="sv">{DATA.albums.length}</span><span className="sk">앨범</span></div>
        </div>
        <div className="col" style={{ gap: 8, marginTop: 12, width: '100%' }}>
          {me.handles?.instagram && <a className="link-chip full" href="#"><Icon name="instagram" size={13} /> @{me.handles.instagram}</a>}
          {me.handles?.youtube && <a className="link-chip full" href="#"><Icon name="youtube" size={13} /> {me.handles.youtube}</a>}
          {me.website && <a className="link-chip full" href="#"><Icon name="globe" size={13} /> {me.website}</a>}
        </div>
        <div style={{ marginTop: 20, width: '100%' }}>
          <EduAwards education={me.education} awards={me.awards} />
        </div>
      </div>

      <div className="rm-main">
        {me.bio ? <p className="re-bio" style={{ marginTop: 0 }}>{me.bio}</p> : null}

        <section style={{ marginBottom: 22 }}>
          <h3 className="section-label">예정 공연</h3>
          <div className="card flush">
            {DATA.upcoming.map((u) => <UpcomingRow key={u.id} show={u} navigate={navigate} />)}
          </div>
        </section>

        <section style={{ marginBottom: 22 }}>
          <h3 className="section-label">공연 이력</h3>
          <div className="card flush">
            {DATA.shows.map((s) => <ShowRow key={s.id} show={s} meUuid={me.uuid} navigate={navigate} />)}
          </div>
        </section>

        <section style={{ marginBottom: 22 }}>
          <h3 className="section-label">앨범 참여</h3>
          <div className="card flush">
            {DATA.albums.map((a) => <AlbumRow key={a.id} album={a} />)}
          </div>
        </section>

        <CareerList career={me.career} />
        <div style={{ marginTop: 22 }}>
          <TeamsList teams={me.teams} navigate={navigate} />
        </div>
        <div style={{ marginTop: 22 }}>
          <Collaborators uuid={me.uuid} navigate={navigate} />
        </div>
      </div>
    </div>
  );
}