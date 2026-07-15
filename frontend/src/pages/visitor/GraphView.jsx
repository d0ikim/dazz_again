// 뮤지션 인맥 관계도를 SVG + DOM으로 그리는 컴포넌트
// edges: [{ a: '1', b: '2', w: 3 }] 형식의 연결 배열 (a, b는 뮤지션 id의 문자열 버전)
// musicians: { '1': { id, stageName, position, ... } } 형식의 id→뮤지션 맵
// center: 중심 뮤지션의 id 문자열
// size: 'full'(480px) 또는 'medium'(320px)
import { useEffect, useRef } from 'react'; // useRef: DOM 요소에 직접 접근하기 위해 사용
import { getWeightRatio } from '../../utils/weightColor'; // 협연 횟수를 절대 기준(5회 이상=최대)으로 정규화

export default function GraphView({ edges = [], musicians = {}, center, navigate, size = 'full' }) {
  // ref: 그래프를 그릴 컨테이너 DOM 요소에 대한 참조
  const ref = useRef(null);

  // edges 또는 center가 바뀔 때마다 그래프를 다시 그림
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const W = el.offsetWidth || 600;

    // 사이트가 커져서 협연자가 계속 늘어나도 원형 그래프가 무한정 커지지 않도록,
    // 협연 횟수(w) 기준 상위 20명만 원에 그림 (나머지는 하단 전체 목록에서 확인)
    const MAX_PARTNERS = 20;
    const visibleEdges = edges.length > MAX_PARTNERS
      ? [...edges].sort((e1, e2) => (e2.w || 1) - (e1.w || 1)).slice(0, MAX_PARTNERS)
      : edges;

    // 노드 초기화: visibleEdges에 등장하는 모든 id에 대해 위치(x, y) 할당
    const nodes = {};
    visibleEdges.forEach(({ a, b }) => {
      nodes[a] = nodes[a] || { id: a, x: 0, y: 0 };
      nodes[b] = nodes[b] || { id: b, x: 0, y: 0 };
    });
    const ids = Object.keys(nodes);

    // 캔버스 높이: 협연자가 많을수록 원을 키워야 노드끼리 안 겹침 (20명이면 720px)
    // 인원이 적을 때는 기본값(480/320)을 그대로 사용
    const baseH = size === 'full' ? 480 : 320;
    const H = Math.max(baseH, ids.length * 36);
    el.style.height = H + 'px';

    // 원형으로 노드 배치: 모든 노드를 일정 각도 간격으로 원 위에 배치
    const r = Math.min(W, H) * 0.34; // 원의 반지름
    ids.forEach((id, i) => {
      const angle = (2 * Math.PI * i) / ids.length;
      nodes[id].x = W / 2 + r * Math.cos(angle);
      nodes[id].y = H / 2 + r * Math.sin(angle);
    });

    // 중심 노드는 정중앙에 배치
    if (center && nodes[center]) {
      nodes[center].x = W / 2;
      nodes[center].y = H / 2;
    }

    // SVG 엘리먼트 생성 — 엣지(선) 그리기
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.style.position = 'absolute';
    svg.style.inset = '0';

    visibleEdges.forEach(({ a, b, w = 1 }) => {
      const na = nodes[a], nb = nodes[b];
      if (!na || !nb) return;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', na.x);
      line.setAttribute('y1', na.y);
      line.setAttribute('x2', nb.x);
      line.setAttribute('y2', nb.y);

      // 협연 횟수(w)를 절대 기준(5회 이상=최대)으로 정규화 (0~1) — "이 뮤지션 기준 최댓값"으로
      // 정규화하면 모든 협연자와 다 1회씩만 함께한 경우 1회가 최댓값이 되어 전부 굵은 선으로
      // 보이는 오류가 생기므로, 실제 협연 횟수 자체의 절대적인 많고 적음을 기준으로 삼음
      // → 여러 색을 섞지 않고 와인색 하나의 명도/채도만 바꿔 "값의 크기"를 표현 (sequential 스케일)
      const ratio = getWeightRatio(w);
      const lightness = 0.86 - ratio * 0.5;   // 0.86(연함) → 0.36(진함)
      const chroma = 0.03 + ratio * 0.14;      // 0.03(무채색에 가까움) → 0.17(선명한 와인색)
      line.setAttribute('stroke', `oklch(${lightness.toFixed(2)} ${chroma.toFixed(2)} 28)`);
      // 두께도 같은 비율로: 최소 1px(협연 1회 수준) ~ 최대 8px(이 뮤지션의 최다 협연자)
      line.setAttribute('stroke-width', (1 + ratio * 7).toFixed(1));
      svg.appendChild(line);
    });

    // 컨테이너 초기화 후 SVG 추가
    el.style.position = 'relative';
    el.innerHTML = '';
    el.appendChild(svg);

    // 각 노드에 아바타 + 이름 DOM 요소 추가
    ids.forEach((id) => {
      const n = nodes[id];
      // musicians 맵에서 뮤지션 정보 조회 (findMusician 대신 props로 받은 맵 사용)
      const m = musicians[id];
      const isCenter = id === center;

      // 이름표 방향: 원의 좌우 끝쪽(9시/3시 방향) 노드는 이웃 노드와 세로로 붙어 있어서
      // 라벨을 아바타 "아래"에 그대로 두면 옆 노드 아바타와 겹침 → 좌우 끝쪽은 라벨을 옆으로 배치
      const dx = n.x - W / 2;
      const dy = n.y - H / 2;
      const isSide = Math.abs(dx) > Math.abs(dy) && !isCenter;
      const flexDirection = isSide ? (dx < 0 ? 'row-reverse' : 'row') : 'column';

      const wrap = document.createElement('div');
      wrap.style.cssText = `position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:${flexDirection};align-items:center;gap:6px;cursor:pointer;`;
      wrap.style.left = n.x + 'px';
      wrap.style.top = n.y + 'px';
      // 클릭 시 해당 뮤지션의 프로필 페이지로 이동 (id를 uuid 파라미터로 전달)
      wrap.onclick = () => navigate && navigate('profile-public', { uuid: Number(id) });

      // 아바타 원형 요소: 중심 노드는 훨씬 크게, 나머지도 기존보다 큼지막하게
      const av = document.createElement('div');
      av.style.cssText = isCenter
        ? 'width:64px;height:64px;font-size:26px;background:var(--wine);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid var(--wine);overflow:hidden;'
        : 'width:46px;height:46px;font-size:17px;background:var(--paper-2,#f5f3f0);border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid var(--line);overflow:hidden;';

      // 프로필 이미지가 있으면 배경 이미지로 표시, 없으면 stageName의 첫 글자를 텍스트로 표시
      if (m?.profileImageUrl) {
        av.style.backgroundImage = `url(${m.profileImageUrl})`;
        av.style.backgroundSize = 'cover';
        av.style.backgroundPosition = 'center';
      } else {
        av.textContent = m?.stageName?.[0] || '?';
      }

      // 이름 레이블: stageName 사용 (백엔드 필드명)
      const lbl = document.createElement('span');
      lbl.textContent = m?.stageName || id;
      lbl.style.cssText = 'font-size:' + (isCenter ? '14px' : '13px') + ';white-space:nowrap;color:var(--ink);font-weight:' + (isCenter ? '700' : '500');

      wrap.appendChild(av);
      wrap.appendChild(lbl);
      el.appendChild(wrap);
    });
  }, [edges, center, musicians]); // musicians 맵이 바뀌면 그래프 재렌더링

  return (
    <div
      ref={ref}
      className="graph-view"
      style={{ width: '100%', position: 'relative', background: 'var(--paper)', borderRadius: 8, overflow: 'hidden' }}
    />
  );
}
