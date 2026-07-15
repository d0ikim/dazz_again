# ==================== 프로젝트 설명 ====================
# 이 파일의 목적: '전국의 재즈바/재즈클럽/재즈카페' 정보를 수집해서 venue 테이블에 INSERT하는 크롤러
# (처음엔 서울 전용이었지만, 지역 설정표(REGIONS)를 도입해서 전국으로 확장함)
#
# 사용하는 API 2가지:
# 1. Kakao Local API (키워드 검색) → 이름, 주소, 좌표 수집 (메인 소스)
# 2. Naver 지역검색 API → 홈페이지/인스타그램 URL 보완 (보조 소스)
#    (네이버 API 키가 .env에 없으면 이 단계는 자동으로 건너뜀)
#
# 동작 흐름:
# 1. REGIONS 설정표의 지역/동네마다 "홍대 재즈바", "부산 재즈클럽" 같은 검색어를 만들어 Kakao에 검색
# 2. 검색 결과에서 해당 지역 소재 + 재즈 관련 가게만 골라냄 (필터링)
# 3. 같은 가게가 여러 키워드에서 중복 검색되므로 카카오 장소ID로 중복 제거
# 4. 각 가게 이름을 Naver 지역검색 API로 검색 → 홈페이지 URL 있으면 추가
# 5. venue 테이블에 이미 같은 이름이 있으면 스킵, 없으면 INSERT
#    → 이미 저장된 서울 가게들은 자동으로 스킵되므로, 다시 실행해도 안전하다 (멱등성)
# =====================================================

# ==================== 라이브러리 Import (외부 코드 불러오기) ====================

# PostgreSQL 데이터베이스에 연결하기 위한 라이브러리
import psycopg2

# .env 파일에서 환경변수를 읽기 위한 라이브러리
from dotenv import load_dotenv

# 운영체제 환경변수와 파일 경로 다루기 위한 라이브러리
import os

# 파일 경로를 쉽게 다루기 위한 라이브러리
from pathlib import Path

# HTTP 요청을 보내고 응답을 받기 위한 라이브러리 (Kakao/Naver API 호출용)
import requests

# API 호출 사이에 잠깐 쉬기 위한 라이브러리 (호출 제한 방지)
import time

# 문자열에서 HTML 태그(<b> 등)를 제거할 때 쓰는 정규표현식 라이브러리
import re

# ==================== 환경변수 로드 (설정 파일에서 정보 읽기) ====================

# backend/.env 파일에서 DB 접속 정보를 읽기
# 이 파일은 crawler/venue/ 안에 있으므로 프로젝트 루트까지 세 단계 올라가야 한다.
# Path(__file__).parent               = venue 폴더
# Path(__file__).parent.parent        = crawler 폴더
# Path(__file__).parent.parent.parent = 프로젝트 루트
backend_env_path = Path(__file__).parent.parent.parent / 'backend' / '.env'
load_dotenv(backend_env_path)

# crawler/.env 파일에서 API 키들을 읽기 (한 단계 위인 crawler 폴더에 있음)
crawler_env_path = Path(__file__).parent.parent / '.env'
load_dotenv(crawler_env_path)

# backend/.env에서 읽은 값들
DB_USER = os.getenv('DB_USER')           # PostgreSQL 유저명
DB_PASSWORD = os.getenv('DB_PASSWORD')   # PostgreSQL 비밀번호
DB_DATABASE = os.getenv('DB_DATABASE')   # PostgreSQL 데이터베이스명

# crawler/.env에서 읽은 값들
KAKAO_LOCAL_API_KEY = os.getenv('KAKAO_LOCAL_API_KEY')  # Kakao Local API 키

# 네이버 지역검색 API 키 (없으면 None이 들어감 → 네이버 단계 건너뜀)
NAVER_CLIENT_ID = os.getenv('NAVER_CLIENT_ID')          # 네이버 앱 Client ID
NAVER_CLIENT_SECRET = os.getenv('NAVER_CLIENT_SECRET')  # 네이버 앱 Client Secret

