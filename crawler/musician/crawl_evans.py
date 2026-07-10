# ==================== 이 파일의 목적 ====================
# '클럽에반스(홍대)'의 공연 일정에서 라인업 뮤지션을 뽑아
# musician 테이블에 저장하는 크롤러.
#
# 클럽에반스 사이트의 특징:
#   clubevans.com은 '그누보드'라는 오래된 한국 게시판 솔루션으로 만든 사이트다.
#   올댓재즈(JSON API)나 부기우기(노션 JSON)와 달리, 서버가 완성된 HTML을
#   그대로 보내준다 → 우리가 HTML 자체를 파싱해야 한다. (정통 웹 스크래핑)
#   HTML 파싱 도구로 BeautifulSoup 라이브러리를 사용한다.
#
# 사이트 구조:
#   1) 달력 페이지: /bbs/board.php?bo_table=schedule&year=2026&month=7
#      → 날짜마다 공연 제목 링크가 있음 (예: "김이슬 Quartet", wr_id=1403)
#   2) 상세 페이지: 위 링크 + &day=2&wr_id=1403
#      → 본문(id="bo_v_con")에 라인업이 줄 단위로 적혀 있음:
#            Vocal & Piano     ← 악기 줄
#            김이슬            ← 이름 줄
#            Guitar
#            김준범
#            ...
#            -                 ← 이후는 입장/공연 시간 안내
#
# 파싱 전략 (줄 단위 상태 기계):
#   줄을 위에서부터 읽으며 "지금 어떤 악기 줄 아래에 있는지"를 기억한다.
#   - 악기 줄을 만나면 → 현재 악기를 갱신
#   - 이름처럼 생긴 줄을 만나면 → 현재 악기의 연주자로 기록
#   - '-'나 시간 안내 줄을 만나면 → 라인업 구간이 끝난 것으로 보고 리셋
#
# 동작 흐름:
#   1. 최근 몇 달치 달력 페이지에서 공연 목록(day, wr_id) 수집
#   2. 각 공연의 상세 페이지에서 라인업 (악기, 이름) 뽑기
#   3. 이름 기준 중복 제거 후 crawler_common.save_musicians()로 저장
# =====================================================

# ==================== 라이브러리 Import (외부 코드 불러오기) ====================

# HTTP 요청을 보내고 응답을 받기 위한 라이브러리 (달력/상세 페이지 요청용)
import requests

# HTML을 구조적으로 파싱하기 위한 라이브러리 (pip install beautifulsoup4)
# 정규식만으로 복잡한 HTML을 다루면 코드가 깨지기 쉬워서, HTML 전용 파서를 쓴다
from bs4 import BeautifulSoup

# 문자열에서 특정 패턴을 찾기 위한 정규표현식 라이브러리 (링크 파라미터/이름 검사용)
import re

# "이번 달"을 알아내고 이전 달을 계산하기 위한 날짜 라이브러리
from datetime import date

# 요청 사이에 잠깐 쉬기 위한 라이브러리 (서버에 부담을 주지 않기 위한 예의)
import time

# 파이썬이 모듈을 찾는 경로 목록을 다루기 위한 라이브러리
import sys

# 파일 경로를 쉽게 다루기 위한 라이브러리
from pathlib import Path

# 이 파일은 crawler/musician/ 안에 있고, 공용 모듈 crawler_common.py는
# 한 단계 위인 crawler/ 폴더에 있다. 상위 폴더를 파이썬 검색 경로에 추가해야 import 가능.
sys.path.append(str(Path(__file__).parent.parent))

# 공용 모듈 (DB 연결 + 뮤지션 저장 + 악기 매핑표 담당)
import crawler_common

# ==================== 상수(고정값) 정의 ====================

# 클럽에반스 게시판 주소 (달력과 상세 페이지 둘 다 이 주소에 파라미터만 바꿔 요청)
BOARD_URL = "https://www.clubevans.com/bbs/board.php"

