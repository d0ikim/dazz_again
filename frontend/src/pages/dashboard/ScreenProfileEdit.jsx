import { useState } from 'react';
import Icon from '../../components/Icon';
import PresetPicker from './PresetPicker';

export default function ScreenProfileEdit({ me, navigate, onUpdate, onToast }) {
  const [form, setForm] = useState({
    name: me.name || '',
    nameEn: me.nameEn || '',
    role: me.role || '',
    bio: me.bio || '',
    school: me.school || '',
    instagram: me.handles?.instagram || '',
    youtube: me.handles?.youtube || '',
    website: me.website || '',
    resumePreset: me.resumePreset || 'editorial',
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = () => {
    onUpdate && onUpdate(form);
    onToast && onToast('프로필이 저장됐습니다');
    navigate('dashboard');
  };

  return (
    <div className="main dashboard-main">
      <div className="pad tight">
        <a className="back-link" onClick={() => navigate('dashboard')}><Icon name="arrow-left" size={15} /> 대시보드</a>
        <h1 className="h2 serif" style={{ margin: '14px 0 20px' }}>프로필 편집</h1>

        <div className="form-section">
          <h3 className="section-label">기본 정보</h3>
          <div className="form-grid">
            <div className="field">
              <label className="label">활동명 (한국어)</label>
              <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="field">
              <label className="label">영문 이름</label>
              <input type="text" value={form.nameEn} onChange={(e) => set('nameEn', e.target.value)} />
            </div>
            <div className="field">
              <label className="label">악기 / 역할</label>
              <input type="text" value={form.role} onChange={(e) => set('role', e.target.value)} placeholder="Piano · Trio Leader" />
            </div>
            <div className="field">
              <label className="label">학력</label>
              <input type="text" value={form.school} onChange={(e) => set('school', e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label className="label">소개글</label>
            <textarea rows={4} value={form.bio} onChange={(e) => set('bio', e.target.value)} placeholder="활동 방향과 음악적 정체성을 소개해주세요." />
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-label">링크</h3>
          <div className="form-grid">
            <div className="field">
              <label className="label">Instagram</label>
              <div className="prefix"><span>@</span><input type="text" value={form.instagram} onChange={(e) => set('instagram', e.target.value)} /></div>
            </div>
            <div className="field">
              <label className="label">YouTube</label>
              <div className="prefix"><span>@</span><input type="text" value={form.youtube} onChange={(e) => set('youtube', e.target.value)} /></div>
            </div>
            <div className="field">
              <label className="label">웹사이트</label>
              <div className="prefix"><span><Icon name="globe" size={13} /></span><input type="text" value={form.website} onChange={(e) => set('website', e.target.value)} /></div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-label">이력서 프리셋</h3>
          <PresetPicker current={form.resumePreset} onPick={(p) => set('resumePreset', p)} />
        </div>

        <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <button className="btn ghost" onClick={() => navigate('dashboard')}>취소</button>
          <button className="btn primary" onClick={save}><Icon name="check" size={16} stroke={2.5} /> 저장</button>
        </div>
      </div>
    </div>
  );
}
