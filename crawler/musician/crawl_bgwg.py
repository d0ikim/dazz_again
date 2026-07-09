# ==================== 이 파일의 목적 ====================
# '부기우기(이태원 경리단길)'의 공연 스케줄에서 연주 멤버(뮤지션)를 뽑아
# musician 테이블에 저장하는 크롤러.
#
# 부기우기 사이트의 특징:
#   부기우기 홈페이지(bgwg.kr)는 'oopy'라는 서비스로 만든 Notion(노션) 기반 사이트다.
#   노션 페이지의 실제 내용(공연 일정표)은 화면에 보이는 HTML이 아니라,
#   페이지 안에 숨겨진 큰 JSON 덩어리('recordMap') 안에 들어 있다.
#   → 우리는 그 JSON을 꺼내서, 공연마다 적힌 '멤버' 항목을 파싱한다.
#
# '멤버' 항목의 생김새 (사람이 자유롭게 적어서 형식이 제각각):
#   "Guitar 현용선 @yongtothesun\nBass 임대섭 @limbass2673\nDrums 채석우 @drum_seokwoo"
#   → "악기 이름 @인스타핸들"이 줄바꿈/쉼표/슬래시/공백으로 이어진 형태.
#
# 파싱 전략:
#   '악기 키워드'(Guitar, Bass, 기타, 베이스 ...)를 기준점으로 삼아,
#   각 악기 뒤에 오는 '이름'과 '@인스타핸들'을 뽑아낸다.
#   단, 인스타핸들 안에 'bass','drum' 같은 악기 단어가 섞여 있는 경우가 많아서,
#   핸들을 먼저 가려낸(치환) 뒤에 악기를 찾는다. (안 그러면 핸들이 악기로 오인됨)
#
# 동작 흐름:
#   1. 부기우기 공연 스케줄 페이지 HTML 요청
#   2. HTML 안에 숨은 노션 JSON(recordMap) 추출
#   3. 공연(행)마다 '멤버' 텍스트를 꺼냄
#   4. 멤버 텍스트를 파싱해 (악기, 이름, 인스타) 뽑기
#   5. 이름 기준 중복 제거 후 crawler_common.save_musicians()로 저장
# =====================================================

# ==================== 라이브러리 Import (외부 코드 불러오기) ====================

# HTTP 요청을 보내고 응답을 받기 위한 라이브러리 (스케줄 페이지 HTML 요청용)
import requests

# 문자열에서 특정 패턴을 찾고 자르기 위한 정규표현식 라이브러리 (파싱의 핵심 도구)
import re

# 페이지에 숨겨진 JSON 문자열을 파이썬 딕셔너리로 바꾸기 위한 라이브러리
import json

# 파이썬이 모듈을 찾는 경로 목록을 다루기 위한 라이브러리
import sys

# 파일 경로를 쉽게 다루기 위한 라이브러리
from pathlib import Path

# 이 파일은 crawler/musician/ 안에 있고, 공용 모듈 crawler_common.py는
# 한 단계 위인 crawler/ 폴더에 있다. 상위 폴더를 파이썬 검색 경로에 추가해야 import 가능.
sys.path.append(str(Path(__file__).parent.parent))

# 공용 모듈 (DB 연결 + 뮤지션 저장 담당)
import crawler_common

# ==================== 상수(고정값) 정의 ====================

# 부기우기 '공연 스케줄' 페이지 주소.
# (노션 페이지마다 고유 ID가 붙는데, 이건 부기우기 홈페이지의 '공연 스케줄' 메뉴 링크다.
#  나중에 부기우기가 페이지를 새로 만들면 이 ID가 바뀔 수 있으니 그때 갱신해야 한다)
SCHEDULE_URL = "https://www.bgwg.kr/d02c10a2-6b3e-42f7-b98e-6035d31ca2d4"

# 이 크롤러로 저장한 데이터임을 표시하는 출처 구분값 (musician.source_type 컬럼)
SOURCE_TYPE = "CRAWLED_BOOGIEWOOGIE"

