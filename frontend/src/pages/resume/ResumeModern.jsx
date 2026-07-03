// 모던 스타일 이력서 템플릿 (사이드바 레이아웃)
// 실제 백엔드 데이터를 표시하고, 미구현 항목은 coming-soon으로 대체
import Avatar from '../../components/Avatar'; // 아바타
import Icon from '../../components/Icon';     // 아이콘
import EduAwards from './EduAwards';           // 학력·수상 (mock 유지)
import CareerList from './CareerList';         // 경력 (mock 유지)

// me: App.jsx에서 전달받은 유저 + 뮤지션 정보 (실제 API 데이터)
export default function ResumeModern({ me, navigate }) {
  // 표시 이름: 뮤지션 활동명 우선, 없으면 닉네임
  const displayName = me?.stageName || me?.nickname || '—';

  return (
    <div className="resume modern">
      <div className="rm-sidebar">
        <Avatar name={displayName} size="xl" />
        <h2 className="serif" style={{ fontSize: 20, fontWeight: 700, marginTop: 12, textAlign: 'center' }}>{displayName}</h2>
        {/* position: 악기 (백엔드 필드명) */}
        {me?.position && <span className="role-label">{me.position}</span>}

        {/* 통계 — 공연/앨범 수는 미구현으로 준비 중 */}
        <div className="rm-stats">
          <div className="stat sm"><span className="sv">—</span><span className="sk">공연</span></div>
          <div className="stat sm"><span className="sv">—</span><span className="sk">앨범</span></div>
        </div>

        {/* snsUrl: 단일 SNS 링크 (백엔드 필드명) */}
        {me?.snsUrl && (
          <div className="col" style={{ gap: 8, marginTop: 12, width: '100%' }}>
            <a className="link-chip full" href={me.snsUrl} target="_blank" rel="noopener noreferrer">
              <Icon name="external" size={13} /> SNS
            </a>
          </div>
        )}

        {/* 학력·수상: 백엔드 미구현, mock 표시 유지 */}
        <div style={{ marginTop: 20, width: '100%' }}>
          <EduAwards education={me?.education} awards={me?.awards} />
        </div>
      </div>

      <div className="rm-main">
        {/* bio: 소개글 (백엔드 필드명) */}
        {me?.bio ? <p className="re-bio" style={{ marginTop: 0 }}>{me.bio}</p> : null}

        {/* 예정 공연 — 준비 중 */}
        <section style={{ marginBottom: 22 }}>
          <h3 className="section-label">예정 공연</h3>
          <div className="coming-soon-box">
            <Icon name="calendar" size={18} color="var(--mute)" />
            <span className="coming-soon-label">예정 공연 정보 준비 중</span>
          </div>
        </section>

        {/* 공연 이력 — 준비 중 (공개 프로필에서 확인 가능) */}
        <section style={{ marginBottom: 22 }}>
          <h3 className="section-label">공연 이력</h3>
          <div className="coming-soon-box">
            <Icon name="ticket" size={18} color="var(--mute)" />
            <span className="coming-soon-label">공연 이력 준비 중</span>
            <span className="coming-soon-sub">
              <a onClick={() => navigate('profile-public', { uuid: me?.musicianId })} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                공개 프로필
              </a>
              에서 지금 확인할 수 있습니다.
            </span>
          </div>
        </section>

        {/* 앨범 참여 — 준비 중 */}
        <section style={{ marginBottom: 22 }}>
          <h3 className="section-label">앨범 참여</h3>
          <div className="coming-soon-box">
            <Icon name="disc" size={18} color="var(--mute)" />
            <span className="coming-soon-label">앨범 정보 준비 중</span>
          </div>
        </section>

        {/* 경력: 백엔드 미구현, mock 표시 유지 */}
        <CareerList career={me?.career} />

        {/* 협연 인맥 — 준비 중 */}
        <div style={{ marginTop: 22 }}>
          <h3 className="section-label">협연 인맥</h3>
          <div className="coming-soon-box">
            <Icon name="users" size={18} color="var(--mute)" />
            <span className="coming-soon-label">이력서 내 협연 인맥 준비 중</span>
            <span className="coming-soon-sub">
              <a onClick={() => navigate('graph-mine')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>인맥지도</a>
              에서 지금 확인할 수 있습니다.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
