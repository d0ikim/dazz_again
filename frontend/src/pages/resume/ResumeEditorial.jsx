import Avatar from '../../components/Avatar';
import Tier from '../../components/Tier';
import Icon from '../../components/Icon';
import VideoBlock from './VideoBlock';
import ShowRow from '../visitor/ShowRow';
import AlbumRow from '../visitor/AlbumRow';
import UpcomingRow from './UpcomingRow';
import EduAwards from './EduAwards';
import CareerList from './CareerList';
import TeamsList from './TeamsList';
import Collaborators from './Collaborators';
import { DATA } from '../../data/mockData';

export default function ResumeEditorial({ me, navigate }) {
  return (
    <div className="resume editorial">
      <div className="re-hero">
        <div className="re-hero-left">
          <Avatar name={me.name} tier={me.tier} size="xl" />
          <div className="col" style={{ gap: 6 }}>
            <div className="row" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <h1 className="h1 serif">{me.name}</h1>
              <Tier tier={me.tier} />
            </div>
            <span className="role-label">{me.role}</span>
            {me.school ? <span className="muted" style={{ fontSize: 13 }}>{me.school}</span> : null}
          </div>
        </div>
        <div className="re-hero-stats">
          <div className="stat"><span className="sv">{DATA.shows.length}</span><span className="sk">공연</span></div>
          <div className="stat"><span className="sv">{DATA.albums.length}</span><span className="sk">앨범</span></div>
          <div className="stat"><span className="sv">{new Set(DATA.shows.flatMap((s) => s.lineup)).size - 1}</span><span className="sk">협연</span></div>
        </div>
      </div>

      {me.bio ? <p className="re-bio">{me.bio}</p> : null}

      <div className="re-link-row">
        {me.handles?.instagram && <a className="link-chip" href="#"><Icon name="instagram" size={13} /> @{me.handles.instagram}</a>}
        {me.handles?.youtube && <a className="link-chip" href="#"><Icon name="youtube" size={13} /> {me.handles.youtube}</a>}
        {me.website && <a className="link-chip" href="#"><Icon name="globe" size={13} /> {me.website}</a>}
      </div>

      <VideoBlock video={me.video} />

      <div className="re-two-col">
        <div className="col" style={{ gap: 24 }}>
          <section>
            <h3 className="section-label">예정 공연</h3>
            <div className="card flush">
              {DATA.upcoming.map((u) => <UpcomingRow key={u.id} show={u} navigate={navigate} />)}
            </div>
          </section>
          <section>
            <h3 className="section-label">공연 이력</h3>
            <div className="card flush">
              {DATA.shows.map((s) => <ShowRow key={s.id} show={s} meUuid={me.uuid} navigate={navigate} />)}
            </div>
          </section>
          <section>
            <h3 className="section-label">앨범 참여</h3>
            <div className="card flush">
              {DATA.albums.map((a) => <AlbumRow key={a.id} album={a} />)}
            </div>
          </section>
        </div>
        <div className="col" style={{ gap: 24 }}>
          <EduAwards education={me.education} awards={me.awards} />
          <CareerList career={me.career} />
          <TeamsList teams={me.teams} navigate={navigate} />
          <Collaborators uuid={me.uuid} navigate={navigate} />
        </div>
      </div>
    </div>
  );
}