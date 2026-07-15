# ==================== 이 파일의 목적 ====================
# '천년동안도(대학로)'의 공연 일정에서 '공연 정보'와 '라인업'을 뽑아
# performance / performance_lineup 테이블에 저장하는 크롤러.
#
# 천년동안도 사이트의 특징:
#   chunnyun.com은 'XpressEngine(XE)'이라는 한국 CMS로 만든 사이트다.
#   에반스(그누보드)처럼 서버가 완성된 HTML을 주므로 BeautifulSoup으로 파싱한다.
#
# 사이트 구조:
#   1) 달력 페이지: /index.php?mid=schedule&pGanjioption=1&pYear=2026&pMonth=7
#      → 날짜 칸마다 이런 링크가 있다:
#        <a href=/schedule/28618>20:30 구교진 Newtown</a>
#        <a href=/schedule/28619>20:00 한상원 Band vo.조남준,서성은</a>
#        형식: "시각 공연제목 [vo.보컬이름들]"
#   2) 상세 페이지: /schedule/28618
#      → 본문(div.xe_content)에 라인업이 '악기약어.이름' 줄로 적혀 있다:
#        G.한상원        ← G = Guitar
#        B.현영권        ← B = Bass
#        D.김우찬        ← D = Drums
#        K.여지수        ← K = Keyboard
#        Vo.조남준,서성은  ← 한 악기에 여러 명이면 쉼표로 나열
#
# 다른 공연장과 다른 점:
#   천년동안도는 뮤지션 크롤러가 따로 없다 (사이트에 뮤지션 목록 페이지가 없음).
#   → 이 공연 크롤러가 라인업에서 처음 보는 뮤지션을 musician 테이블에도
#     함께 등록한다 (save_performances의 신규 INSERT 규칙이 처리).
#
# 동작 흐름:
#   1. 지난달~다음달 달력 페이지에서 공연 목록(일시, 제목, 상세링크, 보컬) 수집
#   2. 각 상세 페이지에서 '악기약어.이름' 라인업 뽑기 + 달력의 보컬 이름과 합침
#   3. crawler_common.save_performances()로 저장
# =====================================================

# ==================== 라이브러리 Import (외부 코드 불러오기) ====================

# HTTP 요청을 보내고 응답을 받기 위한 라이브러리 (달력/상세 페이지 요청용)
import requests

# HTML을 구조적으로 파싱하기 위한 라이브러리
from bs4 import BeautifulSoup

# 문자열에서 특정 패턴을 찾기 위한 정규표현식 라이브러리 (달력 텍스트/라인업 줄 해석용)
import re

# 공연 일시(performance.start_time)를 만들기 위한 날짜+시간 라이브러리
from datetime import datetime, date

# 요청 사이에 잠깐 쉬기 위한 라이브러리 (서버에 부담을 주지 않기 위한 예의)
import time

# 파이썬이 모듈을 찾는 경로 목록을 다루기 위한 라이브러리
import sys

# 파일 경로를 쉽게 다루기 위한 라이브러리
from pathlib import Path

# 공용 모듈 crawler_common.py는 한 단계 위 crawler/ 폴더에 있다
sys.path.append(str(Path(__file__).parent.parent))

# 공용 모듈 (DB 연결 + 공연/라인업 저장 + 악기 매핑표 담당)
import crawler_common

# ==================== 상수(고정값) 정의 ====================

# venue 테이블에서 이 공연장을 찾을 때 쓰는 이름 (정확히 일치해야 함)
VENUE_NAME = "천년동안도"

# 사이트 기본 주소 (달력 요청과 상세 링크 조립에 사용)
BASE_URL = "http://www.chunnyun.com"

# 이 크롤러로 저장한 데이터임을 표시하는 출처 구분값.
# 천년동안도는 뮤지션 크롤러가 따로 없어서, 여기서 새로 등록되는
# 뮤지션의 musician.source_type에도 이 값이 들어간다.
SOURCE_TYPE = "CRAWLED_CHUNNYUN"

