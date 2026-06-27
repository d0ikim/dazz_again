import Icon from '../../components/Icon';

export default function VideoBlock({ video }) {
  if (!video) return null;
  return (
    <div className="video-block">
      <div className="video-thumb">
        <Icon name="play" size={28} color="#fff" />
      </div>
      <div className="col" style={{ gap: 3 }}>
        <b style={{ fontSize: 14 }}>{video.title}</b>
        <span className="muted" style={{ fontSize: 12 }}>{video.meta}</span>
      </div>
    </div>
  );
}