# PostgreSQL 서버 주소/포트도 환경변수에서 읽기
# os.getenv('DB_HOST', 'localhost') = DB_HOST 환경변수가 있으면 그 값, 없으면 'localhost'
# → backend/.env에 DB_HOST를 Render 주소로 넣으면 크롤러도 자동으로 Render DB에 연결됨
DB_HOST = os.getenv('DB_HOST', 'localhost')   # PostgreSQL 서버 주소
DB_PORT = os.getenv('DB_PORT', '5432')        # PostgreSQL 포트 번호

# ==================== 지역별 검색 설정 (전국) ====================

# 가게 종류 검색어 접미사.
# 동네 이름 뒤에 하나씩 붙여서 검색어를 만든다 (예: "홍대" + "재즈바" → "홍대 재즈바")
# "재즈 라이브"는 상호에 '재즈바'가 안 들어가는 라이브 공연 가게를 잡기 위한 보조 검색어
VENUE_TYPES = ["재즈바", "재즈클럽", "재즈카페", "재즈 라이브"]

# 지역 설정표: (주소 접두어, 검색할 동네/도시 이름 목록) 튜플의 리스트
#
# - 주소 접두어: 카카오가 돌려준 가게 주소가 이 문자열로 시작해야만 수집한다.
#   검색어에 동네 이름을 넣어도 카카오가 가끔 다른 지역 가게를 섞어서 주기 때문에
#   "부산에서 검색했는데 서울 가게가 나오는" 노이즈를 이 접두어 검사로 차단한다.
#   ※ 카카오 주소는 "부산 해운대구 ...", "경기 성남시 ..." 처럼 시/도 약칭으로 시작한다.
#     "강원특별자치도", "전북특별자치도", "제주특별자치도"처럼 전체 명칭으로 와도
#     startswith("강원") 검사는 똑같이 통과하므로 짧은 접두어 하나면 충분하다.
#   ※ "광주" 접두어는 광주광역시만 매칭된다 (경기도 광주시 주소는 "경기 광주시"로 시작).
#
# - 동네/도시 목록: 재즈바가 몰려 있는 동네 위주로 고른다.
#   Kakao 키워드 검색은 키워드 하나당 최대 45개(15개 × 3페이지)만 반환하므로
#   광역 이름 하나로 검색하는 것보다 동네별로 쪼개서 검색해야 최대한 많이 수집된다.
REGIONS = [
    # 서울 (기존에 수집한 지역 — 다시 실행해도 중복은 자동 스킵됨)
    ("서울", ["서울", "홍대", "연남동", "이태원", "한남동", "강남", "압구정", "성수",
              "종로", "을지로", "서촌", "해방촌", "용산", "신촌", "대학로", "여의도", "잠실"]),
    # 광역시
    ("부산", ["부산", "해운대", "광안리", "서면", "전포동", "남포동"]),
    ("인천", ["인천", "송도", "부평", "구월동"]),
    ("대구", ["대구", "동성로", "수성구"]),
    ("대전", ["대전", "둔산동", "유성"]),
    ("광주", ["광주", "동명동", "상무지구"]),
    ("울산", ["울산"]),
    ("세종", ["세종"]),
    # 도 단위 (주요 도시별로 검색)
    ("경기", ["수원", "성남", "분당", "판교", "일산", "용인", "안양", "부천", "파주", "의정부", "하남"]),
    ("강원", ["춘천", "강릉", "속초", "원주", "양양", "동해", "삼척", "홍천", "평창"]),
    ("충북", ["청주", "충주"]),
    ("충남", ["천안", "아산"]),
    ("전북", ["전주", "군산", "익산"]),
    ("전남", ["여수", "순천", "목포"]),
    ("경북", ["포항", "경주", "구미", "안동"]),
    ("경남", ["창원", "김해", "진주", "통영", "거제"]),
    ("제주", ["제주", "애월", "서귀포"]),
]

# ==================== 데이터베이스 연결 함수 ====================

def connect_db():
    """
    PostgreSQL 데이터베이스에 연결하는 함수

    반환값: 데이터베이스 연결 객체 (이후 쿼리 실행에 사용)
    """
    try:
        # PostgreSQL 데이터베이스에 연결 시도
        connection = psycopg2.connect(
            host=DB_HOST,              # 연결할 서버 주소
            port=DB_PORT,              # 포트 번호
            database=DB_DATABASE,      # 데이터베이스명
            user=DB_USER,              # 유저명
            password=DB_PASSWORD       # 비밀번호
        )
        print("✓ 데이터베이스 연결 성공")
        return connection
    except Exception as e:
        # 연결 실패 시 에러 메시지 출력
        print(f"✗ 데이터베이스 연결 실패: {e}")
        return None

