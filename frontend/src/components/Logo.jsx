export default function Logo({ size = 22, tagline = false, onClick }) {
  return (
    <a className="logo" style={{ fontSize: size }} onClick={onClick}>
      DAZZ<span className="dot" />
      {tagline ? <span className="sub">Digging jAZZ</span> : null}
    </a>
  );
}