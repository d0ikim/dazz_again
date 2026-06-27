import { useState } from 'react';
import ResumeEditorial from './ResumeEditorial';
import ResumeModern from './ResumeModern';
import PresetBar from './PresetBar';
import { DATA } from '../../data/mockData';

export default function ScreenResumePublic({ navigate, uuid }) {
  const me = DATA.me;
  const [preset, setPreset] = useState(me.resumePreset || 'editorial');

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
