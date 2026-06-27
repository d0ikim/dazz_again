export default function EduAwards({ education = [], awards = [] }) {
  return (
    <div className="edu-awards">
      {education.length > 0 && (
        <section>
          <h4 className="sub-section-label">학력</h4>
          <div className="timeline">
            {education.map((e, i) => (
              <div key={i} className="tl-row">
                <span className="tl-y mono">{e.y}</span>
                <span className="tl-t">{e.t}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      {awards.length > 0 && (
        <section style={{ marginTop: 16 }}>
          <h4 className="sub-section-label">수상 / 선정</h4>
          <div className="timeline">
            {awards.map((a, i) => (
              <div key={i} className="tl-row">
                <span className="tl-y mono">{a.y}</span>
                <span className="tl-t">{a.t}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}