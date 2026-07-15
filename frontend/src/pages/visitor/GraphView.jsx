// 뮤지션 인맥 관계도를 SVG + DOM으로 그리는 컴포넌트
// edges: [{ a: '1', b: '2', w: 3 }] 형식의 연결 배열 (a, b는 뮤지션 id의 문자열 버전)
// musicians: { '1': { id, stageName, position, ... } } 형식의 id→뮤지션 맵
// center: 중심 뮤지션의 id 문자열
// size: 'full'(480px) 또는 'medium'(320px)
import { useEffect, useRef } from 'react'; // useRef: DOM 요소에 직접 접근하기 위해 사용

export default function GraphView({ edges = [], musicians = {}, center, navigate, size = 'full' }) {
  // ref: 그래프를 그릴 컨테이너 DOM 요소에 대한 참조
  const ref = useRef(null);

  // edges 또는 center가 바뀔 때마다 그래프를 다시 그림
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const W = el.offsetWidth || 600;
    const H = size === 'full' ? 480 : 320;
    el.style.height = H + 'px';

    // 노드 초기화: edges에 등장하는 모든 id에 대해 위치(x, y) 할당
    const nodes = {};
    edges.forEach(({ a, b }) => {
      nodes[a] = nodes[a] || { id: a, x: 0, y: 0 };
      nodes[b] = nodes[b] || { id: b, x: 0, y: 0 };
    });

    // 원형으로 노드 배치: 모든 노드를 일정 각도 간격으로 원 위에 배치
    const ids = Object.keys(nodes);
    ids.forEach((id, i) => {
      const angle = (2 * Math.PI * i) / ids.length;
      const r = Math.min(W, H) * 0.32; // 원의 반지름
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

    edges.forEach(({ a, b, w = 1 }) => {
      const na = nodes[a], nb = nodes[b];
      if (!na || !nb) return;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', na.x);
      line.setAttribute('y1', na.y);
      line.setAttribute('x2', nb.x);
      line.setAttribute('y2', nb.y);
      line.setAttribute('stroke', 'var(--line)');
      // 협연 횟수(w)가 많을수록 선이 굵어짐 (최대 4px)
      line.setAttribute('stroke-width', Math.min(w * 0.8, 4));
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

      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;';
      wrap.style.left = n.x + 'px';
      wrap.style.top = n.y + 'px';
      // 클릭 시 해당 뮤지션의 프로필 페이지로 이동 (id를 uuid 파라미터로 전달)
      wrap.onclick = () => navigate && navigate('profile-public', { uuid: Number(id) });

      // 아바타 원형 요소: 중심 노드는 크게, 나머지는 작게
      const av = document.createElement('div');
      av.style.cssText = isCenter
        ? 'width:44px;height:44px;font-size:18px;background:var(--wine);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid var(--wine);overflow:hidden;'
        : 'width:32px;height:32px;font-size:13px;background:var(--paper-2,#f5f3f0);border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid var(--line);overflow:hidden;';

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
      lbl.style.cssText = 'font-size:11px;white-space:nowrap;color:var(--ink);font-weight:' + (isCenter ? '700' : '500');

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
