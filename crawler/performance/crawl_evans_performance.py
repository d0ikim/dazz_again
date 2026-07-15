# ==================== 이 파일의 목적 ====================
# '클럽에반스(홍대)'의 공연 일정에서 '공연 정보'와 '라인업'을 뽑아
# performance / performance_lineup 테이블에 저장하는 크롤러.
#
# 뮤지션 크롤러(crawl_evans.py)와의 관계:
#   두 크롤러는 완전히 같은 페이지(달력 → 공연 상세)를 읽는다.
#   - 뮤지션 크롤러: 상세 본문에서 (악기, 이름)만 뽑아 musician 테이블에 저장
#   - 공연 크롤러(이 파일): 거기에 더해 공연 자체(제목/일시/세트정보)를
#     performance에 저장하고, 라인업을 performance_lineup으로 연결한다.
#   → 달력 수집/본문 파싱 함수는 crawl_evans.py의 것을 import 해서 재사용한다.
#     (같은 코드를 두 번 만들지 않기 위함. 악기 매핑표를 공용화한 것과 같은 원리)
#
# 이 파일이 새로 하는 일 = 상세 본문의 '시간 안내 줄' 해석:
#   라인업이 끝난 뒤 본문 아래쪽에 이런 줄들이 온다:
#     입장 오후 7시
#     1부 8시 - 8시 50분          ← 여기서 공연 시작 시각(20:00)을 뽑는다
#     2부 9시 20분 - 10시 10분
#   → 이 줄들을 통째로 모아 set_info 컬럼에도 저장한다 (세트 안내 원문 보존)
#
# 동작 흐름:
#   1. 지난달~다음달 달력 페이지에서 공연 목록(day, wr_id, 제목) 수집
#   2. 각 공연의 상세 페이지에서 (라인업, 시작 시각, 세트 안내) 뽑기
#   3. crawler_common.save_performances()로 저장
#      (공연 INSERT + 라인업 연결, 라인업의 새 뮤지션은 musician에도 INSERT)
# =====================================================

# ==================== 라이브러리 Import (외부 코드 불러오기) ====================

# 문자열에서 특정 패턴을 찾기 위한 정규표현식 라이브러리 (시간 줄 해석용)
import re

# 공연 일시(performance.start_time)를 만들기 위한 날짜+시간 라이브러리
from datetime import datetime, date

# 요청 사이에 잠깐 쉬기 위한 라이브러리 (서버에 부담을 주지 않기 위한 예의)
import time

# 파이썬이 모듈을 찾는 경로 목록을 다루기 위한 라이브러리
import sys

# 파일 경로를 쉽게 다루기 위한 라이브러리
from pathlib import Path

# 이 파일은 crawler/performance/ 안에 있다.
# - 공용 모듈 crawler_common.py  → 한 단계 위 crawler/ 폴더
# - 재사용할 crawl_evans.py     → 옆 폴더 crawler/musician/
# 두 폴더 모두 파이썬 검색 경로에 추가해야 import 할 수 있다!!
sys.path.append(str(Path(__file__).parent.parent))
sys.path.append(str(Path(__file__).parent.parent / 'musician'))

# 공용 모듈 (DB 연결 + 공연/라인업 저장 담당)
import crawler_common

# 에반스 뮤지션 크롤러 (달력 수집 + 상세 본문 파싱 함수를 재사용)
import crawl_evans

# ==================== 상수(고정값) 정의 ====================

# venue 테이블에서 이 공연장을 찾을 때 쓰는 이름 (정확히 일치해야 함)
VENUE_NAME = "클럽에반스"

# 몇 달치 달력을 수집할지.
# 공연 검색 기능에는 '앞으로의 공연'이 중요하고, 인맥지도에는 '과거 공연'도 쓰이므로
# 지난달(-1)부터 다음달(+1)까지 총 3달치를 기본으로 한다.
MONTHS_BACK = 1       # 이번 달 기준 몇 달 전까지
MONTHS_FORWARD = 1    # 이번 달 기준 몇 달 후까지

# 라인업에서 새 뮤지션을 musician 테이블에 INSERT할 때 쓸 출처 구분값.
# 뮤지션 크롤러와 같은 값을 써서 "에반스에서 수집된 뮤지션"으로 통일한다.
MUSICIAN_SOURCE_TYPE = crawl_evans.SOURCE_TYPE

# 시간 안내를 못 찾은 공연에 쓸 기본 시작 시각 (시).
# 에반스 공연은 거의 모두 저녁 8시(1부) 시작이라 20시로 둔다.
DEFAULT_START_HOUR = 20