# 악기 표기 → 우리 DB에서 쓸 표준 악기명 매핑표.
# 사이트마다 'Guitar', '기타', 'Tenor Saxophone' 등 표기가 달라서 하나로 통일한다.
# (여러 표기가 같은 악기를 가리키면 같은 값으로 모은다. 예: 'sax'와 'saxophone' → 'SAXOPHONE')
INSTRUMENT_MAP = {
    # --- 영어 표기 ---
    'tenor saxophone': 'SAXOPHONE', 'alto saxophone': 'SAXOPHONE', 'bass clarinet': 'CLARINET',
    'double bass': 'BASS', 'tenorsax': 'SAXOPHONE', 'saxophone': 'SAXOPHONE', 'trombone': 'TROMBONE',
    'trumpet': 'TRUMPET', 'clarinet': 'CLARINET', 'keyboard': 'KEYBOARD', 'guitar': 'GUITAR',
    'violin': 'VIOLIN', 'flute': 'FLUTE', 'vocal': 'VOCAL', 'piano': 'PIANO', 'drums': 'DRUMS',
    'drum': 'DRUMS', 'harp': 'HARP', 'bass': 'BASS', 'cello': 'CELLO', 'oud': 'OUD', 'sax': 'SAXOPHONE',
    # --- 한글 표기 ---
    '기타': 'GUITAR', '베이스': 'BASS', '드럼': 'DRUMS', '피아노': 'PIANO', '트럼펫': 'TRUMPET',
    '트롬본': 'TROMBONE', '트럼본': 'TROMBONE', '색소폰': 'SAXOPHONE', '보컬': 'VOCAL', '바이올린': 'VIOLIN',
    '플루트': 'FLUTE', '클라리넷': 'CLARINET', '하프': 'HARP', '건반': 'KEYBOARD',
}

# 악기 키워드를 찾는 정규식.
# 긴 표기가 먼저 매칭되도록 길이 내림차순으로 정렬한다.
# (예: 'Tenor Saxophone'을 'Sax'보다 먼저 시도해야 통째로 잡힌다)
_INSTR_KEYS = sorted(INSTRUMENT_MAP.keys(), key=len, reverse=True)
INSTR_REGEX = re.compile('(' + '|'.join(re.escape(k) for k in _INSTR_KEYS) + ')', re.IGNORECASE)

# 인스타그램 핸들을 찾는 정규식. '@' 뒤(공백이 껴 있어도)의 영문/숫자/./_ 를 핸들로 본다.
HANDLE_REGEX = re.compile(r'@\s*([A-Za-z0-9._]+)')

# 문자열에 한글이 하나라도 있는지 검사하는 정규식 (이름 판별용)
KOREAN_REGEX = re.compile(r'[가-힣]')

# ==================== 멤버 텍스트 파싱 함수 (이 파일의 핵심) ====================

def parse_members(member_text):
    """
    한 공연의 '멤버' 텍스트에서 (악기, 이름, 인스타핸들) 목록을 뽑아내는 함수.

    입력값: member_text = 예) "Guitar 현용선 @yongtothesun\nBass 임대섭 @limbass2673"
    반환값: (position, name, handle) 튜플의 리스트. handle은 없으면 None.
    """

    # 불릿 기호(•)는 파싱에 방해되므로 공백으로 바꾼다
    text = member_text.replace('•', ' ')

    # 1) 인스타 핸들을 먼저 찾아 '자리표시자'로 치환한다.
    #    핸들 안에 'bass','drum','guitar' 같은 악기 단어가 들어 있는 경우가 많아서,
    #    핸들을 그대로 두면 뒤의 악기 검색이 핸들 속 단어를 악기로 오인해 이름이 깨진다.
    #    그래서 핸들을 잠깐 \x00번호\x00 형태로 숨겨두고, 나중에 번호로 다시 찾아 복원한다.
    handles = []

    def _mask(match):
        # 핸들 끝의 마침표는 문장부호일 수 있어 제거한 뒤 저장
        handles.append(match.group(1).rstrip('.'))
        # 숨긴 자리에 '자리표시자'를 남긴다 (앞뒤 공백은 단어 구분용)
        return f' \x00{len(handles) - 1}\x00 '

    masked = HANDLE_REGEX.sub(_mask, text)

    # 2) 핸들이 가려진 문자열에서 악기 키워드들의 위치를 모두 찾는다
    matches = list(INSTR_REGEX.finditer(masked))

    result = []

    # 3) 각 악기 키워드부터 '다음 악기 키워드 직전'까지가 그 멤버 한 명의 정보다
    for i, match in enumerate(matches):
        start = match.end()  # 이 악기 표기 바로 뒤부터
        end = matches[i + 1].start() if i + 1 < len(matches) else len(masked)  # 다음 악기 직전까지
        chunk = masked[start:end]

        # 이 구간 안의 자리표시자 번호를 찾아 핸들을 복원 (없으면 None)
        handle_match = re.search(r'\x00(\d+)\x00', chunk)
        handle = handles[int(handle_match.group(1))] if handle_match else None

        # 이름 = 구간에서 자리표시자를 지우고 앞뒤 구분기호/공백을 정리한 것
        name = re.sub(r'\x00\d+\x00', '', chunk).strip(' ,/\n\t:-').strip()
        # 이름 중간에 여러 공백이 있으면 하나로 합침
        name = re.sub(r'\s+', ' ', name)

        # 이름이 비었으면 저장 불가 (stage_name은 NOT NULL) → 건너뜀
        if not name:
            continue

        # 안전장치: 이름에 한글이 하나도 없고 인스타 핸들도 없으면
        # 실제 사람 이름이 아니라 찌꺼기(예: "Electric")일 가능성이 크므로 버린다.
        # (한국 재즈신 특성상 대부분 한글 이름이고, 영문 이름이면 보통 인스타가 함께 적혀 있다)
        if not KOREAN_REGEX.search(name) and not handle:
            continue

        # 악기 표기를 표준 악기명으로 변환해서 결과에 추가
        position = INSTRUMENT_MAP[match.group(1).lower()]
        result.append((position, name, handle))

    return result

