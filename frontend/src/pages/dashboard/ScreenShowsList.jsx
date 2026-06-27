import { useState } from 'react';
import Icon from '../../components/Icon';
import ShowRow from '../visitor/ShowRow';
import AddShowModal from './AddShowModal';
import { DATA } from '../../data/mockData';

export default function ScreenShowsList({ navigate, onToast }) {
  const [shows, setShows] = useState(DATA.shows);
  const [addOpen, setAddOpen] = useState(false);

  const addShow = (form) => {
    const newShow = { id: 's' + Date.now(), ...form, lineup: [DATA.me.uuid, ...form.lineup] };
    setShows((p) => [newShow, ...p]);
    onToast && onToast('공연 이력이 추가됐습니다');
  };

  return (
    <div className="main dashboard-main">
      <div className="pad tight">
        <a className="back-link" onClick={() => navigate('dashboard')}><Icon name="arrow-left" size={15} /> 대시보드</a>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 20px' }}>
          <h1 className="h2 serif" style={{ margin: 0 }}>공연 이력 ({shows.length})</h1>
          <button className="btn primary sm" onClick={() => setAddOpen(true)}><Icon name="plus" size={14} /> 추가</button>
        </div>

        <div className="card flush">
          {shows.map((s) => <ShowRow key={s.id} show={s} meUuid={DATA.me.uuid} navigate={navigate} />)}
        </div>

        {shows.length === 0 && (
          <div className="empty-state">
            <Icon name="calendar" size={28} color="var(--mute)" />
            <p className="muted">등록된 공연 이력이 없습니다</p>
            <button className="btn primary sm" onClick={() => setAddOpen(true)}><Icon name="plus" size={14} /> 첫 공연 추가</button>
          </div>
        )}
      </div>
      {addOpen && <AddShowModal onClose={() => setAddOpen(false)} onAdd={addShow} />}
    </div>
  );
}
