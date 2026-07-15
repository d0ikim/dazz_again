# ==================== 이 파일의 목적 ====================
# '부기우기(이태원 경리단길)'의 공연 스케줄에서 '공연 정보'와 '라인업'을 뽑아
# performance / performance_lineup 테이블에 저장하는 크롤러.
#
# 뮤지션 크롤러(crawl_bgwg.py)와의 관계:
#   같은 노션 스케줄 페이지를 읽는다. 뮤지션 크롤러가 이미
#   - 노션 JSON에서 공연 행 목록을 뽑는 extract_performance_rows()
#   - '멤버' 텍스트에서 (악기, 이름, 인스타) 뽑는 parse_members()
#   를 갖고 있어서 그대로 재사용한다. (에반스 공연 크롤러와 같은 재사용 구조)
#
# 이 파일이 새로 하는 일 = 노션 날짜 속성의 해석:
#   각 공연 행에는 '날짜' 속성이 이런 딕셔너리로 들어 있다:
#     {'type': 'datetimerange', 'start_date': '2026-07-14', 'start_time': '19:00',
#      'end_date': '2026-07-14', 'end_time': '20:45', ...}
#   → start_date + start_time으로 공연 시작 일시를 만들고,
#     시작~종료 시간을 "19:00 - 20:45" 형태로 set_info에 저장한다.
#   에반스처럼 자유 텍스트를 정규식으로 해석할 필요가 없다 (구조화된 데이터의 장점).
#
# 동작 흐름:
#   1. 스케줄 페이지에서 공연 행 목록 추출 (노션은 다가오는 공연 위주로 노출)
#   2. 행마다 (제목, 일시, 장르, 멤버 라인업) 정리
#   3. crawler_common.save_performances()로 저장
# =====================================================

# ==================== 라이브러리 Import (외부 코드 불러오기) ====================

# HTTP 요청을 보내고 응답을 받기 위한 라이브러리 (스케줄 페이지 HTML 요청용)
import requests

# 공연 일시(performance.start_time)를 만들기 위한 날짜+시간 라이브러리
from datetime import datetime

# 파이썬이 모듈을 찾는 경로 목록을 다루기 위한 라이브러리
import sys

# 파일 경로를 쉽게 다루기 위한 라이브러리
from pathlib import Path

# 이 파일은 crawler/performance/ 안에 있다.
# - 공용 모듈 crawler_common.py → 한 단계 위 crawler/ 폴더
# - 재사용할 crawl_bgwg.py      → 옆 폴더 crawler/musician/
sys.path.append(str(Path(__file__).parent.parent))
sys.path.append(str(Path(__file__).parent.parent / 'musician'))

# 공용 모듈 (DB 연결 + 공연/라인업 저장 담당)
import crawler_common

# 부기우기 뮤지션 크롤러 (노션 행 추출 + 멤버 텍스트 파싱 함수를 재사용)
import crawl_bgwg

# ==================== 상수(고정값) 정의 ====================

# venue 테이블에서 이 공연장을 찾을 때 쓰는 이름 (정확히 일치해야 함)
VENUE_NAME = "부기우기"

# 라인업에서 새 뮤지션을 INSERT할 때 쓸 출처 구분값 (뮤지션 크롤러와 동일)
MUSICIAN_SOURCE_TYPE = crawl_bgwg.SOURCE_TYPE

# 노션 날짜에 시간이 안 적힌 공연에 쓸 기본 시작 시각 (시).
# 부기우기 공연은 대부분 저녁 시간대라 20시로 둔다.
DEFAULT_START_HOUR = 20

# ==================== 노션 날짜 해석 함수 ====================

def parse_notion_date(date_value):
    """
    노션 날짜 속성 딕셔너리에서 (시작 일시, 세트 안내)를 만드는 함수.

    입력값: date_value = 노션 날짜 딕셔너리. 예:
              {'type': 'datetimerange', 'start_date': '2026-07-14',
               'start_time': '19:00', 'end_time': '20:45', ...}
            시간 없이 날짜만 있는 경우('type': 'date')도 있다. None일 수도 있다.
    반환값: (datetime 객체 또는 None, 세트 안내 문자열 또는 None) 튜플
            날짜 자체가 없으면 (None, None) → 이 공연은 저장 불가로 건너뜀
    """

    # 날짜 속성이 아예 없으면 저장 불가
    if not date_value or not date_value.get('start_date'):
        return (None, None)

    # 날짜 부분: '2026-07-14' → 연, 월, 일 숫자로 분해
    year, month, day = (int(part) for part in date_value['start_date'].split('-'))

    # 시간 부분: '19:00' → 시, 분. 시간이 없는 공연은 기본 20:00
    start_time = date_value.get('start_time')
    if start_time:
        hour, minute = (int(part) for part in start_time.split(':'))
    else:
        hour, minute = DEFAULT_START_HOUR, 0

    # 세트 안내: 시작~종료 시간이 둘 다 있으면 '19:00 - 20:45' 형태로
    end_time = date_value.get('end_time')
    set_info = f"{start_time} - {end_time}" if start_time and end_time else None

    return (datetime(year, month, day, hour, minute), set_info)

