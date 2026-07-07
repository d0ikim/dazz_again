# ==================== 이 파일의 목적 ====================
# '올댓재즈(이태원)'에서 공연하는 뮤지션 정보를 수집해 musician 테이블에 저장하는 크롤러.
#
# 왜 세 크롤러 중 올댓재즈가 가장 쉬운가:
#   올댓재즈 홈페이지(allthatjazz.kr)는 화면을 자바스크립트로 그리는 사이트인데,
#   화면에 뿌릴 데이터를 '공개 JSON API'로 받아온다.
#   즉 우리가 HTML을 힘들게 파싱할 필요 없이, 그 API를 직접 호출하면
#   아티스트 정보가 이미 깔끔한 JSON(파이썬 딕셔너리) 형태로 온다.
#
# 사용하는 API:
#   GET https://allthatjazz.kr/api/artist/getallartist
#   → 올댓재즈에 등록된 '개별 아티스트' 목록을 준다.
#     (활동명, 악기, 인스타그램, 소개글, 프로필 사진 파일명 등)
#
# ※ 주의: 올댓재즈에는 예약 손님의 이름/전화번호를 주는 API도 존재하지만,
#         그건 개인정보라 절대 건드리지 않는다. 우리는 아티스트 공개정보만 쓴다.
#
# 동작 흐름:
#   1. getallartist API 호출 → 아티스트 목록(JSON) 받기
#   2. 각 아티스트를 우리 musician 딕셔너리 형태로 변환 (필드 정리 + 값 정규화)
#   3. crawler_common.save_musicians()로 DB에 저장 (중복은 자동 스킵)
# =====================================================

# ==================== 라이브러리 Import (외부 코드 불러오기) ====================

# HTTP 요청을 보내고 응답을 받기 위한 라이브러리 (JSON API 호출용)
import requests

# 파이썬이 모듈을 찾는 경로 목록을 다루기 위한 라이브러리
import sys

# 파일 경로를 쉽게 다루기 위한 라이브러리
from pathlib import Path

# 이 파일은 crawler/musician/ 안에 있고, 공용 모듈 crawler_common.py는
# 한 단계 위인 crawler/ 폴더에 있다. 파이썬은 기본적으로 상위 폴더를
# 뒤지지 않으므로, crawler_common을 import 하려면 그 폴더를 검색 경로에 직접 추가해줘야 한다.
# Path(__file__).parent        = musician 폴더
# Path(__file__).parent.parent = 그 위 crawler 폴더 (crawler_common.py가 있는 곳)
sys.path.append(str(Path(__file__).parent.parent))

# 위에서 경로를 추가했으므로 이제 공용 모듈을 불러올 수 있다 (DB 연결 + 뮤지션 저장 담당)
import crawler_common

# ==================== 상수(고정값) 정의 ====================

# 올댓재즈 아티스트 목록 API 주소
ARTIST_API_URL = "https://allthatjazz.kr/api/artist/getallartist"

# 프로필 이미지의 앞부분 주소.
# API가 주는 profileimgurl은 "1672239053215.jpg" 같은 파일명뿐이라서,
# 이 앞주소를 붙여야 실제로 볼 수 있는 완전한 이미지 URL이 된다.
IMAGE_BASE_URL = "https://allthatjazz.kr/publicimg/"

# 이 크롤러로 저장한 데이터임을 표시하는 출처 구분값 (musician.source_type 컬럼에 들어감)
SOURCE_TYPE = "CRAWLED_ALLTHATJAZZ"

# ==================== 인스타그램 값 정규화 함수 ====================

def normalize_instagram(raw):
    """
    API가 주는 instagram 값을 '완전한 인스타그램 URL' 또는 None으로 정리하는 함수.

    올댓재즈 데이터의 instagram 값은 상태가 제각각이다:
      - 'null' (문자열 'null'), '' (빈 문자열)       → 인스타 없음 → None
      - 'jinsu_kim_' (핸들만 있음)                    → 앞에 주소를 붙여 완전한 URL로
      - 'https://www.instagram.com/poming_ming/'      → 이미 완전한 URL → 그대로
      - 'Https://...' (대문자 H)                       → 소문자로 맞춰서 그대로

    입력값: raw = API가 준 instagram 문자열 (None일 수도 있음)
    반환값: 완전한 인스타그램 URL 문자열, 또는 정보가 없으면 None
    """

    # 값이 아예 없거나(None) 공백뿐이면 인스타 없음으로 처리
    if not raw:
        return None

    # 앞뒤 공백 제거
    value = raw.strip()

    # 문자열 'null'이거나 빈 값이면 인스타 없음으로 처리
    if value == "" or value.lower() == "null":
        return None

    # 이미 http(s)로 시작하면 완전한 URL이다.
    # 단, 'Https://'처럼 스킴(http/https 부분)이 대문자인 데이터가 섞여 있어
    # 스킴만 소문자로 맞춘다. (뒤쪽 주소 부분은 대소문자를 건드리지 않는다)
    lowered = value.lower()
    if lowered.startswith("https://"):
        return "https://" + value[len("https://"):]
    if lowered.startswith("http://"):
        return "http://" + value[len("http://"):]

    # 여기까지 왔으면 'jinsu_kim_' 같은 핸들만 있는 경우 → 앞주소를 붙여 완성
    return f"https://www.instagram.com/{value}"

# ==================== 아티스트 1명을 musician 딕셔너리로 변환하는 함수 ====================

