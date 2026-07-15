// 협연 횟수(weight)를 색/굵기로 표현하는 유틸 — 인맥지도(GraphView 선)와 협연 카드 배지가
// 같은 색상 규칙을 쓰도록 공통 함수로 분리 (여러 색을 섞지 않고, 와인색 하나의 명도·채도만
// 바꿔서 "값의 크기"를 표현하는 sequential 스케일)

// 절대 기준값 — "이 뮤지션의 협연자 중 최댓값"처럼 상대 기준으로 정규화하면,
// 예를 들어 모든 협연자와 다 1회씩만 함께한 뮤지션의 경우 1회가 "이 사람 기준 최댓값"이 되어
// ratio가 1(최고 굵기/진하기)로 계산되는 오류가 생김 → 실제로는 협연 1회는 항상 "약한 연결"임
// DB 실측 기준 전체 협연 쌍의 78%가 1회, 5회 이상은 1.4%뿐이라 5회 이상을 "최대"로 취급
const REFERENCE_MAX_WEIGHT = 5;

// weight: 이 카드/선의 협연 횟수
// 반환값 ratio: 0에 가까움(1회처럼 드문 연결) ~ 1(5회 이상, 아주 잦은 협연)
export function getWeightRatio(weight) {
  return Math.min(weight, REFERENCE_MAX_WEIGHT) / REFERENCE_MAX_WEIGHT;
}

// 협연 뮤지션 카드의 "N회" 배지 배경색.
// 균등한 기하급수(매 단계 15%)로는 1회→2회 차이가 뚜렷하게 안 느껴짐 — 특히 이 뮤지션의
// 최다 협연이 2회뿐인 경우(1,2단계만 존재) 두 색이 비슷해 보임.
// 실제 데이터도 1회(78%)·2회(13%) 비중이 압도적이라, 차이를 가장 크게 보여줘야 하는 지점은
// "1회 vs 2회"임 → 거듭제곱 곡선(t^0.55)으로 앞쪽(적은 횟수) 구간의 변화폭을 크게 몰아주고,
// 뒤로 갈수록(드문 4~5회) 변화폭을 점점 완만하게 줄임
const REFERENCE_MAX_WEIGHT_MINUS_1 = REFERENCE_MAX_WEIGHT - 1;
const FRONT_LOAD_EXPONENT = 0.55; // 1보다 작을수록 앞쪽(적은 횟수) 구간이 더 극적으로 벌어짐
const LIGHTNESS_MAX = 0.60; // 1회일 때(가장 옅음)
const LIGHTNESS_MIN = 0.24; // 5회 이상일 때(가장 진함)
const CHROMA_MIN = 0.08;    // 1회일 때(가장 무채색에 가까움)
const CHROMA_MAX = 0.20;    // 5회 이상일 때(가장 선명한 와인색)

export function getWeightBadgeStyle(weight) {
  // n: 1회=1단계, 2회=2단계, ... 5회 이상=5단계(최대)로 고정
  const n = Math.min(Math.max(1, weight), REFERENCE_MAX_WEIGHT);
  // t: 0(1회) ~ 1(5회 이상) 사이의 진행도. t^0.55는 t가 작을 때(초반 단계) 더 가파르게 커짐
  //    → 1회→2회 구간의 변화폭이 4회→5회 구간보다 훨씬 크게 표현됨
  const t = Math.pow((n - 1) / REFERENCE_MAX_WEIGHT_MINUS_1, FRONT_LOAD_EXPONENT);
  const lightness = LIGHTNESS_MAX - (LIGHTNESS_MAX - LIGHTNESS_MIN) * t;
  const chroma = CHROMA_MIN + (CHROMA_MAX - CHROMA_MIN) * t;
  return {
    background: `oklch(${lightness.toFixed(2)} ${chroma.toFixed(2)} 28)`,
    color: '#fff', // 가장 옅은 1회 단계도 충분히 어둡게 잡아서 흰 글자가 항상 읽히도록 함
  };
}
