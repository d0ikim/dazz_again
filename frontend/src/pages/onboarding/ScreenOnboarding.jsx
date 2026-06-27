import { useState } from 'react';
import Icon from '../../components/Icon';

const INSTRUMENTS = ['Piano', 'Bass', 'Drums', 'Guitar', 'Sax', 'Vocal', 'Trumpet', 'Trombone', 'Violin', 'Vibraphone', 'Percussion', 'Other'];

const STEPS = [
  { id: 'instrument', label: '악기' },
  { id: 'name', label: '이름' },
  { id: 'school', label: '학교' },
  { id: 'links', label: '링크' },
  { id: 'evidence', label: '증빙' },
];

export default function ScreenOnboarding({ navigate, onSubmitRequest }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ instrument: '', name: '', nameEn: '', school: '', instagram: '', youtube: '', website: '', evidence: '', note: '' });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));
  const submit = () => onSubmitRequest({ kind: 'new', ...form });

  return (
    <div className="main" style={{ background: 'var(--paper)' }}>
      <div className="pad tight">
        <a className="back-link" onClick={() => navigate('become-musician')}><Icon name="arrow-left" size={15} /> 뒤로</a>
        <h1 className="h2 serif" style={{ margin: '14px 0 4px' }}>새 뮤지션 프로필 등록</h1>
        <p className="muted" style={{ marginBottom: 20 }}>정보를 입력하고 관리자 승인을 받으면 <b>MUSICIAN</b> 권한이 생깁니다.</p>

        <div className="stepper">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <span className="sn">{i < step ? <Icon name="check" size={12} stroke={3} /> : i + 1}</span>
              <span className="sl">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '28px 24px', marginTop: 20, minHeight: 220 }}>
          {step === 0 && (
            <div className="col" style={{ gap: 12 }}>
              <label className="label">주 악기 *</label>
              <div className="chip-group">
                {INSTRUMENTS.map((ins) => (
                  <button key={ins} className={`chip ${form.instrument === ins ? 'on' : ''}`} onClick={() => set('instrument', ins)}>{ins}</button>
                ))}
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="col" style={{ gap: 14 }}>
              <div className="field">
                <label className="label">활동명 (한국어) *</label>
                <input type="text" placeholder="홍길동" value={form.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div className="field">
                <label className="label">영문 이름 (선택)</label>
                <input type="text" placeholder="Hong Gil-dong" value={form.nameEn} onChange={(e) => set('nameEn', e.target.value)} />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="field">
              <label className="label">최종 학력 (선택)</label>
              <input type="text" placeholder="○○대학교 실용음악과 재즈피아노 전공" value={form.school} onChange={(e) => set('school', e.target.value)} />
              <span className="hint">학과·전공까지 적어주시면 인증에 도움이 됩니다.</span>
            </div>
          )}
          {step === 3 && (
            <div className="col" style={{ gap: 14 }}>
              <div className="field">
                <label className="label">Instagram</label>
                <div className="prefix"><span>@</span><input type="text" placeholder="handle" value={form.instagram} onChange={(e) => set('instagram', e.target.value)} /></div>
              </div>
              <div className="field">
                <label className="label">YouTube</label>
                <div className="prefix"><span>@</span><input type="text" placeholder="channel" value={form.youtube} onChange={(e) => set('youtube', e.target.value)} /></div>
              </div>
              <div className="field">
                <label className="label">개인 웹사이트</label>
                <div className="prefix"><span><Icon name="globe" size={13} /></span><input type="text" placeholder="example.com" value={form.website} onChange={(e) => set('website', e.target.value)} /></div>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="col" style={{ gap: 14 }}>
              <div className="field">
                <label className="label">활동 증빙 링크 / 설명 *</label>
                <textarea placeholder="공연 영상 URL, 페스티벌 출연 이력, 발매 앨범 링크 등 본인임을 증명할 수 있는 자료" value={form.evidence} onChange={(e) => set('evidence', e.target.value)} rows={4} />
              </div>
              <div className="field">
                <label className="label">추가 메모 (선택)</label>
                <textarea placeholder="관리자에게 전하고 싶은 내용" value={form.note} onChange={(e) => set('note', e.target.value)} rows={2} />
              </div>
            </div>
          )}
        </div>

        <div className="row" style={{ justifyContent: 'space-between', marginTop: 18 }}>
          <button className="btn ghost" onClick={prev} disabled={step === 0}><Icon name="arrow-left" size={15} /> 이전</button>
          {step < STEPS.length - 1 ? (
            <button className="btn primary" onClick={next} disabled={step === 0 && !form.instrument}>다음 <Icon name="arrow-right" size={15} /></button>
          ) : (
            <button className="btn primary" onClick={submit} disabled={!form.evidence}>
              <Icon name="shield" size={16} /> 인증 신청하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}