# ==================== Kakao 키워드 검색 함수 (1페이지 분량) ====================

def search_kakao_page(keyword, page):
    """
    Kakao Local API '키워드 검색'으로 한 페이지(최대 15개)의 장소를 가져오는 함수

    입력값:
      - keyword = 검색어 (예: "홍대 재즈바")
      - page = 페이지 번호 (1~3, Kakao는 키워드당 최대 45개까지만 제공)
    반환값: (장소 리스트, 마지막 페이지 여부) 튜플
    """

    # Kakao Local API 엔드포인트 (키워드로 장소 검색)
    url = "https://dapi.kakao.com/v2/local/search/keyword.json"

    # 인증을 위한 API 키를 담은 헤더
    headers = {
        "Authorization": f"KakaoAK {KAKAO_LOCAL_API_KEY}"
    }

    # API 요청에 전달할 파라미터
    params = {
        "query": keyword,   # 검색어
        "page": page,       # 페이지 번호
        "size": 15          # 한 페이지당 결과 개수 (최대 15)
    }

    try:
        # Kakao API에 HTTP GET 요청 전송
        response = requests.get(url, headers=headers, params=params)

        # 요청이 성공했는지 확인 (상태코드 200 = 성공)
        if response.status_code == 200:
            # 응답 데이터를 JSON으로 파싱 (문자열 → 파이썬 딕셔너리)
            data = response.json()

            # documents = 검색된 장소 리스트
            # meta.is_end = 마지막 페이지인지 여부 (True면 다음 페이지 없음)
            return (data['documents'], data['meta']['is_end'])
        else:
            # API 요청 실패 → 빈 결과 + 종료 신호 반환
            print(f"  ✗ Kakao API 요청 실패 (상태코드: {response.status_code})")
            return ([], True)

    except Exception as e:
        # 요청 중 예외 발생 → 빈 결과 + 종료 신호 반환
        print(f"  ✗ Kakao API 호출 중 에러: {e}")
        return ([], True)

# ==================== 재즈바 여부 판단 함수 (필터링) ====================

def is_region_jazzbar(place, region_prefix):
    """
    Kakao 검색 결과 하나가 '해당 지역의 재즈바'가 맞는지 판단하는 함수
    (키워드 검색에 미용실 "째즈헤어" 같은 엉뚱한 가게도 섞여 나오므로 걸러내야 함)

    조건 1: 주소가 지역 접두어(예: "서울", "부산", "경기")로 시작해야 함
    조건 2: 카테고리 대분류가 "음식점" 또는 "문화,예술"이어야 함
            (실제 재즈바는 칵테일바/호프/라이브카페/공연장 등으로 분류되어 있어서
             "이름에 재즈 포함" 같은 조건을 걸면 유명 재즈바가 다 걸러짐.
             검색어 자체에 "재즈"가 있으니 카카오가 이미 연관성을 보장해줌)

    입력값:
      - place = Kakao 검색 결과 딕셔너리 (장소 1개)
      - region_prefix = 주소가 시작해야 하는 지역 접두어 (REGIONS 설정표의 첫 번째 값)
    반환값: True(재즈바 맞음) / False(아님)
    """

    # 도로명 주소를 우선 사용, 없으면 지번 주소 사용
    address = place['road_address_name'] or place['address_name']

    # 조건 1: 검색 중인 지역 소재인지 확인 (다른 지역 노이즈 차단)
    if not address.startswith(region_prefix):
        return False

    # 카테고리 예시: "음식점 > 술집 > 칵테일바", "문화,예술 > 문화시설 > 공연장"
    category = place['category_name']

    # 조건 2: 음식점(술집/카페 포함) 또는 문화예술(공연장/음악감상실) 계열만 허용
    # → 미용실, 학원, 화장품 매장 같은 노이즈를 차단
    if category.startswith("음식점") or category.startswith("문화,예술"):
        return True

    # 두 조건을 만족하지 못하면 재즈바가 아니라고 판단
    return False

