import { useEffect, useRef } from 'react';
import Avatar from '../../components/Avatar';
import { findMusician } from '../../data/mockData';

export default function GraphView({ edges = [], center, navigate, size = 'full' }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const W = el.offsetWidth || 600;
    const H = size === 'full' ? 480 : 320;
    el.style.height = H + 'px';

    const nodes = {};
    edges.forEach(({ a, b }) => {
      nodes[a] = nodes[a] || { id: a, x: 0, y: 0, vx: 0, vy: 0 };
      nodes[b] = nodes[b] || { id: b, x: 0, y: 0, vx: 0, vy: 0 };
    });

    const ids = Object.keys(nodes);
    ids.forEach((id, i) => {
      const angle = (2 * Math.PI * i) / ids.length;
      const r = Math.min(W, H) * 0.32;
      nodes[id].x = W / 2 + r * Math.cos(angle);
      nodes[id].y = H / 2 + r * Math.sin(angle);
    });
    if (center && nodes[center]) {
      nodes[center].x = W / 2;
      nodes[center].y = H / 2;
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.style.position = 'absolute';
    svg.style.inset = '0';

    edges.forEach(({ a, b, weight = 1 }) => {
      const na = nodes[a], nb = nodes[b];
      if (!na || !nb) return;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', na.x);
      line.setAttribute('y1', na.y);
      line.setAttribute('x2', nb.x);
      line.setAttribute('y2', nb.y);
      line.setAttribute('stroke', 'var(--line)');
      line.setAttribute('stroke-width', Math.min(weight * 0.8, 4));
      svg.appendChild(line);
    });

    el.style.position = 'relative';
    el.innerHTML = '';
    el.appendChild(svg);

    ids.forEach((id) => {
      const n = nodes[id];
      const m = findMusician(id);
      const isCenter = id === center;

      const wrap = document.createElement('div');
      wrap.style.cssText = `position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;`;
      wrap.style.left = n.x + 'px';
      wrap.style.top = n.y + 'px';
      wrap.onclick = () => navigate && navigate('profile-public', { uuid: id });

      const av = document.createElement('div');
      av.className = `av ${isCenter ? 'lg' : 'md'} ${isCenter ? '' : ''}`;
      av.textContent = m?.name?.[0] || '?';
      av.style.cssText = isCenter
        ? 'width:44px;height:44px;font-size:18px;background:var(--wine);color:#fff;border:2px solid var(--wine);'
        : 'width:32px;height:32px;font-size:13px;';

      const lbl = document.createElement('span');
      lbl.textContent = m?.name || id;
      lbl.style.cssText = 'font-size:11px;white-space:nowrap;color:var(--ink);font-weight:' + (isCenter ? '700' : '500');

      wrap.appendChild(av);
      wrap.appendChild(lbl);
      el.appendChild(wrap);
    });
  }, [edges, center]);

  return <div ref={ref} className="graph-view" style={{ width: '100%', position: 'relative', background: 'var(--paper)', borderRadius: 8, overflow: 'hidden' }} />;
}