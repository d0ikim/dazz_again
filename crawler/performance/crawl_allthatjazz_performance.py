# ==================== 이 파일의 목적 ====================
# '올댓재즈(이태원)'의 공연 스케줄에서 '공연 정보'와 '라인업'을 뽑아
# performance / performance_lineup 테이블에 저장하는 크롤러.
#
# 뮤지션 크롤러(crawl_allthatjazz.py)와 마찬가지로 공개 JSON API를 쓴다.
# 세 크롤러 중 가장 구조화가 잘 된 소스라 HTML 파싱이 전혀 필요 없다.
#
# 사용하는 API 2개:
#   1. GET /api/admin/scheduleforcustomer
#      → 모든 공연 일정 목록. 항목마다 이런 값이 온다:
#        yyyy, mm, dd  : 공연 날짜
#        bu            : 그날의 몇 번째 무대인지 (0=1부, 1=2부 — 하루 2공연 가능)
#        starthh/startmm : 시작 시각 / timeplan : '20:30 - 23:00' (세트 안내용)
#        usertype      : 'TEAM'(팀 공연) 또는 'ARTIST'(개인 공연)
#        nickname      : 팀명 또는 개인 활동명 → 우리 공연 제목(title)으로 쓴다
#        instruments, instagram : ARTIST일 때 그 사람의 악기/인스타
#   2. POST /api/user/getperformmembers  (body: yyyy, mm, dd, bu, teamname)
#      → TEAM 공연의 멤버 목록(활동명 nickname들). 팀 공연의 라인업은 이걸로 뽑는다.
#        (ARTIST 공연은 그 사람 혼자가 라인업이므로 추가 호출이 필요 없다)
#
# 수집 범위: 에반스 공연 크롤러와 동일하게 지난달~다음달 3달치.
#   (스케줄 API는 2022년까지 전부 주지만, 오래된 팀 공연마다 멤버 API를
#    호출하면 요청이 수백 개로 늘어나서 범위를 제한한다)
#
# 동작 흐름:
#   1. 스케줄 API 호출 → 지난달~다음달 공연만 골라냄
#   2. TEAM 공연이면 멤버 API로 라인업 조회, ARTIST 공연이면 본인이 라인업
#   3. crawler_common.save_performances()로 저장
# =====================================================

# ==================== 라이브러리 Import (외부 코드 불러오기) ====================

# HTTP 요청을 보내고 응답을 받기 위한 라이브러리 (JSON API 호출용)
import requests

# 공연 일시(performance.start_time)를 만들기 위한 날짜+시간 라이브러리
from datetime import datetime, date

# 요청 사이에 잠깐 쉬기 위한 라이브러리 (멤버 API 연속 호출 시 서버 배려)
import time

# 파이썬이 모듈을 찾는 경로 목록을 다루기 위한 라이브러리
import sys

# 파일 경로를 쉽게 다루기 위한 라이브러리
from pathlib import Path

# 이 파일은 crawler/performance/ 안에 있다.
# - 공용 모듈 crawler_common.py      → 한 단계 위 crawler/ 폴더
# - 재사용할 crawl_allthatjazz.py    → 옆 폴더 crawler/musician/
sys.path.append(str(Path(__file__).parent.parent))
sys.path.append(str(Path(__file__).parent.parent / 'musician'))

# 공용 모듈 (DB 연결 + 공연/라인업 저장 담당)
import crawler_common

# 올댓재즈 뮤지션 크롤러 (인스타 정규화 함수를 재사용)
import crawl_allthatjazz

# ==================== 상수(고정값) 정의 ====================

# venue 테이블에서 이 공연장을 찾을 때 쓰는 이름 (정확히 일치해야 함)
VENUE_NAME = "올댓재즈"

# 공연 일정 목록 API 주소
SCHEDULE_API_URL = "https://allthatjazz.kr/api/admin/scheduleforcustomer"

# 팀 공연의 멤버 목록 API 주소 (POST로 공연을 특정하는 값들을 보낸다)
MEMBERS_API_URL = "https://allthatjazz.kr/api/user/getperformmembers"

# 라인업에서 새 뮤지션을 INSERT할 때 쓸 출처 구분값 (뮤지션 크롤러와 동일)
MUSICIAN_SOURCE_TYPE = crawl_allthatjazz.SOURCE_TYPE

# 수집 범위 (에반스 공연 크롤러와 동일한 기준)
MONTHS_BACK = 1       # 이번 달 기준 몇 달 전까지
MONTHS_FORWARD = 1    # 이번 달 기준 몇 달 후까지

# 멤버 API 연속 호출 사이에 쉬는 시간(초)
REQUEST_DELAY = 0.2

# 브라우저인 척하는 User-Agent 헤더
HEADERS = {"User-Agent": "Mozilla/5.0"}

# 공연자가 아직 정해지지 않은 일정의 표시값 → 공연으로 저장하지 않는다
UNDECIDED_NAMES = {"미정", "테스터"}

# ==================== 팀 멤버 조회 함수 ====================

