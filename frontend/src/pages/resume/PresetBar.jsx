import Icon from '../../components/Icon';

export default function PresetBar({ preset, onSwitch, onShare, onCopy }) {
  return (
    <div className="preset-bar">
      <div className="row" style={{ gap: 6 }}>
        <span className="label">프리셋</span>
        <button className={`chip sm ${preset === 'editorial' ? 'on' : ''}`} onClick={() => onSwitch('editorial')}>
          <Icon name="spark" size={12} /> Editorial
        </button>
        <button className={`chip sm ${preset === 'modern' ? 'on' : ''}`} onClick={() => onSwitch('modern')}>
          <Icon name="layout" size={12} /> Modern
        </button>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <button className="btn ghost sm" onClick={onCopy}><Icon name="copy" size={13} /> 링크 복사</button>
        <button className="btn ghost sm" onClick={onShare}><Icon name="share" size={13} /> 공유</button>
      </div>
    </div>
  );
}