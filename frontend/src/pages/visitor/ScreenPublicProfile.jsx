// 뮤지션 공개 프로필 페이지 — 특정 뮤지션의 정보, 공연 이력, 인맥 관계도를 보여주는 화면
import { useState, useEffect } from 'react'; // useState: 상태 관리 / useEffect: 마운트 시 API 호출
import Avatar from '../../components/Avatar'; // 이니셜 아바타 컴포넌트
import Icon from '../../components/Icon';     // 아이콘 컴포넌트
import ShowRow from './ShowRow';              // 공연 한 줄 컴포넌트
import { api } from '../../api/client';      // 백엔드 API 호출 함수 모음
import { getWeightBadgeStyle } from '../../utils/weightColor'; // 협연 횟수에 따른 배지 색 계산

// SNS 링크 칩 컴포넌트
function LinkChip({ icon, label, href }) {
  return (
    <a className="link-chip" href={href || '#'} target="_blank" rel="noopener noreferrer">
      <Icon name={icon} size={16} /> {label}
    </a>
  );
}

// GraphResponse를 GraphView가 사용하는 형식으로 변환하는 함수
// GraphResponse: { center: Musician, edges: [{ musician: Musician, weight: int }] }
// GraphView 형식: edges = [{ a: '1', b: '2', w: 3 }], musicians = { '1': Musician, '2': Musician }
function convertGraphResponse(data) {
  const centerId = String(data.center.id);
  const musicians = { [centerId]: data.center };
  const edges = data.edges.map((e) => {
    const otherId = String(e.musician.id);
    musicians[otherId] = e.musician; // 협연 뮤지션을 맵에 추가
    return { a: centerId, b: otherId, w: e.weight };
  });
  return { edges, musicians };
}