# ==================== 부기우기 공연 수집 함수 ====================

def collect_performances():
    """
    부기우기 스케줄 페이지를 크롤링해 공연 정보 리스트를 만드는 함수.

    반환값: save_performances()가 요구하는 형태의 공연 딕셔너리 리스트
    """

    # 브라우저인 척하는 User-Agent 헤더
    headers = {"User-Agent": "Mozilla/5.0"}

    try:
        # 스케줄 페이지 HTML 요청 (최대 30초 대기)
        response = requests.get(crawl_bgwg.SCHEDULE_URL, headers=headers, timeout=30)
        if response.status_code != 200:
            print(f"✗ 부기우기 페이지 요청 실패 (상태코드: {response.status_code})")
            return []

        # 인코딩 강제 지정 (서버가 charset을 안 알려줘 한글이 깨지는 문제 방지)
        response.encoding = 'utf-8'
        html = response.text
    except Exception as e:
        print(f"✗ 부기우기 페이지 요청 중 에러: {e}")
        return []

    # 노션 JSON에서 공연 행 목록 추출 (뮤지션 크롤러의 함수 재사용)
    rows = crawl_bgwg.extract_performance_rows(html)
    print(f"✓ 공연 행 {len(rows)}개 발견")

    performances = []
    skipped = 0   # 제목이나 날짜가 없어 건너뛴 행 수 (출력용)

    for row in rows:
        # 공연명: '이름' 열. 없으면 저장 불가(title은 NOT NULL) → 건너뜀
        title = row.get('이름', '').strip()

        # 날짜 해석: '_날짜' 특수 키에 노션 날짜 원본 딕셔너리가 들어 있다
        start_time, set_info = parse_notion_date(row.get('_날짜'))

        if not title or start_time is None:
            skipped += 1
            continue

        # 장르: '장르' 열 (예: 'Bebop,Swing'). 없으면 None (genre 컬럼은 NULL 허용)
        genre = row.get('장르', '').strip() or None

        # 라인업: '멤버' 텍스트를 파싱 (뮤지션 크롤러의 함수 재사용)
        # 멤버 정보가 없는 공연(잼 세션 등)은 빈 라인업으로 저장된다
        lineup = []
        for position, name, handle in crawl_bgwg.parse_members(row.get('멤버', '')):
            lineup.append({
                'stageName': name,
                'position': position,
                # 핸들이 있으면 완전한 인스타그램 URL로 (같은 사람 판별에 쓰임)
                'snsUrl': f"https://www.instagram.com/{handle}" if handle else None,
            })

        # 출처 URL: 이 공연 행의 노션 페이지 id로 개별 공연 페이지 주소를 만든다
        source_url = f"https://www.bgwg.kr/{row['_id']}" if row.get('_id') else crawl_bgwg.SCHEDULE_URL

        # 공연 1개를 save_performances()가 요구하는 딕셔너리로 정리
        performances.append({
            'startTime': start_time,
            'title': title,
            'genre': genre,
            'setInfo': set_info,      # 예: '19:00 - 20:45'
            'setList': None,          # 셋리스트 정보 없음
            'sourceUrl': source_url,
            'lineup': lineup,
        })

    print(f"✓ 공연 {len(performances)}개 수집 완료 (제목/날짜 없어 건너뜀: {skipped}개)")
    return performances

# ==================== 메인 실행 함수 ====================

def main():
    """
    부기우기 공연 크롤러의 메인 실행 함수.

    동작:
      1. 노션 스케줄 페이지에서 공연/라인업 수집
      2. DB 연결
      3. 공용 모듈로 저장 (공연 INSERT + 라인업 연결 / 중복 스킵)
    """

    # 시작 메시지
    print("\n" + "=" * 60)
    print("🎭 부기우기 공연 크롤러 시작")
    print("=" * 60 + "\n")

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
    print("✓ 부기우기 공연 크롤러 실행 완료\n")

# ==================== 프로그램 실행 ====================

# 이 파일을 직접 실행할 때만 main()을 호출한다.
if __name__ == "__main__":
    main()
