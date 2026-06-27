import Icon from '../../components/Icon';

const PRESETS = [
  { id: 'editorial', label: 'Editorial', desc: '매거진 스타일, 와이드 레이아웃', icon: 'spark' },
  { id: 'modern', label: 'Modern', desc: '사이드바 + 본문, 깔끔한 구성', icon: 'layout' },
];

export default function PresetPicker({ current, onPick }) {
  return (
    <div className="preset-picker">
      {PRESETS.map((p) => (
        <div key={p.id} className={`pp-card ${current === p.id ? 'active' : ''}`} onClick={() => onPick(p.id)}>
          <div className="row" style={{ gap: 10, alignItems: 'center' }}>
            <Icon name={p.icon} size={18} color={current === p.id ? 'var(--wine)' : 'var(--ink)'} />
            <div className="col" style={{ gap: 2 }}>
              <b style={{ fontSize: 14 }}>{p.label}</b>
              <span className="muted" style={{ fontSize: 12 }}>{p.desc}</span>
            </div>
            {current === p.id ? <Icon name="check" size={16} stroke={2.5} color="var(--wine)" style={{ marginLeft: 'auto' }} /> : null}
          </div>
        </div>
      ))}
    </div>
  );
}