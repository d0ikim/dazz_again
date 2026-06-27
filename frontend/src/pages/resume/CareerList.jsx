import Icon from '../../components/Icon';

export default function CareerList({ career = [] }) {
  if (!career.length) return null;
  return (
    <section>
      <h4 className="sub-section-label">주요 활동</h4>
      <ul className="career-list">
        {career.map((c, i) => (
          <li key={i}><Icon name="check" size={12} stroke={2.5} color="var(--wine)" /> {c}</li>
        ))}
      </ul>
    </section>
  );
}