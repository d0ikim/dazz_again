import Icon from './Icon';

export default function Tier({ tier = 'pro', short = false }) {
  if (tier === 'pro') return <span className="tier pro"><Icon name="check" size={11} stroke={3} />{short ? 'Pro' : 'Verified Pro'}</span>;
  if (tier === 'user') return <span className="tier user"><Icon name="check" size={11} stroke={3} />Verified</span>;
  return <span className="tier unverified">Unverified</span>;
}