def to_musician(artist):
    """
    getallartist API가 준 아티스트 1명(딕셔너리)을
    우리 DB 저장용 musician 딕셔너리로 변환하는 함수.

    입력값: artist = API가 준 아티스트 딕셔너리 (키: nickname, name, instruments, instagram 등)
    반환값: musician 딕셔너리. 저장할 만한 정보가 아니면 None
    """

    # 활동명: nickname을 우선 사용 (없으면 name으로 대체)
    # .get('키', '')  = 키가 없어도 에러 없이 빈 문자열을 돌려줌
    # .strip()        = 앞뒤 공백 제거
    stage_name = (artist.get('nickname') or artist.get('name') or '').strip()

    # 악기: instruments 값 (예: "Drums", "Saxophone,Keyboard")
    position = (artist.get('instruments') or '').strip()

    # 활동명이나 악기가 비어 있으면 뮤지션으로 저장할 가치가 없으므로 건너뜀
    # (musician 테이블에서 stage_name과 position은 NULL 불가 컬럼이기도 하다)
    if not stage_name or not position:
        return None

    # 본명: name 값. 활동명과 같으면 굳이 중복 저장하지 않고 None으로 둔다
    real_name = (artist.get('name') or '').strip() or None
    if real_name == stage_name:
        real_name = None

    # 소개글: introduce 값 (없으면 None)
    bio = (artist.get('introduce') or '').strip() or None

    # 인스타그램: 위에서 만든 정규화 함수로 완전한 URL 또는 None으로 정리
    sns_url = normalize_instagram(artist.get('instagram'))

    # 프로필 이미지: 파일명이 있으면 앞주소를 붙여 완전한 URL로, 없으면 None
    image_file = (artist.get('profileimgurl') or '').strip()
    profile_image_url = f"{IMAGE_BASE_URL}{image_file}" if image_file else None

    # 정리한 값들을 공용 모듈이 요구하는 형태의 딕셔너리로 반환
    return {
        'stageName': stage_name,
        'realName': real_name,
        'position': position,
        'bio': bio,
        'snsUrl': sns_url,
        'profileImageUrl': profile_image_url,
        'sourceType': SOURCE_TYPE,
        'sourceUrl': "https://allthatjazz.kr",   # 개별 아티스트 공개 페이지가 없어 홈페이지로 둔다
    }

# ==================== 올댓재즈 아티스트 수집 함수 ====================

def collect_musicians():
    """
    getallartist API를 호출해 올댓재즈의 뮤지션 목록을 만드는 함수.

    반환값: musician 딕셔너리 리스트
    """

    # 브라우저인 척하는 User-Agent 헤더 (일부 서버가 프로그램 접근을 막는 경우 대비)
    headers = {"User-Agent": "Mozilla/5.0"}

    try:
        # 아티스트 목록 API에 GET 요청 (최대 20초 대기)
        response = requests.get(ARTIST_API_URL, headers=headers, timeout=20)

        # 요청이 실패하면 빈 리스트 반환
        if response.status_code != 200:
            print(f"✗ 올댓재즈 API 요청 실패 (상태코드: {response.status_code})")
            return []

        # 응답을 JSON으로 파싱 → 아티스트 딕셔너리들의 리스트
        artists = response.json()

    except Exception as e:
        # 네트워크 오류 등 예외 발생 시 빈 리스트 반환
        print(f"✗ 올댓재즈 API 호출 중 에러: {e}")
        return []

    print(f"✓ 올댓재즈 API에서 아티스트 {len(artists)}명 응답 받음")

    # 수집한 뮤지션을 담을 리스트
    musicians = []

    # 아티스트를 하나씩 musician 딕셔너리로 변환
    for artist in artists:
        musician = to_musician(artist)

        # 변환 결과가 None이면(활동명/악기 없음) 건너뜀
        if musician is not None:
            musicians.append(musician)

    print(f"✓ 저장 가능한 뮤지션 {len(musicians)}명 추출 완료")
    return musicians

# ==================== 메인 실행 함수 ====================

def main():
    """
    올댓재즈 크롤러의 메인 실행 함수.

    동작:
      1. API에서 뮤지션 수집
      2. DB 연결
      3. 공용 모듈로 저장 (중복 스킵 + 결과 요약)
    """

    # 시작 메시지
    print("\n" + "="*60)
    print("🎷 올댓재즈 뮤지션 크롤러 시작")
    print("="*60)

    # 1. 뮤지션 수집
    musicians = collect_musicians()

    # 수집 결과가 없으면 종료
    if len(musicians) == 0:
        print("수집된 뮤지션이 없어 프로그램 종료")
        return

    # 2. 데이터베이스 연결 (공용 모듈 사용)
    print()
    connection = crawler_common.connect_db()

    # 연결 실패 시 종료
    if connection is None:
        print("데이터베이스 연결 실패로 프로그램 종료")
        return

    # 3. 공용 모듈로 저장 (이미 있는 활동명은 자동으로 스킵됨)
    crawler_common.save_musicians(connection, musicians)

    # 연결 종료
    connection.close()
    print("✓ 데이터베이스 연결 종료")
    print("✓ 올댓재즈 크롤러 실행 완료\n")

# ==================== 프로그램 실행 ====================

# 이 파일을 직접 실행할 때만 main()을 호출한다.
# (다른 파일에서 import 될 때는 실행되지 않음)
if __name__ == "__main__":
    main()
