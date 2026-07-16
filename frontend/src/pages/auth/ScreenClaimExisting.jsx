// 기존 뮤지션 프로필 본인 인증 신청 화면
// DB에 이미 있는 본인 프로필을 찾아 claim 신청 (kind = claim)
import { useState, useEffect } from 'react'; // useEffect: 뮤지션 목록 로드
import Icon from '../../components/Icon';    // 아이콘
import Avatar from '../../components/Avatar'; // 아바타
import Spinner from '../../components/Spinner'; // 로딩 스피너
import { api } from '../../api/client';      // 백엔드 API 호출 함수 모음

// onSubmitRequest: App.jsx의 handleVerifyRequest — 신청 성공 시 auth.pending=true + 'pending' 화면으로 이동
export default function ScreenClaimExisting({ navigate, onSubmitRequest }) {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState(null); // 선택된 뮤지션의 숫자 id

  // musicians: 백엔드에서 받아온 전체 뮤지션 목록
  const [musicians, setMusicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getMusicians()             // GET /api/musicians
      .then(setMusicians)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // stageName 또는 position으로 클라이언트 필터링
  const list = musicians.filter((m) =>
    !query ||
    m.stageName?.includes(query) ||
    m.position?.toLowerCase().includes(query.toLowerCase())
  );

  // 신청 버튼 클릭 — 백엔드에 claim 신청 POST, 이후 App.jsx의 onSubmitRequest로 상태 전환
  const submit = () => {
    if (!picked) return;
    setSubmitting(true);

    // POST /api/verify/musician — { musicianId: Long } 전송
    api.submitVerifyRequest({ musicianId: picked })
      .then(() => onSubmitRequest())  // 성공 시 auth.pending=true + 'pending'으로 이동
      .catch(() => {
        alert('신청에 실패했습니다. 이미 신청하셨거나 해당 프로필이 이미 본인 인증된 상태일 수 있습니다.');
        setSubmitting(false);
      });
  };

  return (
    <div className="main" style={{ background: 'var(--paper)' }}>
      <div className="pad tight">
        <a className="back-link" onClick={() => navigate('become-musician')}><Icon name="arrow-left" size={15} /> 뒤로</a>
        <h1 className="h2 serif" style={{ margin: '14px 0 6px' }}>본인 프로필 찾기</h1>
        <p className="muted" style={{ marginBottom: 20 }}>등록된 뮤지션 중 본인을 선택하세요. 동명이인 방지를 위해 악기를 함께 확인해주세요.</p>

        <div className="field" style={{ marginBottom: 16 }}>
          <div className="prefix">
            <span><Icon name="search" size={14} /></span>
            <input type="text" placeholder="본인 활동명 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        <div className="card flush" style={{ marginBottom: 22 }}>
          {loading ? (
            <div className="empty-state sm"><Spinner label="불러오는 중..." /></div>
          ) : list.map((m) => (
            // picked: 선택된 뮤지션의 숫자형 DB id
            <div key={m.id} className={`claim-row ${picked === m.id ? 'on' : ''}`} onClick={() => setPicked(m.id)}>
              <Avatar name={m.stageName} size="lg" />
              <div className="col grow" style={{ gap: 2 }}>
                {/* stageName: 활동명 (백엔드 필드명) */}
                <b style={{ fontSize: 15 }}>{m.stageName}</b>
                {/* position: 악기 (백엔드 필드명) */}
                <span className="mono" style={{ fontSize: 11, color: 'var(--mute)' }}>
                  {m.position} · ID {m.id}
                </span>
              </div>
              <span className={`radio ${picked === m.id ? 'on' : ''}`}>
                {picked === m.id ? <Icon name="check" size={13} stroke={3} /> : null}
              </span>
            </div>
          ))}
        </div>

        <div className="banner" style={{ marginBottom: 20 }}>
          <Icon name="shield" size={16} color="var(--wine)" />
          <span className="grow" style={{ fontSize: 13 }}>본인이 아닌 프로필을 신청하면 거절됩니다. 승인 심사 시 활동 증빙을 확인합니다.</span>
        </div>

        <div className="row" style={{ justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn ghost" onClick={() => navigate('become-musician')}>취소</button>
          <button className="btn primary" disabled={!picked || submitting} onClick={submit}>
            <Icon name="shield" size={16} /> {submitting ? '신청 중...' : '이 프로필로 본인 인증 신청'}
          </button>
        </div>
      </div>
    </div>
  );
}