// uuid: App.jsx에서 navigate('profile-public', { uuid: musician.id }) 로 넘어온 뮤지션 ID (숫자)
export default function ScreenPublicProfile({ uuid, navigate, auth }) {
  // musician: 백엔드에서 받아온 뮤지션 프로필 단건
  const [musician, setMusician] = useState(null);

  // performances: 이 뮤지션이 출연한 공연 목록
  const [performances, setPerformances] = useState([]);

  // graphEdges, graphMusicians: 인맥 관계도용 변환된 데이터
  const [graphEdges, setGraphEdges] = useState([]);
  const [graphMusicians, setGraphMusicians] = useState({});

  const [loading, setLoading] = useState(true);

  // 협연 관계도 카드 그리드 — 한 줄에 4명씩 5줄(20명)까지 기본 표시, 그 이상은 "더보기"로 펼침
  const [showAllPartners, setShowAllPartners] = useState(false);
  const PARTNERS_PAGE_SIZE = 20;

  // uuid가 바뀔 때마다 (다른 뮤지션 프로필로 이동) API를 새로 호출
  useEffect(() => {
    if (!uuid) return;

    setLoading(true);
    setShowAllPartners(false); // 다른 뮤지션 프로필로 이동하면 더보기 상태 초기화

    // 세 API를 동시에 호출해 속도를 높임 (Promise.all: 모두 완료될 때까지 대기)
    Promise.all([
      api.getMusician(uuid),             // GET /api/musicians/{id}
      api.getMusicianPerformances(uuid), // GET /api/performances/musician/{id}
      api.getMusicianGraph(uuid),        // GET /api/musicians/{id}/graph
    ])
      .then(([m, perfs, graph]) => {
        setMusician(m);
        setPerformances(perfs);
        // GraphResponse를 GraphView 형식으로 변환
        const { edges, musicians } = convertGraphResponse(graph);
        setGraphEdges(edges);
        setGraphMusicians(musicians);
      })
      .catch(() => {}) // 실패 시 빈 상태 유지
      .finally(() => setLoading(false));
  }, [uuid]);

  if (loading) {
    return <div className="main"><div className="pad"><p className="muted">프로필을 불러오는 중...</p></div></div>;
  }

  if (!musician) {
    return <div className="main"><div className="pad"><p className="muted">뮤지션을 찾을 수 없습니다.</p></div></div>;
  }

  // 현재 로그인한 유저가 이 프로필의 소유자인지 확인
  // musician.userId: 이 뮤지션 프로필과 연결된 유저의 DB id
  // auth.userId: 현재 로그인한 유저의 DB id
  const isMe = auth?.userId && musician.userId === auth.userId;

  // graphEdges(a-b-weight 쌍)에서 "나(uuid) 기준 상대 뮤지션" 목록만 뽑아 협연 횟수 많은 순으로 정렬
  // 인원이 몇 명이든(예: 20명) 원형 그래프처럼 겹치거나 밖으로 삐져나가지 않고
  // 그리드로 줄바꿈되며 카드 개수만큼 세로로 늘어나도록 표시
  const centerId = String(uuid);
  const partners = graphEdges
    .map((e) => {
      const otherId = e.a === centerId ? e.b : e.a;
      return { id: otherId, musician: graphMusicians[otherId], weight: e.w };
    })
    .sort((a, b) => b.weight - a.weight);

  return (
    <div className="main">
      <div className="pad public-profile">
        <a className="back-link" onClick={() => navigate('directory')}>
          <Icon name="arrow-left" size={15} /> 뮤지션 목록
        </a>

        {/* 프로필 히어로 영역 */}
        <div className="profile-hero">
          {/* stageName의 첫 글자를 아바타에 표시, 프로필 이미지가 있으면 그 이미지 표시 */}
          <Avatar name={musician.stageName} size="xl" profileImageUrl={musician.profileImageUrl} />
          <div className="col" style={{ gap: 4 }}>
            <div className="row" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* stageName: 활동명 (백엔드 필드명) */}
              <h1 className="h2 serif" style={{ margin: 0 }}>{musician.stageName}</h1>
              {musician.realName && musician.realName !== musician.stageName && (
                <span className="muted">{musician.realName}</span>
              )}
            </div>
            {/* position: 악기 (백엔드 필드명, 예: PIANO, VOCAL) — 이름(세리프 폰트)보다 왼쪽으로
                치우쳐 보여서 margin-left로 보정 */}
            <span className="role-label" style={{ marginLeft: 6 }}>{musician.position}</span>
            {/* bio: 소개글 — 값이 있을 때만 표시, 위와 같은 이유로 보정 */}
            {musician.bio && <p className="bio" style={{ marginLeft: 6 }}>{musician.bio}</p>}
            {/* snsUrl: 단일 SNS URL (백엔드에 하나만 저장) */}
            {musician.snsUrl && (
              <div className="row" style={{ gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <LinkChip icon="external" label="SNS" href={musician.snsUrl} />
              </div>
            )}
          </div>

          {/* 내 프로필이거나 뮤지션 역할이면 편집 버튼 표시 */}
          {(auth?.role === 'musician' && isMe) && (
            <button
              className="btn ghost sm"
              style={{ alignSelf: 'flex-start', marginLeft: 'auto' }}
              onClick={() => navigate('dashboard')}
            >
              <Icon name="edit" size={14} /> 편집
            </button>
          )}
        </div>

        {/* 통계 — 공연 수는 실제 데이터, 나머지는 준비 중 */}
        <div className="stat-row">
          <div className="stat">
            <span className="sv">{performances.length}</span>
            <span className="sk">총 공연</span>
          </div>
          <div className="stat">
            <span className="sv">{graphEdges.length}</span>
            <span className="sk">협연 뮤지션</span>
          </div>
        </div>

        <div className="two-col">
          <div className="col" style={{ gap: 22 }}>
            {/* 공연 이력 — api.getMusicianPerformances() 결과 */}
            {performances.length > 0 && (
              <section>
                <h3 className="section-label">공연 이력</h3>
                <div className="card flush">
                  {performances.map((p) => (
                    <ShowRow key={p.id} show={p} navigate={navigate} />
                  ))}
                </div>
              </section>
            )}

            {/* 앨범 참여 — 백엔드 미구현 */}
            <section>
              <h3 className="section-label">앨범 참여</h3>
              <div className="coming-soon-box">
                <Icon name="disc" size={24} color="var(--mute)" />
                <span className="coming-soon-label">앨범 정보 준비 중</span>
                <span className="coming-soon-sub">앨범 참여 이력은 곧 제공될 예정입니다</span>
              </div>
            </section>
          </div>

          {/* 인맥 관계도 — api.getMusicianGraph() 결과 */}
          {graphEdges.length > 0 && (
            <section>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 className="section-label" style={{ margin: 0 }}>협연 관계도</h3>
                <button className="btn ghost sm" onClick={() => navigate('playdb', { uuid })}>
                  전체 보기 <Icon name="arrow-right" size={15} />
                </button>
              </div>
              <div className="partner-grid">
                {(showAllPartners ? partners : partners.slice(0, PARTNERS_PAGE_SIZE)).map(({ id, musician: m, weight }) => (
                  <div
                    key={id}
                    className="partner-card"
                    onClick={() => navigate('profile-public', { uuid: Number(id) })}
                  >
                    <Avatar name={m?.stageName} size="md" profileImageUrl={m?.profileImageUrl} />
                    <b className="cc-name">{m?.stageName}</b>
                    <span className="cc-count" style={getWeightBadgeStyle(weight)}>{weight}회</span>
                  </div>
                ))}
              </div>
              {/* 20명(4x5) 넘게 있으면 더보기 버튼으로 나머지를 펼침 */}
              {!showAllPartners && partners.length > PARTNERS_PAGE_SIZE && (
                <button
                  className="btn ghost sm full"
                  style={{ marginTop: 10 }}
                  onClick={() => setShowAllPartners(true)}
                >
                  더보기 ({partners.length - PARTNERS_PAGE_SIZE}명) <Icon name="arrow-right" size={13} />
                </button>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