# 몇 달치 달력을 수집할지 (이번 달 포함. 3 = 이번 달 + 지난 두 달)
# 과거 달일수록 더 많은 뮤지션이 쌓여 있지만, 요청 수도 그만큼 늘어난다.
MONTHS_TO_CRAWL = 12

# 이 크롤러로 저장한 데이터임을 표시하는 출처 구분값 (musician.source_type 컬럼)
SOURCE_TYPE = "CRAWLED_EVANS"

# 요청 사이에 쉬는 시간(초) — 짧은 시간에 몰아치면 서버에 부담이 되므로
REQUEST_DELAY = 0.3

# 브라우저인 척하는 User-Agent 헤더
HEADERS = {"User-Agent": "Mozilla/5.0"}

# 이름 줄이 아닌 '안내 문구'를 걸러내는 패턴 (입장/공연 시간, 예약/게스트 안내 등)
NOTICE_REGEX = re.compile(r'(입장|오후|오전|예약|공연|셋리스트|참가|신청|문의|휴무|잼|Jam|guest|스페셜|special)', re.IGNORECASE)

# 문자열에 숫자가 있는지 검사하는 패턴 ("1부 8시" 같은 시간 줄 차단용)
DIGIT_REGEX = re.compile(r'[0-9]')

# 줄 안의 인스타그램 핸들(@아이디)을 찾는 패턴
# (에반스는 "이선지 (" 다음 줄에 "@sunjileepina" 처럼 핸들이 별도 줄로 오기도 한다)
HANDLE_REGEX = re.compile(r'@\s*([A-Za-z0-9._]+)')

# 한글로만 이루어진 단어(이름 토큰)인지 검사하는 패턴
# ("오재철 홍태훈 류제훈 민홍기"처럼 여러 명이 공백으로 나열된 줄을 쪼개기 위함)
KOREAN_TOKEN_REGEX = re.compile(r'^[가-힣]{2,4}$')

# ==================== 악기 줄 판별 함수 ====================

def parse_instrument_line(line):
    """
    한 줄이 '악기 줄'인지 판별하고, 맞으면 표준 악기명 리스트를 돌려주는 함수.

    악기 줄의 예: "Drums" / "Vocal & Piano" / "Piano, Keyboard"
    → 악기 단어와 구분 기호(& , / 공백)만으로 이루어진 줄이다.

    입력값: line = 한 줄 문자열
    반환값: 악기 줄이면 표준 악기명 리스트 (예: ['VOCAL', 'PIANO']), 아니면 None
    """

    # 줄에서 악기 단어들을 전부 찾는다 (공용 정규식: 긴 표기 우선 매칭)
    found = crawler_common.INSTRUMENT_REGEX.findall(line)

    # 악기 단어가 하나도 없으면 악기 줄이 아님
    if not found:
        return None

    # 줄에서 악기 단어와 구분 기호를 모두 지웠을 때 아무것도 안 남아야 진짜 악기 줄이다.
    # ("키보드/드럼을 제외한 나머지..." 같은 안내 문장은 글자가 남으므로 악기 줄이 아님)
    leftover = crawler_common.INSTRUMENT_REGEX.sub('', line)
    leftover = re.sub(r'[&,/·\s]+', '', leftover)
    if leftover != '':
        return None

    # 찾은 악기 표기들을 표준 악기명으로 변환 (중복은 한 번만, 순서 유지)
    positions = []
    for word in found:
        standard = crawler_common.INSTRUMENT_MAP[word.lower()]
        if standard not in positions:
            positions.append(standard)

    return positions

# ==================== 이름 줄 판별 함수 ====================

def looks_like_name(line):
    """
    한 줄이 '사람 이름'처럼 생겼는지 판별하는 함수.

    이름 줄의 예: "김이슬" / "Robert Fernandez" / "이선재,"
    이름이 아닌 줄의 예: "-" / "입장 오후 7시" / "1부 8시 - 8시 50분"

    입력값: line = 한 줄 문자열
    반환값: 이름으로 보이면 True, 아니면 False
    """

    # 빈 줄이거나 너무 길면(25자 초과) 이름이 아님
    if not line or len(line) > 25:
        return False

    # '-'로 시작하면 시간 안내 구간의 시작이므로 이름이 아님
    if line.startswith('-'):
        return False

    # 숫자가 들어 있으면 시간/안내 줄 ("1부 8시")이므로 이름이 아님
    if DIGIT_REGEX.search(line):
        return False

    # 안내 문구 단어(입장/예약/신청 등)가 있으면 이름이 아님
    if NOTICE_REGEX.search(line):
        return False

    return True

