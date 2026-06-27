import Icon from '../../components/Icon';

export default function AlbumRow({ album }) {
  return (
    <div className="album-row">
      <div className="album-art">
        <Icon name="music" size={18} color="var(--mute)" />
      </div>
      <div className="col grow" style={{ gap: 3 }}>
        <b style={{ fontSize: 14 }}>{album.title}</b>
        <span className="muted" style={{ fontSize: 12 }}>{album.role} · {album.label}</span>
      </div>
      <span className="mono" style={{ fontSize: 13, color: 'var(--mute)', flexShrink: 0 }}>{album.year}</span>
    </div>
  );
}