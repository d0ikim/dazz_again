import Icon from './Icon';

export default function Avatar({ name = '', size = 'md', tier, ink = false, profileImageUrl = null }) {
  const initial = name ? name[0] : '?';
  const cls = `av ${size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : size === 'xl' ? 'xl' : ''} ${ink ? 'ink' : ''}`;

  // 프로필 이미지가 있으면 img 태그로 표시, 없으면 이니셜 아바타 표시
  if (profileImageUrl) {
    return (
      <img src={profileImageUrl} alt={name} className={cls} style={{ objectFit: 'cover', display: 'block' }} />
    );
  }

  return (
    <span className={cls}>
      {initial}
      {tier === 'pro' ? <span className="badge"><Icon name="check" size={10} stroke={3} /></span> : null}
    </span>
  );
}