export const DATA = {
  me: {
    uuid: '7c4f-kim-jazz',
    name: '김재즈',
    nameEn: 'Kim Jazz',
    role: 'PIANO · TRIO LEADER',
    instrument: 'Piano',
    school: '서울예술대학교 실용음악과 19',
    tier: 'pro',
    bio: '서울을 기반으로 활동하는 재즈 피아니스트. Bill Evans의 인터플레이 개념을 한국 정서로 재해석한 트리오 작업을 이어오고 있습니다.',
    handles: { instagram: 'kim.jazz.trio', youtube: '@kimjazztrio' },
    website: 'kimjazz.kr',
    resumePreset: 'editorial',
    video: {
      title: 'Kim Jazz Trio — Live at Once in a Blue Moon',
      meta: '2025 · 본인 연주 메인 영상 · 7:42',
    },
    education: [
      { y: '2019-2024', t: '서울예술대학교 실용음악과 재즈피아노 전공 졸업' },
      { y: '2013', t: 'Berklee College of Music 여름 단기 과정 수료' },
    ],
    awards: [
      { y: '2019', t: '자라섬 국제재즈 콩쿠르 피아노 부문 대상' },
      { y: '2021', t: '한국대중음악상 최우수 재즈 음반 부문 후보' },
    ],
    career: [
      '서울재즈페스티벌 · 자라섬재즈페스티벌 등 주요 페스티벌 다수 출연',
      'EBS 스페이스 공감, KBS 재즈 라디오 세션 참여',
      '2018년부터 〈김재즈 트리오〉 리더로 정기 공연 진행',
    ],
    teams: [
      { name: '김재즈 트리오', role: 'Leader', members: ['92a1-park-session', '33d2-han-drum'] },
      { name: '한남 재즈 콜렉티브', role: 'Member', members: ['8b1e-lee-bebop', 'c402-yoon-trio'] },
    ],
  },
  musicians: [
    { uuid: '7c4f-kim-jazz', name: '김재즈', role: 'Piano', tier: 'pro', shows: 142, collabs: 38 },
    { uuid: '92a1-park-session', name: '박세션', role: 'Bass', tier: 'pro', shows: 188, collabs: 52 },
    { uuid: '33d2-han-drum', name: '한드럼', role: 'Drums', tier: 'user', shows: 96, collabs: 24 },
    { uuid: '8b1e-lee-bebop', name: '이비밥', role: 'Sax', tier: 'pro', shows: 124, collabs: 41 },
    { uuid: 'c402-yoon-trio', name: '윤트리오', role: 'Guitar', tier: 'pro', shows: 80, collabs: 28 },
    { uuid: 'f721-choi-sax', name: '최색소폰', role: 'Sax', tier: 'user', shows: 62, collabs: 18 },
    { uuid: '5d09-kang-vox', name: '강보컬', role: 'Vocal', tier: 'user', shows: 73, collabs: 22 },
    { uuid: '11ab-oh-gtr', name: '오기타', role: 'Guitar', tier: 'unverified', shows: 38, collabs: 14 },
    { uuid: '2f55-seo-bass', name: '서베이스', role: 'Bass', tier: 'unverified', shows: 41, collabs: 16 },
    { uuid: '7901-jung-perc', name: '정퍼커션', role: 'Percussion', tier: 'user', shows: 29, collabs: 12 },
    { uuid: 'b66e-moon-vox', name: '문보컬', role: 'Vocal', tier: 'user', shows: 33, collabs: 15 },
    { uuid: 'a880-im-pno', name: '임피아노', role: 'Piano', tier: 'unverified', shows: 22, collabs: 8 },
  ],
  shows: [
    { id: 's1', date: '2026-05-18', venue: '재즈클럽 D', city: '서울 · 이태원', role: 'Leader', lineup: ['7c4f-kim-jazz', '92a1-park-session', '33d2-han-drum'] },
    { id: 's2', date: '2026-04-22', venue: '천년동안도', city: '서울 · 홍대', role: 'Sideman', lineup: ['8b1e-lee-bebop', '7c4f-kim-jazz', '92a1-park-session', '33d2-han-drum'] },
    { id: 's3', date: '2026-03-04', venue: 'Once in a Blue Moon', city: '서울 · 청담', role: 'Leader', lineup: ['7c4f-kim-jazz', '92a1-park-session', '33d2-han-drum'] },
    { id: 's4', date: '2026-02-11', venue: '아마도라운지', city: '서울 · 마포', role: 'Sideman', lineup: ['c402-yoon-trio', '7c4f-kim-jazz', '2f55-seo-bass'] },
    { id: 's5', date: '2025-12-20', venue: '서울재즈페스티벌', city: '서울 · 잠실', role: 'Leader', lineup: ['7c4f-kim-jazz', '92a1-park-session', '33d2-han-drum', 'f721-choi-sax'] },
  ],
  albums: [
    { id: 'a1', year: 2024, title: 'Inner Voices', role: 'Leader · Piano', label: 'Audioguy' },
    { id: 'a2', year: 2022, title: '겨울 정원', role: 'Sideman · Piano', label: 'Mirror Ball' },
    { id: 'a3', year: 2021, title: 'Standards Vol.1', role: 'Leader · Piano', label: 'self-released' },
  ],
  upcoming: [
    { id: 'u1', date: '2026-06-14', time: '20:00', venueId: 'v-blue-moon', venue: 'Once in a Blue Moon', city: '서울 · 청담', role: 'Leader', lineup: ['7c4f-kim-jazz', '92a1-park-session', '33d2-han-drum'], ticket: '예매중' },
    { id: 'u2', date: '2026-06-28', time: '19:30', venueId: 'v-cheonnyeon', venue: '천년동안도', city: '서울 · 홍대', role: 'Sideman', lineup: ['8b1e-lee-bebop', '7c4f-kim-jazz', '92a1-park-session'], ticket: '예매중' },
    { id: 'u3', date: '2026-07-11', time: '21:00', venueId: 'v-allthat', venue: 'All That Jazz', city: '서울 · 이태원', role: 'Leader', lineup: ['7c4f-kim-jazz', '92a1-park-session', '33d2-han-drum', 'f721-choi-sax'], ticket: 'D-33' },
  ],
  myLocation: { label: '홍대입구역', x: 0.30, y: 0.40 },
  venues: [
    { id: 'v-cheonnyeon', name: '천년동안도', eng: 'Cheonnyeon', area: '마포구 · 서교동', dist: 0.5, cap: 80, since: 1998, tags: ['라이브', '다이닝'], tonight: '정수민 콰르텟', x: 0.29, y: 0.41 },
    { id: 'v-evans', name: 'Club Evans', eng: 'Club Evans', area: '마포구 · 서교동', dist: 0.7, cap: 120, since: 2002, tags: ['라이브', '잼세션'], tonight: '에반스 하우스밴드', x: 0.32, y: 0.39 },
    { id: 'v-boodaba', name: '부다바', eng: 'Boodaba', area: '마포구 · 동교동', dist: 0.9, cap: 60, since: 2011, tags: ['라이브', '와인'], tonight: null, x: 0.27, y: 0.37 },
    { id: 'v-amado', name: '아마도라운지', eng: 'Amado Lounge', area: '마포구 · 합정동', dist: 1.4, cap: 70, since: 2014, tags: ['라이브', '다이닝'], tonight: '윤트리오', x: 0.23, y: 0.45 },
    { id: 'v-sinchon', name: '재즈바 디바', eng: 'Diva', area: '서대문구 · 창천동', dist: 1.9, cap: 50, since: 2009, tags: ['라이브'], tonight: null, x: 0.34, y: 0.36 },
    { id: 'v-dimibang', name: '디미방', eng: 'Dimibang', area: '종로구 · 익선동', dist: 5.4, cap: 45, since: 2016, tags: ['라이브', '한옥'], tonight: '한드럼 트리오', x: 0.51, y: 0.33 },
    { id: 'v-allthat', name: 'All That Jazz', eng: 'All That Jazz', area: '용산구 · 이태원동', dist: 4.1, cap: 110, since: 1976, tags: ['라이브', '잼세션'], tonight: '올댓 하우스밴드', x: 0.53, y: 0.57 },
    { id: 'v-clubd', name: '재즈클럽 D', eng: 'Club D', area: '용산구 · 이태원동', dist: 4.3, cap: 90, since: 2007, tags: ['라이브'], tonight: '김재즈 트리오', x: 0.55, y: 0.56 },
    { id: 'v-blue-moon', name: 'Once in a Blue Moon', eng: 'Once in a Blue Moon', area: '강남구 · 청담동', dist: 7.9, cap: 140, since: 1999, tags: ['라이브', '다이닝', '디너쇼'], tonight: '강보컬 밴드', x: 0.78, y: 0.82 },
  ],
  concerts: [
    { id: 'c1', title: '김재즈 트리오 — Inner Voices Release', venueId: 'v-blue-moon', date: '2026-07-04', time: '20:00', status: 'upcoming', price: '40,000원', lineup: ['7c4f-kim-jazz', '92a1-park-session', '33d2-han-drum'], leader: '7c4f-kim-jazz' },
    { id: 'c2', title: '이비밥 콰르텟 — Bebop Night', venueId: 'v-evans', date: '2026-07-06', time: '21:00', status: 'upcoming', price: '30,000원', lineup: ['8b1e-lee-bebop', '7c4f-kim-jazz', '2f55-seo-bass', '7901-jung-perc'], leader: '8b1e-lee-bebop' },
    { id: 'c3', title: '윤트리오 with 강보컬', venueId: 'v-amado', date: '2026-07-09', time: '19:30', status: 'upcoming', price: '25,000원', lineup: ['c402-yoon-trio', '5d09-kang-vox', '2f55-seo-bass'], leader: 'c402-yoon-trio' },
    { id: 'c4', title: '천년동안도 화요 잼세션', venueId: 'v-cheonnyeon', date: '2026-07-14', time: '20:30', status: 'upcoming', price: '15,000원', lineup: ['92a1-park-session', '33d2-han-drum', 'f721-choi-sax', 'a880-im-pno'], leader: '92a1-park-session' },
    { id: 'c5', title: '한드럼 트리오 — 디미방 라이브', venueId: 'v-dimibang', date: '2026-06-30', time: '20:00', status: 'upcoming', price: '20,000원', lineup: ['33d2-han-drum', 'a880-im-pno', '2f55-seo-bass'], leader: '33d2-han-drum' },
    { id: 'c6', title: '김재즈 트리오 정기공연 vol.12', venueId: 'v-clubd', date: '2026-05-18', time: '20:00', status: 'past', price: '30,000원', lineup: ['7c4f-kim-jazz', '92a1-park-session', '33d2-han-drum'], leader: '7c4f-kim-jazz' },
    { id: 'c7', title: '봄의 재즈 — 4인조 스페셜', venueId: 'v-cheonnyeon', date: '2026-04-22', time: '21:00', status: 'past', price: '25,000원', lineup: ['8b1e-lee-bebop', '7c4f-kim-jazz', '92a1-park-session', '33d2-han-drum'], leader: '8b1e-lee-bebop' },
  ],
  verifyQueue: [
    { id: 'vr_1041', kind: 'claim', status: 'PENDING', requestedAt: '2026-06-24 14:20', userId: 'u_kakao_88213', musicianUuid: '11ab-oh-gtr', name: '오기타', instrument: 'Guitar', applied: '2026-06-24', school: '동덕여대 실용음악과', links: { instagram: 'oh.guitar', youtube: '@ohguitar' }, evidence: '서울재즈페스티벌 2024 출연 영상 · 자작 EP 2장', note: '5년차 재즈 기타리스트입니다. 잼세션 정기 호스트.' },
    { id: 'vr_1042', kind: 'claim', status: 'PENDING', requestedAt: '2026-06-25 09:05', userId: 'u_kakao_90117', musicianUuid: '2f55-seo-bass', name: '서베이스', instrument: 'Bass', applied: '2026-06-25', school: '한양대 음대', links: { instagram: 'seo.bass.kr' }, evidence: '클럽 에반스 하우스밴드 활동 · 음원 5곡', note: '베이시스트. 여러 트리오 세션 참여 중입니다.' },
    { id: 'vr_1043', kind: 'new', status: 'PENDING', requestedAt: '2026-06-26 22:41', userId: 'u_kakao_91530', musicianUuid: null, name: '정새벽', instrument: 'Vocal', applied: '2026-06-26', school: '버클리 음대 보컬과', links: { youtube: '@dawnjung', website: 'dawnjung.com' }, evidence: 'DB에 없던 신규 등록 · YouTube 구독 1.2만 · 개인 채널 운영', note: '재즈 보컬리스트. DAZZ에 처음 등록합니다.' },
  ],
};