# ==================== 라인업 텍스트 파싱 함수 (이 파일의 핵심) ====================

def split_names(text):
    """
    이름 부분 텍스트를 '사람별'로 쪼개는 함수.

    처리하는 경우:
      - "이선재, 강재우"                    → 쉼표로 구분된 여러 명
      - "오재철 홍태훈 류제훈 민홍기"       → 공백으로 나열된 한글 이름 여러 명
        (단, "Robert Fernandez"처럼 공백이 있는 외국 이름은 한 명으로 유지해야 하므로,
         '모든 토큰이 한글 2~4자'일 때만 공백 분리를 적용한다)

    입력값: text = 이름 부분 문자열
    반환값: 이름 문자열 리스트
    """

    names = []
    for part in text.split(','):
        part = part.strip()
        if not part:
            continue

        # 공백으로 나눈 모든 토큰이 '한글 2~4자'면 여러 명이 나열된 것으로 본다
        tokens = part.split()
        if len(tokens) >= 3 and all(KOREAN_TOKEN_REGEX.match(t) for t in tokens):
            names.extend(tokens)
        else:
            names.append(part)

    return names

def parse_lineup(lines):
    """
    상세 페이지 본문의 줄 목록에서 (악기, 이름, 인스타핸들) 목록을 뽑아내는 함수.

    '상태 기계' 방식: 줄을 위에서부터 읽으며
    "지금 어떤 악기 줄 아래를 지나는 중인지"(current_positions)를 기억한다.

    인스타 핸들 처리:
      에반스는 핸들을 이름과 같은 줄에 쓰기도 하고("이선지 (@sunjileepina)"),
      아예 다음 줄에 따로 쓰기도 한다("이선지 (" → "@sunjileepina" → ")").
      → 줄에서 핸들을 먼저 뽑아내고, 남은 글자가 없으면(핸들뿐인 줄이면)
        "직전에 기록한 뮤지션의 핸들"로 붙여준다.

    입력값: lines = 본문 텍스트를 줄 단위로 나눈 리스트
    반환값: [position, name, handle] 리스트의 리스트. handle은 없으면 None.
    """

    # 지금 어떤 악기 구간에 있는지 (None = 아직 악기 줄을 못 만남)
    current_positions = None

    result = []

    for line in lines:
        # 1) 악기 줄인지 먼저 확인 → 맞으면 현재 악기를 갱신하고 다음 줄로
        positions = parse_instrument_line(line)
        if positions is not None:
            current_positions = positions
            continue

        # 2) 줄에서 인스타 핸들을 먼저 분리한다
        handle_match = HANDLE_REGEX.search(line)
        handle = handle_match.group(1).rstrip('.') if handle_match else None

        # 핸들을 지우고 괄호/구분기호를 정리한 것이 '이름 후보'
        name_part = HANDLE_REGEX.sub('', line)
        name_part = name_part.strip(' ,()/·').strip()

        # 3) 핸들만 있고 이름이 없는 줄 ("@sunjileepina" 또는 "(@mona.jazz)")
        #    → 직전에 기록한 뮤지션의 핸들로 붙여주고 넘어간다 (악기 리셋 없음)
        if handle and not name_part:
            if result and result[-1][2] is None:
                result[-1][2] = handle
            continue

        # 4) 괄호만 남은 줄 (")" 등) → 무시하고 넘어간다 (악기 리셋 없음)
        if not name_part:
            continue

        # 5) 악기 구간 안에서 이름처럼 생긴 줄이면 → 그 악기의 연주자로 기록
        if current_positions and looks_like_name(name_part):
            for name in split_names(name_part):
                # 악기가 여러 개면 "VOCAL,PIANO"처럼 쉼표로 이어 저장
                # (올댓재즈의 "Keyboard,Trumpet" 표기와 같은 방식)
                # 같은 줄에 핸들이 있었다면 첫 번째 사람에게만 붙인다
                result.append([','.join(current_positions), name, handle])
                handle = None

        else:
            # 6) 악기 줄도 이름 줄도 아니면('-', 시간 안내 등) 라인업 구간이 끝난 것
            #    → 현재 악기를 리셋해서 아래쪽 무관한 텍스트가 이름으로 오인되지 않게 함
            current_positions = None

    return result