# ==================== 노션 페이지에서 공연 목록 추출 함수 ====================

def extract_performance_rows(html):
    """
    부기우기 스케줄 페이지 HTML 안에 숨은 노션 JSON을 파싱해서,
    각 공연(행)의 항목(멤버/이름/장르/날짜)을 딕셔너리 리스트로 돌려주는 함수.

    입력값: html = 스케줄 페이지 전체 HTML 문자열
    반환값: [{'멤버': ..., '이름': ..., ...}, ...] 형태의 리스트
    """

    # HTML 안의 모든 <script>...</script> 내용을 뽑는다
    scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.S)

    # 그중 노션 데이터가 담긴 것 = 내용에 '"recordMap"'이 들어 있는 스크립트
    data_script = None
    for script in scripts:
        if '"recordMap"' in script:
            data_script = script
            break

    # 못 찾으면 빈 리스트 (사이트 구조가 바뀐 경우)
    if data_script is None:
        print("✗ 페이지에서 노션 데이터(recordMap)를 찾지 못했습니다")
        return []

    # 스크립트 문자열을 JSON으로 파싱 → 파이썬 딕셔너리
    data = json.loads(data_script)

    # recordMap = 노션 페이지의 모든 데이터 덩어리
    record_map = data['props']['pageProps']['recordMap']

    # collection = 표(데이터베이스)의 '열 정의'가 들어 있는 곳
    collection = record_map['collection']
    collection_id = list(collection.keys())[0]              # 표가 하나뿐이므로 첫 번째 사용
    schema = collection[collection_id]['value']['schema']   # 열 정의 (열ID → 열이름)

    # 열ID를 사람이 읽는 열이름('멤버','이름' 등)으로 바꾸기 위한 매핑
    id_to_name = {col_id: col['name'] for col_id, col in schema.items()}

    # block = 페이지의 모든 조각. 이 중 '표의 한 행'인 것만 골라낸다.
    rows = []
    for block in record_map['block'].values():
        value = block.get('value', {})

        # type이 'page'이고 부모가 'collection'인 블록 = 표의 한 행(공연 1개)
        if value.get('type') == 'page' and value.get('parent_table') == 'collection':
            properties = value.get('properties', {})

            # 각 열의 값을 사람이 읽는 텍스트로 변환
            row = {}
            for col_id, rich_text in properties.items():
                col_name = id_to_name.get(col_id, col_id)
                # 노션 rich text는 [[텍스트조각, ...], ...] 구조 → 텍스트만 이어붙임
                row[col_name] = ''.join(seg[0] for seg in rich_text if seg)

            rows.append(row)

    return rows

# ==================== 부기우기 뮤지션 수집 함수 ====================