# 수집 범위 (다른 공연 크롤러와 동일한 기준)
MONTHS_BACK = 1       # 이번 달 기준 몇 달 전까지
MONTHS_FORWARD = 1    # 이번 달 기준 몇 달 후까지

# 요청 사이에 쉬는 시간(초)
REQUEST_DELAY = 0.3

# 브라우저인 척하는 User-Agent 헤더
HEADERS = {"User-Agent": "Mozilla/5.0"}

# 달력 칸의 날짜 컨테이너 id에서 날짜를 뽑는 패턴 (예: day_schedule_container_2026-7-1)
DAY_CONTAINER_REGEX = re.compile(r'day_schedule_container_(\d+)-(\d+)-(\d+)')

# 날짜 구간 안에서 공연 링크와 표시 텍스트를 뽑는 패턴.
# 같은 달력인데 URL에 따라 링크 형식이 두 가지다 (실제 확인):
#   /schedule 페이지        : href=/schedule/28618
#   연/월 지정 달력 페이지  : href=/index.php?mid=schedule&...&document_srl=28618
# 둘 다 숫자 부분(28618)이 게시글 번호이므로, 어느 형식이든 번호만 뽑는다.
SCHEDULE_LINK_REGEX = re.compile(
    r"href=[^>]*?(?:/schedule/|document_srl=)(\d+)[^>]*>\s*<span[^>]*>([^<]*)</span>"
)

# 달력 링크 텍스트에서 (시각, 나머지)를 뽑는 패턴 (예: '20:30 구교진 Newtown')
CALENDAR_TEXT_REGEX = re.compile(r'^(\d{1,2}):(\d{2})\s*(.+)$')

# 제목 끝의 보컬 표기를 뽑는 패턴 (예: '한상원 Band vo.조남준,서성은' → '조남준,서성은').
# (.*) — 별표(*)라 '0글자 이상'도 허용한다. 관리자가 이름 없이 'vo.'만 적고
# 끝내는 경우가 실제로 있어서('구교진 Newtown vo.'), 뒤에 이름이 없어도
# 'vo.' 표기 자체는 제목에서 떼어내야 하기 때문. (+였다면 이런 줄은 안 걸러짐)
VOCAL_SUFFIX_REGEX = re.compile(r'\bvo\.\s*(.*)$', re.IGNORECASE)

# 제목 앞의 'N부' 표기를 뽑는 패턴 (예: '2부 한상원 Band' → 2부는 세트 정보로 분리)
SET_PREFIX_REGEX = re.compile(r'^(\d부)\s+')

# 상세 본문의 라인업 줄 패턴: '악기표기.이름들' 또는 '악기표기:이름들'
# (예: 'G.한상원' / 'Vo.조남준,서성은' / 'Tp.배선용')
LINEUP_LINE_REGEX = re.compile(r'^([A-Za-z가-힣]{1,12})[.:]\s*(.+)$')

# 천년동안도가 쓰는 악기 '약어' → 표준 악기명 매핑표.
# 약어가 아닌 전체 표기(Bass, 피아노 등)는 공용 INSTRUMENT_MAP으로 한 번 더 찾는다.
ABBREVIATION_MAP = {
    'g': 'GUITAR', 'b': 'BASS', 'd': 'DRUMS', 'dr': 'DRUMS',
    'k': 'KEYBOARD', 'key': 'KEYBOARD', 'p': 'PIANO', 'pf': 'PIANO',
    'vo': 'VOCAL', 'voc': 'VOCAL', 'tp': 'TRUMPET', 'tb': 'TROMBONE',
    's': 'SAXOPHONE', 'ts': 'SAXOPHONE', 'as': 'SAXOPHONE', 'ss': 'SAXOPHONE',
    'fl': 'FLUTE', 'vn': 'VIOLIN', 'perc': 'PERCUSSION', 'org': 'KEYBOARD',
    'hm': 'HARMONICA',
}