# ==================== 달력 페이지에서 공연 목록 수집 함수 ====================

def fetch_month_events(year, month):
    """
    특정 연/월의 달력 페이지에서 공연 목록을 수집하는 함수.

    입력값: year, month = 조회할 연도와 월 (예: 2026, 7)
    반환값: (day, wr_id, 공연제목) 튜플의 리스트
    """

    # 달력 페이지 요청 파라미터
    params = {"bo_table": "schedule", "year": year, "month": month}

    try:
        response = requests.get(BOARD_URL, params=params, headers=HEADERS, timeout=20)
        if response.status_code != 200:
            print(f"  ✗ {year}년 {month}월 달력 요청 실패 (상태코드: {response.status_code})")
            return []
        # 인코딩 강제 지정 — 부기우기에서 배운 교훈: 서버가 charset을 안 알려주면
        # requests가 라틴 문자로 잘못 해석해 한글이 깨질 수 있다
        response.encoding = 'utf-8'
        html = response.text
    except Exception as e:
        print(f"  ✗ {year}년 {month}월 달력 요청 중 에러: {e}")
        return []

    # HTML을 BeautifulSoup으로 파싱 (html.parser = 파이썬 내장 파서 사용)
    soup = BeautifulSoup(html, 'html.parser')

    events = []
    seen_wr_ids = set()   # 같은 공연이 두 번 잡히지 않게 wr_id 기억

    # 달력의 공연 링크는 class="font_subject"인 <a> 태그다
    for link in soup.find_all('a', class_='font_subject'):
        href = link.get('href', '')

        # 링크 주소에서 day와 wr_id 숫자를 뽑는다
        day_match = re.search(r'day=(\d+)', href)
        wr_match = re.search(r'wr_id=(\d+)', href)
        if not day_match or not wr_match:
            continue

        wr_id = int(wr_match.group(1))

        # 이미 수집한 공연이면 건너뜀
        if wr_id in seen_wr_ids:
            continue
        seen_wr_ids.add(wr_id)

        # (일, 게시글번호, 공연제목) 저장 — 제목은 링크의 표시 텍스트
        events.append((int(day_match.group(1)), wr_id, link.get_text(strip=True)))

    return events

# ==================== 상세 페이지에서 라인업 뽑기 함수 ====================

def fetch_lineup(year, month, day, wr_id):
    """
    공연 상세 페이지를 요청해서 라인업 (악기, 이름) 목록을 돌려주는 함수.

    입력값: year, month, day, wr_id = 상세 페이지를 특정하는 값들
    반환값: (라인업 리스트, 상세페이지 URL) 튜플
    """

    # 상세 페이지 요청 파라미터 (달력 파라미터 + day + wr_id)
    params = {"bo_table": "schedule", "year": year, "month": month, "day": day, "wr_id": wr_id}

    try:
        response = requests.get(BOARD_URL, params=params, headers=HEADERS, timeout=20)
        if response.status_code != 200:
            return ([], response.url)
        response.encoding = 'utf-8'
        html = response.text
        detail_url = response.url    # 실제 요청된 전체 URL (출처 기록용)
    except Exception:
        return ([], None)

    soup = BeautifulSoup(html, 'html.parser')

    # 본문 영역 = id가 "bo_v_con"인 태그 (그누보드의 글 본문 표준 위치)
    content = soup.find(id='bo_v_con')
    if content is None:
        return ([], detail_url)

    # 본문을 줄 단위 텍스트로 변환.
    # separator='\n' → <br>이나 <p> 태그 경계마다 줄바꿈을 넣어준다 (줄 구조 유지)
    text = content.get_text(separator='\n')

    # 각 줄을 정리: 제로폭 공백(​, 안 보이는 특수문자)과 특수 공백(\xa0) 제거
    lines = []
    for line in text.split('\n'):
        line = line.replace('​', '').replace('\xa0', ' ').strip()
        if line:
            lines.append(line)

    # 줄 목록을 파싱해서 라인업 반환
    return (parse_lineup(lines), detail_url)

