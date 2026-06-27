export default function Toast({ msg, kind = 'wine' }) {
  if (!msg) return null;
  return <div className={`toast ${kind}`}>{msg}</div>;
}