# '1부' 줄에서 시작 시각을 뽑는 정규식.
#   '1부 8시 - 8시 50분'  → 시=8, 분=없음
#   '1부 8시 30분 - ...'  → 시=8, 분=30
#   '1부 20:30'           → 시=20, 분=30
# \D* = 숫자가 아닌 글자들(공백 등)을 건너뜀 / (?:시|:) = '시' 또는 ':' 둘 다 허용
START_TIME_REGEX = re.compile(r'1부\D*(\d{1,2})(?:시|:)\s*(\d{1,2})?')

# 세트 안내 줄('입장 ...', '1부 ...', '2부 ...')을 골라내는 정규식
SET_INFO_REGEX = re.compile(r'^(입장|\d부)')

# ==================== 시간 안내 줄 해석 함수 ====================

def parse_start_time(lines, year, month, day):
    """
    상세 본문의 줄 목록에서 공연 시작 일시(datetime)를 만드는 함수.

    '1부 8시 - 8시 50분' 줄의 시각을 공연 시작 시각으로 본다.
    (입장 시각이 아니라 실제 연주가 시작되는 1부 시각을 쓴다)

    입력값:
      - lines            = 본문 줄 문자열 리스트
      - year, month, day = 이 공연의 날짜 (달력에서 얻은 값)
    반환값: datetime 객체 (예: 2026-07-08 20:00). 시간 줄이 없으면 기본 20:00
    """

    # 기본값: 저녁 8시 정각
    hour, minute = DEFAULT_START_HOUR, 0

    # 줄들 중 '1부 시각' 패턴이 있는 첫 줄을 찾는다
    for line in lines:
        match = START_TIME_REGEX.search(line)
        if match:
            hour = int(match.group(1))
            
            # 분은 없을 수도 있다 ('1부 8시') → 없으면 0분
            minute = int(match.group(2)) if match.group(2) else 0

            # 재즈클럽 공연은 저녁이므로, '8시'처럼 12보다 작은 시각은 오후로 해석 (8 → 20)
            # ('20:30'처럼 24시간제로 적힌 경우는 그대로 둔다)
            if hour < 12:
                hour += 12
            break

    # 날짜(달력에서 얻음) + 시각(본문에서 얻음)을 합쳐 datetime으로
    return datetime(year, month, day, hour, minute)

def collect_set_info(lines):
    """
    상세 본문의 줄 목록에서 세트 안내 줄들을 모아 한 문자열로 만드는 함수.

    입력값: lines = 본문 줄 문자열 리스트
    반환값: '입장 오후 7시 / 1부 8시 - 8시 50분 / 2부 9시 20분 - 10시 10분' 같은 문자열.
            안내 줄이 하나도 없으면 None (set_info 컬럼은 NULL 허용)
    """

    # '입장' 또는 '숫자+부'로 시작하는 줄만 골라낸다
    info_lines = [line for line in lines if SET_INFO_REGEX.match(line)]

    # ' / '로 이어붙여 반환 (없으면 None)
    return ' / '.join(info_lines) if info_lines else None

# ==================== 클럽에반스 공연 수집 함수 ====================