# ==================== Kakao로 전국 재즈바 전체 수집 함수 ====================

def collect_jazzbars_from_kakao():
    """
    REGIONS 설정표의 모든 지역을 돌면서
    동네 이름 × 가게 종류(VENUE_TYPES) 조합으로 검색어를 만들어 Kakao에 검색하고,
    전국의 재즈바 목록을 만드는 함수

    같은 가게가 여러 키워드에서 중복으로 나오므로
    카카오 장소 ID(고유번호)를 이용해 중복을 제거한다

    반환값: 재즈바 정보 딕셔너리 리스트
            [{'name': ..., 'location': ..., 'latitude': ..., 'longitude': ...}, ...]
    """

    # 이미 수집한 카카오 장소 ID를 기억하는 집합(set) → 중복 제거용
    seen_place_ids = set()

    # 수집한 재즈바 정보를 담을 리스트
    jazzbars = []

    # 지역을 하나씩 처리 (region_prefix = 주소 접두어, areas = 동네 이름 목록)
    for region_prefix, areas in REGIONS:
        print(f"\n{'='*40}")
        print(f"📍 지역: {region_prefix}")
        print(f"{'='*40}")

        # 동네 이름과 가게 종류를 조합해 검색어 목록 생성
        # 예: areas=["해운대"], VENUE_TYPES=["재즈바", ...] → "해운대 재즈바", "해운대 재즈클럽", ...
        keywords = [f"{area} {venue_type}" for area in areas for venue_type in VENUE_TYPES]

        # 키워드를 하나씩 검색
        for keyword in keywords:
            print(f"\n🔍 키워드 검색: '{keyword}'")

            # Kakao는 키워드당 최대 3페이지(45개)까지 제공
            for page in range(1, 4):
                # 한 페이지 검색 실행
                places, is_end = search_kakao_page(keyword, page)

                # 검색 결과를 하나씩 확인
                for place in places:
                    # 이미 수집한 가게면 건너뜀 (중복 제거)
                    if place['id'] in seen_place_ids:
                        continue

                    # 수집 여부와 관계없이 ID는 기록 (다음에 또 검사 안 하도록)
                    seen_place_ids.add(place['id'])

                    # 지금 검색 중인 지역의 재즈바가 아니면 건너뜀 (필터링)
                    if not is_region_jazzbar(place, region_prefix):
                        continue

                    # 도로명 주소 우선, 없으면 지번 주소
                    address = place['road_address_name'] or place['address_name']

                    # 재즈바 정보를 딕셔너리로 정리해서 리스트에 추가
                    jazzbars.append({
                        'name': place['place_name'],        # 가게 이름
                        'location': address,                # 주소
                        'latitude': float(place['y']),      # 위도 (y = 위도)
                        'longitude': float(place['x']),     # 경도 (x = 경도)
                        'homepage_url': None,               # 홈페이지 (네이버로 나중에 보완)
                        'instagram_url': None,              # 인스타그램 (네이버로 나중에 보완)
                    })
                    print(f"  + {place['place_name']} ({address})")

                # 마지막 페이지면 다음 페이지 요청하지 않음
                if is_end:
                    break

                # Kakao API 호출 제한 방지 (호출 간 0.3초 대기)
                time.sleep(0.3)

    return jazzbars

# ==================== Naver 지역검색으로 홈페이지 URL 보완 함수 ====================

