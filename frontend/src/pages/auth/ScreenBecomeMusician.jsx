import Icon from '../../components/Icon';
import { DATA } from '../../data/mockData';

export default function ScreenBecomeMusician({ navigate, auth }) {
  const myRequest = DATA.verifyQueue.find((r) => r.userId === auth.userId);
  if (auth.pending && myRequest) { navigate('pending'); return null; }

  return (
    <div className="main" style={{ background: 'var(--paper)' }}>
      <div className="pad tight">
        <div className="eyebrow" style={{ marginBottom: 8 }}>MUSICIAN ONBOARDING</div>
        <h1 className="h2 serif" style={{ marginBottom: 8 }}>뮤지션으로 등록하기</h1>
        <p className="muted" style={{ marginBottom: 8 }}>
          <b style={{ color: 'var(--ink)' }}>{auth.name || '게스트'}</b>님 (GENERAL) — 두 가지 방법 중 하나로 신청하세요. 신청은 관리자 승인 후 <b>MUSICIAN</b> 권한으로 전환됩니다.
        </p>
        <div className="banner soft" style={{ marginBottom: 28 }}>
          <Icon name="shield" size={16} color="var(--wine)" />
          <span className="grow" style={{ fontSize: 13 }}>승인 전까지는 프로필 편집·이력서 발행이 잠겨 있어요. 신청 내역은 <span className="mono">verification_request</span>로 저장됩니다.</span>
        </div>

        <div className="become-grid">
          <div className="become-card" onClick={() => navigate('claim-existing')}>
            <span className="bc-tag wine">추천</span>
            <span className="bc-ico"><Icon name="search" size={22} color="var(--wine)" /></span>
            <h3 className="serif" style={{ fontSize: 19, fontWeight: 700, marginTop: 14 }}>이미 DAZZ에 있는 뮤지션이에요</h3>
            <p className="muted" style={{ fontSize: 13, margin: '8px 0 14px' }}>초기 데이터에 등록된 본인 프로필을 찾아 <b>본인 인증</b>을 신청합니다. 기존 공연·관계도가 그대로 연결돼요.</p>
            <div className="bc-foot"><span className="mono" style={{ fontSize: 11 }}>kind = claim</span> <Icon name="arrow-right" size={15} color="var(--wine)" /></div>
          </div>

          <div className="become-card" onClick={() => navigate('onboarding')}>
            <span className="bc-ico"><Icon name="plus" size={22} /></span>
            <h3 className="serif" style={{ fontSize: 19, fontWeight: 700, marginTop: 14 }}>처음 등록해요 (새 프로필)</h3>
            <p className="muted" style={{ fontSize: 13, margin: '8px 0 14px' }}>DB에 아직 없는 뮤지션입니다. 본인 정보를 직접 입력해 새 프로필을 만들고 인증을 신청합니다.</p>
            <div className="bc-foot"><span className="mono" style={{ fontSize: 11 }}>kind = new</span> <Icon name="arrow-right" size={15} color="var(--mute)" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}