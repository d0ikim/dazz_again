// 이용 가이드 페이지 — DAZZ를 처음 접한 방문자에게 서비스 취지와 핵심 기능을 간단히 안내
import Icon from '../../components/Icon'; // 아이콘

// 핵심 기능 카드 데이터 — 아이콘, 제목, 한 줄 설명, 눌렀을 때 이동할 라우트
const FEATURES = [
  { icon: 'users', title: '뮤지션 디렉토리', desc: '활동 중인 재즈 뮤지션을 검색하고, 프로필과 공연 이력을 확인할 수 있어요.', route: 'directory' },
  { icon: 'building', title: '공연장 지도', desc: '서울 지역 재즈 공연장의 위치와 정보를 지도에서 한눈에 볼 수 있어요.', route: 'venues' },
  { icon: 'ticket', title: '공연 목록', desc: '월별 캘린더로 다가오는 공연 일정을 공연장별로 구분해서 확인할 수 있어요.', route: 'concerts' },
  { icon: 'graph', title: '인맥지도', desc: '뮤지션들이 함께 무대에 오른 기록을 바탕으로 협연 관계를 그래프로 보여줘요.', route: 'playdb' },
];

export default function ScreenGuide({ navigate }) {
  return (
    <div className="main">
      <div className="pad wide">

        {/* 소개 섹션 — 히어로와 같은 톤(eyebrow + serif 제목 + lead)을 재사용해 통일감을 줌 */}
        <div className="hero">
          <div className="stamp" />
          <div className="eyebrow" style={{ marginBottom: 10 }}>GUIDE</div>
          <h1 className="h1 serif hero-title" style={{ marginBottom: 12, maxWidth: 640 }}>
            DAZZ, 이렇게 둘러보세요
          </h1>
          <p className="lead" style={{ maxWidth: 560, marginBottom: 0 }}>
            흩어져 있던 한국 재즈신의 뮤지션·공연장·공연 정보를 한곳에 모았습니다.
            아래 네 가지 기능으로 재즈 뮤지션과 공연을 찾아보고, 뮤지션이라면 직접 프로필도 만들어보세요.
          </p>
        </div>

        {/* 핵심 기능 카드 그리드 */}
        <h2 className="h2 serif" style={{ margin: '28px 0 14px' }}>핵심 기능</h2>
        <div className="row" style={{ gap: 14, flexWrap: 'wrap', alignItems: 'stretch' }}>
          {FEATURES.map((f) => (
            <div
              key={f.route}
              className="card"
              style={{ flex: '1 1 240px', minWidth: 220, cursor: 'pointer' }}
              onClick={() => navigate(f.route)}
            >
              <div className="row" style={{ gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <Icon name={f.icon} size={20} color="var(--wine)" />
                <b style={{ fontSize: 15 }}>{f.title}</b>
              </div>
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* 마무리 CTA — 뮤지션 디렉토리로 바로 이동 */}
        <div className="row" style={{ marginTop: 26 }}>
          <button className="btn primary lg" onClick={() => navigate('directory')}>
            뮤지션 둘러보기 <Icon name="arrow-right" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}