def fetch_team_members(entry):
    """
    TEAM 공연 1개의 멤버(활동명) 목록을 API로 조회하는 함수.

    입력값: entry = 스케줄 API가 준 공연 항목 딕셔너리
    반환값: 활동명 문자열 리스트 (조회 실패 시 빈 리스트)
    """

    # 공연을 특정하는 값들 (날짜 + 몇 번째 무대 + 팀명)
    body = {
        'yyyy': entry['yyyy'], 'mm': entry['mm'], 'dd': entry['dd'],
        'bu': entry['bu'], 'teamname': entry['nickname'],
    }

    try:
        response = requests.post(MEMBERS_API_URL, json=body, headers=HEADERS, timeout=20)
        if response.status_code != 200:
            return []

        # 응답: [{'nickname': '이종원', 'isleader': 1, ...}, ...] → 활동명만 뽑는다
        return [m.get('nickname', '').strip() for m in response.json() if m.get('nickname')]
    except Exception:
        return []

# ==================== 올댓재즈 공연 수집 함수 ====================

def collect_performances():
    """
    스케줄 API를 호출해 지난달~다음달 공연 정보 리스트를 만드는 함수.

    반환값: save_performances()가 요구하는 형태의 공연 딕셔너리 리스트
    """

    try:
        # 공연 일정 전체 목록 요청 (2022년부터 전부 온다)
        response = requests.get(SCHEDULE_API_URL, headers=HEADERS, timeout=30)
        if response.status_code != 200:
            print(f"✗ 올댓재즈 스케줄 API 요청 실패 (상태코드: {response.status_code})")
            return []
        entries = response.json()
    except Exception as e:
        print(f"✗ 올댓재즈 스케줄 API 호출 중 에러: {e}")
        return []

    print(f"✓ 스케줄 API에서 일정 {len(entries)}개 응답 받음")

    # 수집 대상 (연, 월) 집합: 지난달~다음달
    # (에반스 공연 크롤러와 같은 통산 월수 방식으로 연도 경계를 처리)
    today = date.today()
    months = set()
    for offset in range(-MONTHS_BACK, MONTHS_FORWARD + 1):
        total = (today.year * 12 + today.month - 1) + offset
        months.add((total // 12, total % 12 + 1))

    performances = []
    skipped = 0   # 공연자 미정 등으로 건너뛴 수 (출력용)

    for entry in entries:
        # 수집 범위 밖의 달이면 건너뜀
        if (entry['yyyy'], entry['mm']) not in months:
            continue

        # 공연 제목 = 팀명 또는 개인 활동명
        title = (entry.get('nickname') or '').strip()

        # 공연자가 미정이거나 비어 있으면 저장할 가치가 없으므로 건너뜀
        if not title or title in UNDECIDED_NAMES:
            skipped += 1
            continue

        # 시작 일시: 날짜(yyyy/mm/dd) + 시각(starthh/startmm)
        # int()로 감싸는 이유: API가 시각을 '18' 같은 문자열로 주기 때문
        start_time = datetime(
            entry['yyyy'], entry['mm'], entry['dd'],
            int(entry.get('starthh') or 0), int(entry.get('startmm') or 0)
        )

        # 라인업 구성 (TEAM과 ARTIST가 다르다)
        lineup = []
        if entry.get('usertype') == 'TEAM':
            # 팀 공연 → 멤버 API로 활동명 목록 조회.
            # 악기/인스타는 안 주지만, 멤버들은 대부분 뮤지션 크롤러가 이미
            # musician 테이블에 넣어둔 사람들이라 활동명만으로 id 매칭이 된다.
            for member_name in fetch_team_members(entry):
                lineup.append({'stageName': member_name, 'position': None, 'snsUrl': None})

            # 멤버 API 연속 호출 사이에 잠깐 쉼
            time.sleep(REQUEST_DELAY)
        else:
            # 개인(ARTIST) 공연 → 그 사람 혼자가 라인업.
            # 스케줄 항목에 악기/인스타가 같이 오므로 그대로 쓴다
            lineup.append({
                'stageName': title,
                'position': (entry.get('instruments') or '').strip() or None,
                'snsUrl': crawl_allthatjazz.normalize_instagram(entry.get('instagram')),
            })

        # 공연 1개를 save_performances()가 요구하는 딕셔너리로 정리
        performances.append({
            'startTime': start_time,
            'title': title,
            'genre': None,                                  # 올댓재즈는 장르 정보 없음
            'setInfo': (entry.get('timeplan') or '').strip() or None,   # 예: '20:30 - 23:00'
            'setList': None,                                # 셋리스트 정보 없음
            'sourceUrl': "https://allthatjazz.kr/schedule", # 개별 공연 페이지가 없어 스케줄 페이지로
            'lineup': lineup,
        })

    print(f"✓ 공연 {len(performances)}개 수집 완료 (범위: 지난달~다음달, 미정 등 건너뜀: {skipped}개)")
    return performances

# ==================== 메인 실행 함수 ====================

def main():
    """
    올댓재즈 공연 크롤러의 메인 실행 함수.

    동작:
      1. 스케줄 API에서 지난달~다음달 공연/라인업 수집
      2. DB 연결
      3. 공용 모듈로 저장 (공연 INSERT + 라인업 연결 / 중복 스킵)
    """

    # 시작 메시지
    print("\n" + "=" * 60)
    print("🎭 올댓재즈 공연 크롤러 시작")
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
    print("✓ 올댓재즈 공연 크롤러 실행 완료\n")

# ==================== 프로그램 실행 ====================

# 이 파일을 직접 실행할 때만 main()을 호출한다.
if __name__ == "__main__":
    main()