# 이름 하나로 보기엔 너무 긴 '순한글 + 공백' 문자열인지 판별하는 패턴.
# 실제로 겪은 문제: 관리자가 'Vo.조남준,서성은'처럼 쉼표로 이름을 구분해야 하는데
# 가끔 'Vo.조남준 이나빈 팽한솔 서성은'처럼 쉼표 없이 띄어쓰기로만 여러 명을 적어서
# split(',')로는 안 나뉘고 4명이 한 명의 이름("조남준 이나빈 팽한솔 서성은")으로 잘못 저장됨.
# 국내 인명은 보통 2~4자, 길어도 5자 정도이므로 공백 포함 6자를 넘으면 의심 대상으로 본다.
MULTI_NAME_SUSPECT_REGEX = re.compile(r'^[가-힣\s]+$')
SINGLE_NAME_MAX_LENGTH = 6

def split_possibly_merged_names(raw_name):
    """
    쉼표로 못 나뉜 '이름 여러 개가 붙은 문자열'을 의심하고 필요하면 공백 기준으로 쪼갠다.

    입력값: raw_name = split(',')로 한 번 나눈 뒤의 이름 조각 (공백이 남아있을 수 있음)
    반환값: 이름 문자열의 리스트 (의심스러운 경우가 아니면 원본 그대로 1개짜리 리스트)
    """
    # 공백을 뺀 순수 글자 수 — 여러 명의 이름을 합친 문자열은 이 길이가 유독 길다
    letters_only_length = len(raw_name.replace(' ', ''))

    is_suspicious = (
        ' ' in raw_name                                   # 공백으로 나뉜 여러 토큰인지
        and letters_only_length > SINGLE_NAME_MAX_LENGTH   # 한 사람 이름치고 너무 긴지
        and MULTI_NAME_SUSPECT_REGEX.match(raw_name)       # 영문/숫자 없이 순한글+공백인지
    )
    if is_suspicious:
        return [part for part in raw_name.split() if part]

    return [raw_name]

# ==================== 달력 페이지에서 공연 목록 수집 함수 ====================

def fetch_month_events(year, month):
    """
    특정 연/월의 달력 페이지에서 공연 목록을 수집하는 함수.

    입력값: year, month = 조회할 연도와 월
    반환값: (datetime 일시, 제목, 세트정보, 보컬이름 리스트, 상세페이지 URL) 튜플의 리스트

    ※ 이 함수는 BeautifulSoup 대신 정규식으로 HTML 원문을 직접 자른다.
      이 사이트의 달력 HTML은 속성에 따옴표가 없는 비표준 마크업이라
      (예: href=/schedule/28618), 파이썬 내장 파서가 태그의 부모-자식 관계를
      잘못 해석해 "날짜 칸 안의 링크"를 찾지 못했다 (실제 겪은 문제).
      → 대신 날짜 컨테이너(id)의 '위치'를 기준으로 원문을 구간으로 나누고,
        각 구간(그 날짜의 HTML 조각) 안에서 공연 링크를 정규식으로 뽑는다.
    """

    # 달력 페이지 요청 파라미터 (pGanjioption=1은 사이트가 쓰는 달력 표시 옵션)
    params = {"mid": "schedule", "pGanjioption": 1, "pYear": year, "pMonth": month}

    try:
        response = requests.get(f"{BASE_URL}/index.php", params=params, headers=HEADERS, timeout=20)
        if response.status_code != 200:
            print(f"  ✗ {year}년 {month}월 달력 요청 실패 (상태코드: {response.status_code})")
            return []
        response.encoding = 'utf-8'
        html = response.text
    except Exception as e:
        print(f"  ✗ {year}년 {month}월 달력 요청 중 에러: {e}")
        return []

    events = []

    # HTML 원문에서 날짜 컨테이너들의 위치를 전부 찾는다 (문서에 날짜 순서대로 있음)
    containers = list(DAY_CONTAINER_REGEX.finditer(html))

    for i, container in enumerate(containers):
        # 컨테이너 id에서 이 칸의 실제 날짜를 뽑는다
        y, m, day = (int(g) for g in container.groups())

        # 이 컨테이너부터 '다음 컨테이너 직전'까지가 이 날짜의 HTML 구간이다
        # (마지막 날짜면 문서 끝까지)
        segment_end = containers[i + 1].start() if i + 1 < len(containers) else len(html)
        segment = html[container.end():segment_end]

        # 이 날짜 구간 안의 공연 링크들 (게시글 번호와 표시 텍스트를 뽑는다)
        for link in SCHEDULE_LINK_REGEX.finditer(segment):
            post_id, text = link.group(1), link.group(2).strip()

            # '20:30 구교진 Newtown' → 시각과 나머지 분리. 형식이 다르면 건너뜀
            match = CALENDAR_TEXT_REGEX.match(text)
            if not match:
                continue
            hour, minute, rest = int(match.group(1)), int(match.group(2)), match.group(3)

            # 끝의 'vo.이름들' 표기를 떼어 보컬 이름 리스트로 만든다
            vocals = []
            vocal_match = VOCAL_SUFFIX_REGEX.search(rest)
            if vocal_match:
                for v in vocal_match.group(1).split(','):
                    v = v.strip()
                    if v:
                        vocals.extend(split_possibly_merged_names(v))
                rest = VOCAL_SUFFIX_REGEX.sub('', rest).strip()

            # 앞의 '2부' 표기를 떼어 세트 정보로 분리한다
            set_info = None
            set_match = SET_PREFIX_REGEX.match(rest)
            if set_match:
                set_info = set_match.group(1)
                rest = SET_PREFIX_REGEX.sub('', rest).strip()

            # 남은 것이 공연 제목. 비어 있으면 저장 불가 → 건너뜀
            if not rest:
                continue

            events.append((
                datetime(y, m, day, hour, minute),      # 공연 일시
                rest,                                    # 공연 제목
                set_info,                                # 세트 정보 ('2부' 등, 없으면 None)
                vocals,                                  # 달력에 적힌 보컬 이름들
                f"{BASE_URL}/schedule/{post_id}",        # 상세페이지 URL (짧은 형식으로 통일)
            ))

    return events