def collect_performances():
    """
    지난달~다음달 공연 일정을 돌며 공연 정보 리스트를 만드는 함수.

    반환값: save_performances()가 요구하는 형태의 공연 딕셔너리 리스트
    """

    performances = []

    # ── 수집할 (연, 월) 목록 만들기 ─────────────────────────────
    # 목표: 이번 달 기준 지난달~다음달, 즉 [(2026,6), (2026,7), (2026,8)] 같은 목록.
    #
    # 그냥 month에 -1, +1을 더하면 연도 경계에서 깨진다:
    #   2026년 1월의 지난달 = month 0 (X) → 2025년 12월이 나와야 함
    # 그래서 "연/월"을 잠시 "통산 월수"(0년 1월부터 몇 번째 달인지 하나의 숫자)로
    # 바꿔서 덧셈/뺄셈을 한 뒤, 다시 연/월로 되돌리는 방법을 쓴다.
    # 숫자 하나로 만들면 12월→1월 넘어가는 걸림돌 없이 그냥 더하고 빼면 되기 때문.

    # 오늘 날짜 (여기서 이번 달이 몇 월인지 얻는다)
    today = date.today()

    # 완성된 (연, 월) 튜플들을 담을 리스트
    months = []

    # offset(오프셋) = 이번 달에서 몇 달 떨어져 있는지. -1=지난달, 0=이번달, +1=다음달.
    # range(시작, 끝)은 '시작'부터 '끝-1'까지의 숫자를 만든다 (끝 숫자는 포함 안 됨!).
    # → range(-1, 2)는 -1, 0, 1 세 개. 끝이 포함 안 되기 때문에
    #   "다음달(+1)까지 포함"하려고 MONTHS_FORWARD에 +1을 해서 끝을 2로 만든 것.
    for offset in range(-MONTHS_BACK, MONTHS_FORWARD + 1):

        # 1단계: 연/월 → 통산 월수로 변환 후 offset을 더한다.
        #   공식: 연 × 12 + (월 - 1)   ← 월에서 1을 빼는 이유: 나눗셈 계산을 위해 0부터 세려고
        #   예: 2026년 7월 → 2026×12 + 6 = 24318
        #       offset -1을 더하면 24317 (= 한 달 전)
        total = (today.year * 12 + today.month - 1) + offset

        # 2단계: 통산 월수 → 다시 (연, 월)로 되돌린다.
        #   연 = total을 12로 나눈 몫(//),  월 = 12로 나눈 나머지(%) + 1 (아까 뺀 1을 되돌림)
        #   예: 24317 → 연 = 24317//12 = 2026, 월 = 24317%12 + 1 = 5+1 = 6 → (2026, 6월) ✓
        #   연도 경계 예: 2026년 1월(24312)의 한 달 전 = 24311
        #               → 연 = 2025, 월 = 11+1 = 12 → (2025, 12월) ✓ 자연스럽게 해결됨
        months.append((total // 12, total % 12 + 1))

    # ── 달마다 달력을 돌며 공연 수집 ─────────────────────────────
    # months 안의 (연, 월) 튜플이 year, month 두 변수로 하나씩 풀려서 들어온다
    for year, month in months:
        print(f"\n📅 {year}년 {month}월 달력 수집 중...")

        # 달력 페이지에서 공연 목록 수집 (뮤지션 크롤러의 함수 재사용)
        events = crawl_evans.fetch_month_events(year, month)
        print(f"  ✓ 공연 {len(events)}개 발견")

        # 각 공연의 상세 페이지에서 (라인업, 시각, 세트 안내) 뽑기
        for day, wr_id, title in events:
            # 상세 본문(줄 목록)과 전체 제목을 가져온다 (뮤지션 크롤러의 함수 재사용)
            lines, detail_url, full_title = crawl_evans.fetch_detail_lines(year, month, day, wr_id)

            # 본문에서 라인업 추출 (뮤지션 크롤러의 파싱 함수 재사용)
            # 결과 형태: [악기, 이름, 인스타핸들]의 리스트
            lineup = []
            for position, name, handle in crawl_evans.parse_lineup(lines):
                lineup.append({
                    'stageName': name,
                    'position': position,
                    # 핸들이 있으면 완전한 인스타그램 URL로 (같은 사람 판별에 쓰임)
                    'snsUrl': f"https://www.instagram.com/{handle}" if handle else None,
                })

            # 공연 1개를 save_performances()가 요구하는 딕셔너리로 정리
            performances.append({
                'startTime': parse_start_time(lines, year, month, day),
                # 제목: 상세페이지의 전체 제목 우선 사용 (달력 텍스트는 길면 '…'로 잘려 있음).
                #       상세페이지에서 못 얻었을 때만 달력 텍스트로 대체
                'title': full_title or title,
                'genre': None,                        # 에반스는 장르 표기가 없음
                'setInfo': collect_set_info(lines),   # 세트 안내 원문 ('입장.../1부.../2부...')
                'setList': None,                      # 셋리스트 정보 없음
                'sourceUrl': detail_url,              # 이 공연의 상세페이지 URL
                'lineup': lineup,                     # 라인업 (공연-뮤지션 연결용)
            })

            # 서버에 부담을 주지 않도록 요청 사이에 잠깐 쉼
            time.sleep(crawl_evans.REQUEST_DELAY)

    print(f"\n✓ 공연 {len(performances)}개 수집 완료")
    return performances

# ==================== 메인 실행 함수 ====================

def main():
    """
    클럽에반스 공연 크롤러의 메인 실행 함수.

    동작:
      1. 지난달~다음달 공연 일정에서 공연/라인업 수집
      2. DB 연결
      3. 공용 모듈로 저장 (공연 INSERT + 라인업 연결 / 중복 스킵)
    """

    # 시작 메시지
    print("\n" + "=" * 60)
    print("🎭 클럽에반스 공연 크롤러 시작")
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
    crawler_common.save_performances(connection, VENUE_NAME, performances, MUSICIAN_SOURCE_TYPE)

    # 연결 종료
    connection.close()
    print("✓ 데이터베이스 연결 종료")
    print("✓ 클럽에반스 공연 크롤러 실행 완료\n")

# ==================== 프로그램 실행 ====================

# 이 파일을 직접 실행할 때만 main()을 호출한다.
if __name__ == "__main__":
    main()