def enrich_with_naver(jazzbar):
    """
    가게 이름을 Naver 지역검색 API로 검색해서
    홈페이지 URL(link)이 있으면 jazzbar 딕셔너리에 채워 넣는 함수

    링크가 인스타그램 주소면 instagram_url에,
    아니면 homepage_url에 저장한다

    입력값: jazzbar = 재즈바 정보 딕셔너리 (이 함수가 내용을 직접 수정함)
    반환값: 없음
    """

    # Naver 지역검색 API 엔드포인트
    url = "https://openapi.naver.com/v1/search/local.json"

    # 네이버 API 인증 헤더 (Kakao와 헤더 형식이 다름)
    headers = {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    }

    # 검색어 = 가게 이름 (display=5 → 최대 5개 결과)
    params = {
        "query": jazzbar['name'],
        "display": 5
    }

    try:
        # Naver API에 HTTP GET 요청 전송
        response = requests.get(url, headers=headers, params=params)

        # 요청 실패 시 그냥 종료 (URL 보완은 실패해도 치명적이지 않음)
        if response.status_code != 200:
            return

        # 응답 데이터를 JSON으로 파싱
        data = response.json()

        # 검색 결과(items)를 하나씩 확인
        for item in data.get('items', []):
            # 네이버는 제목에 <b>태그를 붙여서 반환함 (예: "<b>재즈</b>바")
            # 정규표현식으로 HTML 태그를 모두 제거
            naver_name = re.sub(r'<[^>]+>', '', item['title'])

            # 이름 비교용 정규화: 공백 제거 + 소문자 변환
            # (예: "Blue Note Seoul" vs "블루노트서울" 같은 표기 차이 대비)
            kakao_normalized = jazzbar['name'].replace(" ", "").lower()
            naver_normalized = naver_name.replace(" ", "").lower()

            # 두 이름 중 하나가 다른 하나에 포함되면 같은 가게로 판단
            if kakao_normalized in naver_normalized or naver_normalized in kakao_normalized:
                # link = 가게의 홈페이지 URL (없으면 빈 문자열)
                link = item.get('link', '')

                if link:
                    # 링크가 인스타그램 주소면 instagram_url에 저장
                    if 'instagram.com' in link:
                        jazzbar['instagram_url'] = link
                        print(f"  ✓ {jazzbar['name']} → 인스타그램 발견")
                    else:
                        # 그 외에는 홈페이지 URL로 저장
                        jazzbar['homepage_url'] = link
                        print(f"  ✓ {jazzbar['name']} → 홈페이지 발견")

                # 같은 가게를 찾았으므로 더 이상 확인하지 않음
                return

    except Exception:
        # 네이버 보완은 실패해도 크롤링 전체를 멈추지 않음
        return

# ==================== venue 테이블의 기존 가게 이름 조회 함수 ====================

def get_existing_venue_names(connection):
    """
    venue 테이블에 이미 저장된 모든 가게 이름을 조회하는 함수
    (중복 INSERT를 막기 위해 사용)

    입력값: connection = 데이터베이스 연결 객체
    반환값: 기존 가게 이름 집합(set) — 검색이 빠른 자료구조
    """

    try:
        # 데이터베이스 커서 생성 (쿼리 실행을 위한 객체)
        cursor = connection.cursor()

        # SQL 쿼리: venue 테이블의 모든 이름 조회
        cursor.execute("SELECT name FROM venue;")

        # 결과를 집합(set)으로 변환
        # row[0] = 각 행의 첫 번째 컬럼(name)
        names = {row[0] for row in cursor.fetchall()}

        # 커서 종료 (자원 해제)
        cursor.close()

        return names

    except Exception as e:
        # 조회 실패 시 에러 출력 후 빈 집합 반환
        print(f"✗ 기존 venue 조회 실패: {e}")
        return set()

# ==================== venue 테이블 INSERT 함수 ====================

def insert_venue(connection, jazzbar):
    """
    재즈바 1개를 venue 테이블에 INSERT하는 함수

    입력값:
      - connection = 데이터베이스 연결 객체
      - jazzbar = 재즈바 정보 딕셔너리
    반환값: 성공 여부 (True/False)
    """

    try:
        # 데이터베이스 커서 생성
        cursor = connection.cursor()

        # SQL 쿼리: venue 테이블에 새 행 추가
        # 컬럼명은 JPA가 만든 스네이크케이스 규칙을 따름 (instagramUrl → instagram_url)
        # %s는 SQL Injection 방지를 위한 안전한 파라미터 플레이스홀더
        query = """
            INSERT INTO venue (name, location, latitude, longitude, instagram_url, homepage_url)
            VALUES (%s, %s, %s, %s, %s, %s);
        """

        # 쿼리 실행 (딕셔너리에서 값을 꺼내 순서대로 전달)
        cursor.execute(query, (
            jazzbar['name'],
            jazzbar['location'],
            jazzbar['latitude'],
            jazzbar['longitude'],
            jazzbar['instagram_url'],
            jazzbar['homepage_url'],
        ))

        # 변경사항을 데이터베이스에 저장 (COMMIT)
        connection.commit()

        # 커서 종료
        cursor.close()

        return True

    except Exception as e:
        # INSERT 실패 시 에러 메시지 출력
        print(f"  ✗ '{jazzbar['name']}' INSERT 실패: {e}")
        # 트랜잭션 롤백 (변경사항 취소)
        connection.rollback()
        return False