# ==================== 상세 페이지에서 라인업 뽑기 함수 ====================

def fetch_lineup(detail_url):
    """
    공연 상세 페이지에서 '악기약어.이름' 줄들을 파싱해 라인업을 돌려주는 함수.

    입력값: detail_url = 상세페이지 URL
    반환값: (표준악기명, 이름) 튜플의 리스트 (본문이 없거나 실패하면 빈 리스트)
    """

    try:
        response = requests.get(detail_url, headers=HEADERS, timeout=20)
        if response.status_code != 200:
            return []
        response.encoding = 'utf-8'
    except Exception:
        return []

    # 본문 영역 = class가 "xe_content"인 태그 (XE 게시판의 글 본문 표준 위치)
    content = BeautifulSoup(response.text, 'html.parser').select_one('div.xe_content')
    if content is None:
        return []

    lineup = []

    # 본문을 줄 단위로 읽으며 '악기표기.이름들' 패턴인 줄만 라인업으로 인정
    for line in content.get_text(separator='\n').split('\n'):
        line = line.replace('\xa0', ' ').strip()

        match = LINEUP_LINE_REGEX.match(line)
        if not match:
            continue

        # 악기 표기 → 표준 악기명 변환.
        # 1차: 약어 매핑표(G, B, Vo...) / 2차: 공용 매핑표(Bass, 피아노...)
        # 둘 다 없으면 악기 줄이 아닌 일반 문장('이 게시물을...' 등)이므로 무시
        word = match.group(1).lower()
        position = ABBREVIATION_MAP.get(word) or crawler_common.INSTRUMENT_MAP.get(word)
        if position is None:
            continue

        # 이름 부분: 'Vo.조남준,서성은'처럼 여러 명이면 쉼표로 나눈다.
        # 쉼표 없이 'Vo.조남준 이나빈 팽한솔 서성은'처럼 띄어쓰기로만 적힌 경우를 대비해
        # split_possibly_merged_names()로 한 번 더 검사한다
        for name in match.group(2).split(','):
            name = name.strip()
            if name:
                for real_name in split_possibly_merged_names(name):
                    lineup.append((position, real_name))

    return lineup

