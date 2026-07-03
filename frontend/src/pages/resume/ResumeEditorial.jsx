// 에디토리얼 스타일 이력서 템플릿
// 실제 백엔드 데이터(me.stageName, me.position, me.bio, me.snsUrl)를 표시하고
// 공연·앨범·협연 등 미구현 항목은 coming-soon으로 대체
import Avatar from '../../components/Avatar'; // 아바타
import Icon from '../../components/Icon';     // 아이콘
import EduAwards from './EduAwards';           // 학력·수상 (mock 유지)
import CareerList from './CareerList';         // 경력 (mock 유지)
import VideoBlock from './VideoBlock';         // 동영상 (mock 유지)

// me: App.jsx에서 전달받은 유저 + 뮤지션 정보 (실제 API 데이터)
export default function ResumeEditorial({ me, navigate }) {
  // 표시 이름: 뮤지션 활동명 우선, 없으면 닉네임
  const displayName = me?.stageName || me?.nickname || '—';

  return (
    <div className="resume editorial">
      <div className="re-hero">
        <div className="re-hero-left">
          <Avatar name={displayName} size="xl" />
          <div className="col" style={{ gap: 6 }}>
            <div className="row" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* stageName: 활동명 (백엔드 필드명) */}
              <h1 className="h1 serif">{displayName}</h1>
            </div>
            {/* position: 악기 (백엔드 필드명) */}
            {me?.position && <span className="role-label">{me.position}</span>}
          </div>
        </div>
        {/* 통계 — 공연/앨범/협연 수는 백엔드 미구현으로 준비 중 */}
        <div className="re-hero-stats">
          <div className="stat"><span className="sv">—</span><span className="sk">공연</span></div>
          <div className="stat"><span className="sv">—</span><span className="sk">앨범</span></div>
          <div className="stat"><span className="sv">—</span><span className="sk">협연</span></div>
        </div>
      </div>

      {/* bio: 소개글 (백엔드 필드명) */}
      {me?.bio ? <p className="re-bio">{me.bio}</p> : null}

      {/* snsUrl: 단일 SNS 링크 (백엔드 필드명) */}
      {me?.snsUrl && (
        <div className="re-link-row">
          <a className="link-chip" href={me.snsUrl} target="_blank" rel="noopener noreferrer">
            <Icon name="external" size={13} /> SNS
          </a>
        </div>
      )}

      <VideoBlock video={null} /> {/* 영상 링크: 백엔드 미구현 */}

      <div className="re-two-col">
        <div className="col" style={{ gap: 24 }}>
          {/* 예정 공연 — 백엔드 연동은 ScreenDashboard/ScreenConcerts에서 처리 */}
          <section>
            <h3 className="section-label">예정 공연</h3>
            <div className="coming-soon-box">
              <Icon name="calendar" size={18} color="var(--mute)" />
              <span className="coming-soon-label">예정 공연 정보 준비 중</span>
              <span className="coming-soon-sub">이력서 내 예정 공연 표시 기능은 곧 제공됩니다</span>
            </div>
          </section>

          {/* 공연 이력 — ScreenPublicProfile에서 실제 API 연동 완료 */}
          <section>
            <h3 className="section-label">공연 이력</h3>
            <div className="coming-soon-box">
              <Icon name="ticket" size={18} color="var(--mute)" />
              <span className="coming-soon-label">공연 이력 준비 중</span>
              <span className="coming-soon-sub">
                이력서 내 공연 이력은 곧 표시됩니다.{' '}
                <a onClick={() => navigate('profile-public', { uuid: me?.musicianId })} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                  공개 프로필
                </a>
                에서 지금 확인할 수 있습니다.
              </span>
            </div>
          </section>

          {/* 앨범 참여 — 백엔드 미구현 */}
          <section>
            <h3 className="section-label">앨범 참여</h3>
            <div className="coming-soon-box">
              <Icon name="disc" size={18} color="var(--mute)" />
              <span className="coming-soon-label">앨범 정보 준비 중</span>
              <span className="coming-soon-sub">앨범 참여 이력 기능은 곧 제공될 예정입니다</span>
            </div>
          </section>
        </div>

        <div className="col" style={{ gap: 24 }}>
          {/* 학력·수상: 백엔드 미구현, mock 표시 유지 */}
          <EduAwards education={me?.education} awards={me?.awards} />
          {/* 경력: 백엔드 미구현, mock 표시 유지 */}
          <CareerList career={me?.career} />

          {/* 협연 인맥 — coming-soon */}
          <section>
            <h3 className="section-label">협연 인맥</h3>
            <div className="coming-soon-box">
              <Icon name="users" size={18} color="var(--mute)" />
              <span className="coming-soon-label">이력서 내 협연 인맥 준비 중</span>
              <span className="coming-soon-sub">
                <a onClick={() => navigate('graph-mine')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>인맥지도</a>
                에서 지금 확인할 수 있습니다.
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