def collect_musicians():
    """
    부기우기 스케줄 페이지를 크롤링해 뮤지션 목록을 만드는 함수.

    반환값: musician 딕셔너리 리스트 (이름 기준 중복 제거됨)
    """

    # 브라우저인 척하는 User-Agent 헤더
    headers = {"User-Agent": "Mozilla/5.0"}

    try:
        # 스케줄 페이지 HTML 요청 (최대 30초 대기)
        response = requests.get(SCHEDULE_URL, headers=headers, timeout=30)
        if response.status_code != 200:
            print(f"✗ 부기우기 페이지 요청 실패 (상태코드: {response.status_code})")
            return []

        # ★ 인코딩 강제 지정 (중요)
        # 부기우기 서버는 응답 헤더에 charset(문자 인코딩)을 알려주지 않는다.
        # 이 경우 requests는 HTTP 옛 규약대로 ISO-8859-1(라틴 문자)로 해석해버려서
        # 한글('멤버', 이름들)이 전부 깨지고 → 결과가 0명이 된다.
        # 실제 페이지는 UTF-8이므로 직접 지정해준다.
        response.encoding = 'utf-8'

        html = response.text
    except Exception as e:
        print(f"✗ 부기우기 페이지 요청 중 에러: {e}")
        return []

    # HTML에서 공연 목록(행)을 추출
    rows = extract_performance_rows(html)
    print(f"✓ 공연 {len(rows)}개 발견")

    # 이름을 키로 하는 딕셔너리로 중복 제거 (같은 뮤지션이 여러 공연에 출연하므로)
    # 값에는 (position, handle)을 담는다. 먼저 나온 것을 우선 유지한다.
    musicians_by_name = {}

    # 공연마다 '멤버' 텍스트를 파싱
    for row in rows:
        member_text = row.get('멤버', '')

        # 멤버 정보가 없는 공연(잼 세션 등)은 건너뜀
        if not member_text.strip():
            continue

        # 멤버 텍스트에서 (악기, 이름, 핸들) 뽑기
        for position, name, handle in parse_members(member_text):
            # 아직 없는 이름이면 등록 (이미 있으면 첫 등장 정보 유지)
            if name not in musicians_by_name:
                musicians_by_name[name] = (position, handle)

    # 중복 제거된 딕셔너리를 musician 저장용 딕셔너리 리스트로 변환
    musicians = []
    for name, (position, handle) in musicians_by_name.items():
        # 핸들이 있으면 완전한 인스타그램 URL로, 없으면 None
        sns_url = f"https://www.instagram.com/{handle}" if handle else None

        musicians.append({
            'stageName': name,
            'realName': None,                 # 부기우기는 본명 정보를 제공하지 않음
            'position': position,
            'bio': None,                       # 멤버 소개글 없음
            'snsUrl': sns_url,
            'profileImageUrl': None,           # 멤버별 프로필 사진 없음
            'sourceType': SOURCE_TYPE,
            'sourceUrl': SCHEDULE_URL,
        })

    print(f"✓ 저장 가능한 뮤지션 {len(musicians)}명 추출 완료 (이름 중복 제거 후)")
    return musicians

# ==================== 메인 실행 함수 ====================

def main():
    """
    부기우기 크롤러의 메인 실행 함수.

    동작:
      1. 스케줄 페이지에서 뮤지션 수집
      2. DB 연결
      3. 공용 모듈로 저장 (신규 INSERT / 사진 보완 / 중복 스킵)
    """

    # 시작 메시지
    print("\n" + "=" * 60)
    print("🎺 부기우기 뮤지션 크롤러 시작")
    print("=" * 60)

    # 1. 뮤지션 수집
    musicians = collect_musicians()
    if len(musicians) == 0:
        print("수집된 뮤지션이 없어 프로그램 종료")
        return

    # 2. 데이터베이스 연결
    print()
    connection = crawler_common.connect_db()
    if connection is None:
        print("데이터베이스 연결 실패로 프로그램 종료")
        return

    # 3. 공용 모듈로 저장
    crawler_common.save_musicians(connection, musicians)

    # 연결 종료
    connection.close()
    print("✓ 데이터베이스 연결 종료")
    print("✓ 부기우기 크롤러 실행 완료\n")

# ==================== 프로그램 실행 ====================

# 이 파일을 직접 실행할 때만 main()을 호출한다.
if __name__ == "__main__":
    main()