# ==================== 천년동안도 공연 수집 함수 ====================

def collect_performances():
    """
    지난달~다음달 공연 일정을 돌며 공연 정보 리스트를 만드는 함수.

    반환값: save_performances()가 요구하는 형태의 공연 딕셔너리 리스트
    """

    performances = []
    seen_urls = set()   # 달력 가장자리의 이웃 달 표시로 같은 공연이 두 번 잡히는 것 방지

    # 수집할 (연, 월) 목록 (다른 공연 크롤러와 같은 통산 월수 방식)
    today = date.today()
    months = []
    for offset in range(-MONTHS_BACK, MONTHS_FORWARD + 1):
        total = (today.year * 12 + today.month - 1) + offset
        months.append((total // 12, total % 12 + 1))

    for year, month in months:
        print(f"\n📅 {year}년 {month}월 달력 수집 중...")
        events = fetch_month_events(year, month)
        print(f"  ✓ 공연 {len(events)}개 발견")

        for start_time, title, set_info, vocals, detail_url in events:
            # 이미 처리한 상세페이지면 건너뜀
            if detail_url in seen_urls:
                continue
            seen_urls.add(detail_url)

            # 상세 페이지에서 '악기약어.이름' 라인업 수집
            lineup = []
            names_seen = set()   # 같은 이름이 두 번 들어가지 않게
            for position, name in fetch_lineup(detail_url):
                if name not in names_seen:
                    names_seen.add(name)
                    # 천년동안도는 인스타 정보를 제공하지 않는다 → snsUrl은 None
                    lineup.append({'stageName': name, 'position': position, 'snsUrl': None})

            # 달력의 'vo.이름들'도 보컬로 합류 (상세 페이지에 이미 있으면 중복 제외)
            for name in vocals:
                if name not in names_seen:
                    names_seen.add(name)
                    lineup.append({'stageName': name, 'position': 'VOCAL', 'snsUrl': None})

            # 공연 1개를 save_performances()가 요구하는 딕셔너리로 정리
            performances.append({
                'startTime': start_time,
                'title': title,
                'genre': None,           # 장르 표기 없음
                'setInfo': set_info,     # 달력의 '2부' 표기 (대부분 None)
                'setList': None,         # 셋리스트 정보 없음
                'sourceUrl': detail_url,
                'lineup': lineup,
            })

            # 서버에 부담을 주지 않도록 요청 사이에 잠깐 쉼
            time.sleep(REQUEST_DELAY)

    print(f"\n✓ 공연 {len(performances)}개 수집 완료")
    return performances

# ==================== 메인 실행 함수 ====================

def main():
    """
    천년동안도 공연 크롤러의 메인 실행 함수.

    동작:
      1. 지난달~다음달 달력에서 공연/라인업 수집
      2. DB 연결
      3. 공용 모듈로 저장 (공연 INSERT + 라인업 연결 / 중복 스킵)
         라인업의 처음 보는 뮤지션은 musician 테이블에도 함께 등록된다
    """

    # 시작 메시지
    print("\n" + "=" * 60)
    print("🎭 천년동안도 공연 크롤러 시작")
    print("=" * 60)

    # 1. 공연 수집
    performances = collect_performances()
    if len(performances) == 0:
        print("수집된 공연이 없어 프로그램 종료")
        return

    # 2. 데이터베이스 연결
    print()
    connection = crawler_common.connect_db()
    if connection is None:
        print("데이터베이스 연결 실패로 프로그램 종료")
        return

    # 3. 공용 모듈로 저장
    crawler_common.save_performances(connection, VENUE_NAME, performances, SOURCE_TYPE)

    # 연결 종료
    connection.close()
    print("✓ 데이터베이스 연결 종료")
    print("✓ 천년동안도 공연 크롤러 실행 완료\n")

# ==================== 프로그램 실행 ====================

# 이 파일을 직접 실행할 때만 main()을 호출한다.
if __name__ == "__main__":
    main()
