import Avatar from '../../components/Avatar';
import Tier from '../../components/Tier';
import Icon from '../../components/Icon';
import ShowRow from './ShowRow';
import AlbumRow from './AlbumRow';
import GraphView from './GraphView';
import { DATA, findMusician, buildEdges } from '../../data/mockData';

function LinkChip({ icon, label, href }) {
  return (
    <a className="link-chip" href={href || '#'} target="_blank" rel="noopener noreferrer">
      <Icon name={icon} size={13} /> {label}
    </a>
  );
}

export default function ScreenPublicProfile({ uuid, navigate, auth }) {
  const isMe = uuid === DATA.me.uuid;
  const m = isMe ? DATA.me : findMusician(uuid);
  const shows = DATA.shows.filter((s) => s.lineup?.includes(uuid));
  const albums = isMe ? DATA.albums : [];
  const edges = buildEdges(uuid, DATA.shows);

  return (
    <div className="main">
      <div className="pad">
        <a className="back-link" onClick={() => navigate('directory')}><Icon name="arrow-left" size={15} /> 뮤지션 목록</a>

        <div className="profile-hero">
          <Avatar name={m.name} tier={m.tier} size="xl" />
          <div className="col" style={{ gap: 4 }}>
            <div className="row" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <h1 className="h2 serif" style={{ margin: 0 }}>{m.name}</h1>
              {m.nameEn ? <span className="muted">{m.nameEn}</span> : null}
              <Tier tier={m.tier} />
            </div>
            <span className="role-label">{m.role || m.instrument}</span>
            {m.school ? <span className="muted" style={{ fontSize: 13 }}>{m.school}</span> : null}
            {m.bio ? <p className="bio">{m.bio}</p> : null}
            <div className="row" style={{ gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              {m.handles?.instagram ? <LinkChip icon="instagram" label={`@${m.handles.instagram}`} href={`https://instagram.com/${m.handles.instagram}`} /> : null}
              {m.handles?.youtube ? <LinkChip icon="youtube" label={m.handles.youtube} href={`https://youtube.com/${m.handles.youtube}`} /> : null}
              {m.website ? <LinkChip icon="globe" label={m.website} href={`https://${m.website}`} /> : null}
            </div>
          </div>
          {(auth?.role === 'musician' || isMe) ? (
            <button className="btn ghost sm" style={{ alignSelf: 'flex-start', marginLeft: 'auto' }} onClick={() => navigate('dashboard')}>
              <Icon name="edit" size={14} /> 편집
            </button>
          ) : null}
        </div>

        <div className="stat-row">
          <div className="stat"><span className="sv">{m.shows || shows.length}</span><span className="sk">총 공연</span></div>
          <div className="stat"><span className="sv">{m.collabs || edges.length}</span><span className="sk">협연 뮤지션</span></div>
          {albums.length > 0 && <div className="stat"><span className="sv">{albums.length}</span><span className="sk">앨범 참여</span></div>}
        </div>

        <div className="two-col">
          <div className="col" style={{ gap: 22 }}>
            {shows.length > 0 && (
              <section>
                <h3 className="section-label">공연 이력</h3>
                <div className="card flush">
                  {shows.map((s) => <ShowRow key={s.id} show={s} meUuid={uuid} navigate={navigate} />)}
                </div>
              </section>
            )}
            {albums.length > 0 && (
              <section>
                <h3 className="section-label">앨범 참여</h3>
                <div className="card flush">
                  {albums.map((a) => <AlbumRow key={a.id} album={a} />)}
                </div>
              </section>
            )}
          </div>

          {edges.length > 0 && (
            <section>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 className="section-label" style={{ margin: 0 }}>협연 관계도</h3>
                <button className="btn ghost sm" onClick={() => navigate('playdb', { uuid })}>
                  전체 보기 <Icon name="arrow-right" size={13} />
                </button>
              </div>
              <GraphView edges={edges} center={uuid} navigate={(_, p) => p?.uuid && navigate('playdb', { uuid: p.uuid })} size="medium" />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}