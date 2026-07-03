// 인맥지도 페이지
// uuid 없이 진입 → 뮤지션 선택 화면(MusicianPicker)
// uuid와 함께 진입 → 특정 뮤지션 중심의 인맥 관계도(MusicianMap)
import { useState, useEffect } from 'react'; // useState: 상태 / useEffect: API 호출
import GraphView from '../visitor/GraphView'; // 인맥 관계도 캔버스 컴포넌트
import Avatar from '../../components/Avatar'; // 이니셜 아바타
import Icon from '../../components/Icon';     // 아이콘
import { api } from '../../api/client';       // 백엔드 API 호출 함수 모음

// GraphResponse → GraphView 형식 변환 (ScreenPublicProfile과 동일한 로직)
// GraphResponse: { center: Musician, edges: [{ musician: Musician, weight: int }] }
function convertGraphResponse(data) {
  const centerId = String(data.center.id);
  const musicians = { [centerId]: data.center };
  const edges = data.edges.map((e) => {
    const otherId = String(e.musician.id);
    musicians[otherId] = e.musician;
    return { a: centerId, b: otherId, w: e.weight };
  });
  return { edges, musicians };
}

// 특정 뮤지션의 인맥 관계도를 보여주는 컴포넌트
function MusicianMap({ uuid, navigate }) {
  // musician: 중심 뮤지션 정보
  const [musician, setMusician] = useState(null);

  // graphEdges, graphMusicians: GraphView에 전달할 형식으로 변환된 그래프 데이터
  const [graphEdges, setGraphEdges] = useState([]);
  const [graphMusicians, setGraphMusicians] = useState({});
  const [loading, setLoading] = useState(true);

  // uuid가 바뀔 때마다 그래프 데이터 새로 로드
  useEffect(() => {
    if (!uuid) return;
    setLoading(true);

    api.getMusicianGraph(uuid)              // GET /api/musicians/{id}/graph
      .then((data) => {
        setMusician(data.center);           // 중심 뮤지션 정보 저장
        const { edges, musicians } = convertGraphResponse(data);
        setGraphEdges(edges);
        setGraphMusicians(musicians);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [uuid]);

  if (loading) return <div className="main"><div className="pad"><p className="muted">인맥지도를 불러오는 중...</p></div></div>;
  if (!musician) return <div className="main"><div className="pad"><p className="muted">뮤지션을 찾을 수 없습니다.</p></div></div>;

  // GraphView edges에서 협연 뮤지션 목록 추출 (중심 제외)
  const centerId = String(uuid);
  const partners = graphEdges.map((e) => {
    const otherId = e.a === centerId ? e.b : e.a;
    return { id: otherId, musician: graphMusicians[otherId], weight: e.w };
  });

  return (
    <div className="main">
      <div className="pad tight">
        <a className="back-link" onClick={() => navigate('playdb')}>
          <Icon name="arrow-left" size={15} /> 인맥지도 목록
        </a>

        {/* 중심 뮤지션 헤더 */}
        <div className="profile-hero" style={{ paddingTop: 20 }}>
          <Avatar name={musician.stageName} size="xl" />
          <div className="col" style={{ gap: 4 }}>
            <div className="row" style={{ gap: 8, alignItems: 'center' }}>
              <h1 className="h2 serif" style={{ margin: 0 }}>{musician.stageName}</h1>
            </div>
            <span className="role-label">{musician.position}</span>
            <span className="muted" style={{ fontSize: 13 }}>협연 뮤지션 {partners.length}명</span>
          </div>
          <button
            className="btn ghost sm"
            style={{ alignSelf: 'flex-start', marginLeft: 'auto' }}
            onClick={() => navigate('profile-public', { uuid })}
          >
            프로필 보기 <Icon name="arrow-right" size={14} />
          </button>
        </div>

        {/* 그래프 캔버스 */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 22 }}>
          <GraphView
            edges={graphEdges}
            musicians={graphMusicians}
            center={centerId}
            navigate={(_, p) => p?.uuid && navigate('playdb', { uuid: p.uuid })}
            size="full"
          />
        </div>

        {/* 협연 뮤지션 목록 */}
        <h3 className="section-label">협연 뮤지션 ({partners.length}명)</h3>
        <div className="card flush">
          {partners.map(({ id, musician: m, weight }) => (
            <div key={id} className="collab-list-row">
              <Avatar name={m?.stageName} size="md" />
              <div className="col grow" style={{ gap: 2 }}>
                <b style={{ fontSize: 14 }}>{m?.stageName}</b>
                <span className="muted" style={{ fontSize: 12 }}>
                  {m?.position} · {weight}회 함께 공연
                </span>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn ghost sm" onClick={() => navigate('playdb', { uuid: Number(id) })}>
                  인맥지도 <Icon name="graph" size={13} />
                </button>
                <button className="btn ghost sm" onClick={() => navigate('profile-public', { uuid: Number(id) })}>
                  <Icon name="arrow-right" size={14} />
                </button>
              </div>
            </div>
          ))}
          {partners.length === 0 && (
            <div className="empty-state sm">
              <p className="muted">등록된 협연 기록이 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 인맥지도를 볼 뮤지션을 선택하는 컴포넌트
function MusicianPicker({ navigate }) {
  const [musicians, setMusicians] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMusicians()                         // GET /api/musicians
      .then(setMusicians)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // stageName 또는 position으로 검색 (클라이언트 필터링)
  const list = musicians.filter((m) =>
    !query || m.stageName?.includes(query) || m.position?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="main">
      <div className="pad tight">
        <h1 className="h2 serif" style={{ marginBottom: 6 }}>인맥지도</h1>
        <p className="muted" style={{ marginBottom: 18 }}>
          공연 데이터를 기반으로 뮤지션 간의 협연 관계를 시각화합니다. 뮤지션을 선택하세요.
        </p>

        <div className="field" style={{ marginBottom: 16 }}>
          <div className="prefix">
            <span><Icon name="search" size={14} /></span>
            <input
              type="text"
              placeholder="뮤지션 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p className="muted">불러오는 중...</p>
        ) : (
          <div className="card flush">
            {list.map((m) => (
              // m.id: 백엔드 숫자형 PK — playdb 이동 시 uuid 파라미터로 전달
              <div key={m.id} className="collab-list-row" onClick={() => navigate('playdb', { uuid: m.id })}>
                <Avatar name={m.stageName} size="md" />
                <div className="col grow" style={{ gap: 2 }}>
                  <b style={{ fontSize: 14 }}>{m.stageName}</b>
                  <span className="muted" style={{ fontSize: 12 }}>{m.position}</span>
                </div>
                <Icon name="graph" size={16} color="var(--mute)" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// uuid가 있으면 특정 뮤지션의 인맥지도, 없으면 선택 화면
export default function ScreenPlayDB({ uuid, navigate }) {
  if (uuid) return <MusicianMap uuid={uuid} navigate={navigate} />;
  return <MusicianPicker navigate={navigate} />;
}