# ==================== 메인 실행 함수 ====================

def main():
    """
    크롤러의 메인 실행 함수

    동작:
    1. Kakao 키워드 검색으로 전국 재즈바 수집 (REGIONS 설정표 기준)
    2. (네이버 키가 있으면) 홈페이지/인스타 URL 보완
    3. 데이터베이스 연결
    4. 기존 venue와 이름이 겹치지 않는 가게만 INSERT
    5. 결과 요약 출력
    """

    # 시작 메시지 출력
    print("\n" + "="*60)
    print("🚀 전국 재즈바 크롤러 시작")
    print("="*60)

    # 1. Kakao 키워드 검색으로 재즈바 수집
    jazzbars = collect_jazzbars_from_kakao()
    print(f"\n✓ Kakao에서 재즈바 {len(jazzbars)}개 수집 완료")

    # 수집 결과가 없으면 종료
    if len(jazzbars) == 0:
        print("수집된 재즈바가 없어 프로그램 종료")
        return

    # 2. 네이버 지역검색으로 URL 보완 (키가 설정된 경우에만)
    if NAVER_CLIENT_ID and NAVER_CLIENT_SECRET:
        print("\n🔗 Naver 지역검색으로 홈페이지/인스타 URL 보완 중...")
        for jazzbar in jazzbars:
            enrich_with_naver(jazzbar)
            # Naver API 호출 제한 방지 (호출 간 0.15초 대기)
            time.sleep(0.15)
    else:
        # 키가 없으면 이 단계를 건너뛰고 안내만 출력
        print("\n⚠ NAVER_CLIENT_ID/SECRET이 없어 URL 보완 단계를 건너뜁니다")

    # 3. 데이터베이스 연결
    print()
    connection = connect_db()

    # 연결 실패 시 프로그램 종료
    if connection is None:
        print("데이터베이스 연결 실패로 프로그램 종료")
        return

    # 4. 기존 venue 이름 조회 (중복 INSERT 방지용)
    existing_names = get_existing_venue_names(connection)
    print(f"✓ 기존 venue {len(existing_names)}개 확인\n")

    # INSERT 결과 집계용 변수
    insert_count = 0   # 새로 추가된 개수
    skip_count = 0     # 중복으로 건너뛴 개수
    fail_count = 0     # INSERT 실패 개수

    # 5. 재즈바를 하나씩 INSERT (중복이면 스킵)
    for idx, jazzbar in enumerate(jazzbars, 1):
        # 이미 같은 이름이 venue 테이블에 있으면 건너뜀
        if jazzbar['name'] in existing_names:
            print(f"[{idx}/{len(jazzbars)}] ⏭ 스킵 (이미 존재): {jazzbar['name']}")
            skip_count += 1
            continue

        # venue 테이블에 INSERT 실행
        if insert_venue(connection, jazzbar):
            print(f"[{idx}/{len(jazzbars)}] ✓ 추가: {jazzbar['name']}")
            insert_count += 1
            # 방금 넣은 이름도 기존 목록에 추가
            # (크롤링 결과 안에서 같은 이름이 또 나와도 중복 INSERT 방지)
            existing_names.add(jazzbar['name'])
        else:
            fail_count += 1

    # 결과 요약 출력
    print("\n" + "="*60)
    print(f"✓ 새로 추가: {insert_count}개")
    print(f"⏭ 중복 스킵: {skip_count}개")
    print(f"✗ 실패: {fail_count}개")
    print("="*60 + "\n")

    # 데이터베이스 연결 종료
    connection.close()
    print("✓ 데이터베이스 연결 종료")
    print("✓ 크롤러 실행 완료\n")

# ==================== 프로그램 실행 ====================

# 이 파일이 직접 실행될 때만 main() 함수 호출
# (다른 파일에서 import 될 때는 실행 안 함)
if __name__ == "__main__":
    main()
