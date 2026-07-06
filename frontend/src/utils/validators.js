// 폼 입력값 형식 검사 유틸 — 온보딩(새 뮤지션 등록)·프로필 편집 등 여러 폼에서 공통 사용

// URL 형식인지 검사 (빈 값은 통과 — 선택 입력 필드이므로 "입력했다면 형식이 맞는지"만 본다)
// "example.com"처럼 스킴(https://) 없이 입력해도 허용
export function isValidUrl(value) {
  if (!value) return true;
  // 스킴이 없으면 https://를 붙여서 검사 (사용자가 도메인만 입력하는 경우가 많음)
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);    // 브라우저 내장 URL 파서로 형식 검사 (공백 등이 있으면 예외 발생)
    return url.hostname.includes('.'); // "abc" 같은 단어 하나짜리 입력은 도메인이 아니므로 거름
  } catch {
    return false;                      // URL 파서가 못 읽으면 형식 오류
  }
}

// SNS 핸들(@ 뒤에 붙는 아이디) 형식인지 검사 (빈 값은 통과)
// 영문/숫자/점/밑줄/하이픈만 허용 — URL 전체나 공백이 들어오면 형식 오류로 안내
export function isValidHandle(value) {
  if (!value) return true;
  return /^[A-Za-z0-9._-]+$/.test(value);
}
