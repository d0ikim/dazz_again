// 뮤지션 공개 이력서 화면 — editorial / modern 두 가지 템플릿 전환 가능
import { useState } from 'react';         // useState: 템플릿 선택 상태
import ResumeEditorial from './ResumeEditorial'; // 에디토리얼 템플릿
import ResumeModern from './ResumeModern';       // 모던 템플릿
import PresetBar from './PresetBar';             // 상단 템플릿 전환 바

// me: App.jsx에서 전달받은 로그인 유저 + 뮤지션 정보 (실제 API 데이터)
// me.stageName, me.position, me.bio, me.snsUrl 등
export default function ScreenResumePublic({ navigate, me }) {
  const [preset, setPreset] = useState('editorial');

  const copy = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
  };

  return (
    <div className="resume-public">
      <PresetBar preset={preset} onSwitch={setPreset} onCopy={copy} onShare={copy} />
      {preset === 'editorial' ? (
        <ResumeEditorial me={me} navigate={navigate} />
      ) : (
        <ResumeModern me={me} navigate={navigate} />
      )}
    </div>
  );
}