export function findMusician(uuid) {
  return DATA.musicians.find((m) => m.uuid === uuid) || { uuid, name: '?', role: '', tier: 'unverified' };
}

export function findVenue(id) {
  return DATA.venues.find((v) => v.id === id) || { id, name: '?', area: '', eng: '' };
}

export function buildEdges(meUuid, shows) {
  const w = new Map();
  for (const s of shows) {
    const ids = s.lineup;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i] < ids[j] ? ids[i] : ids[j];
        const b = ids[i] < ids[j] ? ids[j] : ids[i];
        const key = `${a}::${b}`;
        w.set(key, (w.get(key) || 0) + 1);
      }
    }
  }
  const edges = [];
  for (const [k, weight] of w.entries()) {
    const [a, b] = k.split('::');
    if (a === meUuid || b === meUuid) {
      edges.push({ a, b, w: weight, other: a === meUuid ? b : a });
    }
  }
  return edges.sort((x, y) => y.w - x.w);
}

export function buildAllEdges(shows) {
  const w = new Map();
  for (const s of shows) {
    const ids = s.lineup;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i] < ids[j] ? ids[i] : ids[j];
        const b = ids[i] < ids[j] ? ids[j] : ids[i];
        const key = `${a}::${b}`;
        w.set(key, (w.get(key) || 0) + 1);
      }
    }
  }
  return [...w.entries()].map(([k, weight]) => {
    const [a, b] = k.split('::');
    return { a, b, w: weight };
  });
}