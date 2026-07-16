// 로딩 중임을 보여주는 회전 스피너 — 텍스트만 뜨던 "OO 불러오는 중..." 상태를 시각적으로 대체
// label을 안 주면 스피너만, 주면 스피너 아래에 안내 문구도 같이 표시
export default function Spinner({ label }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      {label && <p className="muted" style={{ marginTop: 10 }}>{label}</p>}
    </div>
  );
}