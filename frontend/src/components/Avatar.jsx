import Icon from './Icon';

export default function Avatar({ name = '', size = 'md', tier, ink = false }) {
  const initial = name ? name[0] : '?';
  const cls = `av ${size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : size === 'xl' ? 'xl' : ''} ${ink ? 'ink' : ''}`;
  return (
    <span className={cls}>
      {initial}
      {tier === 'pro' ? <span className="badge"><Icon name="check" size={10} stroke={3} /></span> : null}
    </span>
  );
}