# ==================== 클럽에반스 뮤지션 수집 함수 ====================

def collect_musicians():
    """
    최근 몇 달치 공연 일정을 돌며 뮤지션 목록을 만드는 함수.

    반환값: musician 딕셔너리 리스트 (이름 기준 중복 제거됨)
    """

    # 이름을 키로 하는 딕셔너리로 중복 제거 (같은 뮤지션이 여러 공연에 출연하므로)
    musicians_by_name = {}

    # 이번 달부터 거꾸로 MONTHS_TO_CRAWL달치 (연도 경계도 계산: 1월의 전 달 = 작년 12월)
    today = date.today()
    year, month = today.year, today.month

    for _ in range(MONTHS_TO_CRAWL):
        print(f"\n📅 {year}년 {month}월 달력 수집 중...")
        events = fetch_month_events(year, month)
        print(f"  ✓ 공연 {len(events)}개 발견")

        # 각 공연의 상세 페이지에서 라인업 수집
        for day, wr_id, title in events:
            lineup, detail_url = fetch_lineup(year, month, day, wr_id)

            for position, name, handle in lineup:
                # 아직 없는 이름이면 등록 (이미 있으면 첫 등장 정보 유지)
                if name not in musicians_by_name:    # <- 이 검사가 중요! 이름 기준 중복 제거
                    musicians_by_name[name] = (position, detail_url, handle)

            # 서버에 부담을 주지 않도록 요청 사이에 잠깐 쉼
            time.sleep(REQUEST_DELAY)

        # 이전 달로 이동 (1월이면 작년 12월로)
        month -= 1
        if month == 0:
            month = 12
            year -= 1

    # 중복 제거된 딕셔너리를 musician 저장용 딕셔너리 리스트로 변환
    musicians = []
    for name, (position, detail_url, handle) in musicians_by_name.items():
        # 라인업에 인스타 핸들이 적혀 있었으면 완전한 URL로, 없으면 None
        sns_url = f"https://www.instagram.com/{handle}" if handle else None

        musicians.append({
            'stageName': name,
            'realName': None,                 # 에반스는 본명 정보를 제공하지 않음
            'position': position,
            'bio': None,                       # 멤버 소개글 없음
            'snsUrl': sns_url,
            'profileImageUrl': None,           # 멤버별 프로필 사진 없음
            'sourceType': SOURCE_TYPE,
            'sourceUrl': detail_url,           # 이 뮤지션이 처음 발견된 공연 상세페이지
        })

    print(f"\n✓ 저장 가능한 뮤지션 {len(musicians)}명 추출 완료 (이름 중복 제거 후)")
    return musicians

# ==================== 메인 실행 함수 ====================

def main():
    """
    클럽에반스 크롤러의 메인 실행 함수.

    동작:
      1. 최근 몇 달치 공연 일정에서 뮤지션 수집
      2. DB 연결
      3. 공용 모듈로 저장 (신규 INSERT / 사진 보완 / 중복 스킵)
    """

    # 시작 메시지
    print("\n" + "=" * 60)
    print("🎹 클럽에반스 뮤지션 크롤러 시작")
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
    print("✓ 클럽에반스 크롤러 실행 완료\n")

# ==================== 프로그램 실행 ====================

# 이 파일을 직접 실행할 때만 main()을 호출한다.
if __name__ == "__main__":
    main()
