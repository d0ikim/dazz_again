# ==================== 프로젝트 설명 ====================
# 이 파일의 목적: 기존 venue(공연장) 테이블의 location(주소) 데이터를 이용해
#                latitude(위도), longitude(경도) 좌표를 조회하고
#                DB에 저장하는 크롤러
#
# 동작 흐름:
# 1. PostgreSQL 데이터베이스 연결
# 2. venue 테이블에서 모든 공연장 조회
# 3. 각 공연장의 location(주소)을 Kakao Local API로 보냄
# 4. 응답받은 좌표(위도, 경도) 파싱
# 5. venue 테이블 UPDATE (좌표 저장)
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

# HTTP 요청을 보내고 응답을 받기 위한 라이브러리
# (Kakao Local API를 호출할 때 사용)
import requests

# JSON 형식의 데이터를 파이썬 딕셔너리로 변환하기 위한 라이브러리
import json

# 시간 관련 작업을 위한 라이브러리 (진행 상황 출력 등에 사용)
import time

# ==================== 환경변수 로드 (설정 파일에서 정보 읽기) ====================

# backend/.env 파일에서 DB 접속 정보를 읽기
# Path().parent.parent = 크롤러 폴더의 상위 상위 = 프로젝트 루트
# 프로젝트 루트/backend/.env 경로
backend_env_path = Path(__file__).parent.parent / 'backend' / '.env'

# .env 파일을 로드하여 환경변수 설정
load_dotenv(backend_env_path)

# crawler/.env 파일에서 Kakao API 키를 읽기
crawler_env_path = Path(__file__).parent / '.env'
load_dotenv(crawler_env_path)

# 환경변수에서 값 추출
# backend/.env에서 읽은 값들
DB_USER = os.getenv('DB_USER')           # PostgreSQL 유저명
DB_PASSWORD = os.getenv('DB_PASSWORD')   # PostgreSQL 비밀번호
DB_DATABASE = os.getenv('DB_DATABASE')   # PostgreSQL 데이터베이스명

# crawler/.env에서 읽은 값들
KAKAO_LOCAL_API_KEY = os.getenv('KAKAO_LOCAL_API_KEY')  # Kakao Local API 키

# PostgreSQL 서버 주소/포트도 환경변수에서 읽기
# os.getenv('DB_HOST', 'localhost') = DB_HOST 환경변수가 있으면 그 값, 없으면 'localhost'
# → backend/.env에 DB_HOST를 Render 주소로 넣으면 크롤러도 자동으로 Render DB에 연결됨
DB_HOST = os.getenv('DB_HOST', 'localhost')   # PostgreSQL 서버 주소
DB_PORT = os.getenv('DB_PORT', '5432')        # PostgreSQL 포트 번호

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

# ==================== Kakao Local API를 이용한 지오코딩 함수 ====================

def get_coordinates_by_address(location_text):
    """
    주소(location_text) → 좌표(위도, 경도) 변환하는 함수
    Kakao Local API의 '주소 검색' 엔드포인트 사용

    입력값: location_text = 주소 문자열 (예: "서울시 마포구 홍대로 123")
    반환값: (위도, 경도) 튜플 또는 None (실패 시)
    """

    # Kakao Local API 엔드포인트 (주소로 좌표 검색)
    url = "https://dapi.kakao.com/v2/local/search/address.json"

    # HTTP 요청에 포함할 헤더 정보
    headers = {
        # 인증을 위한 API 키 전송
        "Authorization": f"KakaoAK {KAKAO_LOCAL_API_KEY}"
    }

    # API 요청에 전달할 파라미터 (주소)
    params = {
        "query": location_text  # 검색할 주소
    }

    try:
        # Kakao API에 HTTP GET 요청 전송
        response = requests.get(url, headers=headers, params=params)

        # 요청이 성공했는지 확인 (상태코드 200 = 성공)
        if response.status_code == 200:
            # 응답 데이터를 JSON으로 파싱 (문자열 → 파이썬 딕셔너리)
            data = response.json()

            # 응답 데이터에 결과가 있는지 확인
            if data['documents'] and len(data['documents']) > 0:
                # 첫 번째 검색 결과 가져오기
                result = data['documents'][0]

                # 위도와 경도 추출 (문자열 → 부동소수점 숫자로 변환)
                latitude = float(result['y'])   # y = 위도
                longitude = float(result['x'])  # x = 경도

                # (위도, 경도) 튜플 반환
                return (latitude, longitude)
            else:
                # 검색 결과가 없음
                return None
        else:
            # API 요청 실패 (상태코드 200이 아님)
            return None

    except Exception:
        # 요청 중 예외 발생
        return None

# ==================== Kakao Local API를 이용한 키워드 검색 함수 ====================

def get_coordinates_by_keyword(venue_name):
    """
    공연장 이름(venue_name) → 좌표(위도, 경도) 변환하는 함수
    Kakao Local API의 '키워드 검색' 엔드포인트 사용
    주소 검색이 실패했을 때 사용하는 백업 검색 방법

    입력값: venue_name = 공연장 이름 (예: "블루노트 서울")
    반환값: (위도, 경도) 튜플 또는 None (실패 시)
    """

    # Kakao Local API 엔드포인트 (키워드로 장소 검색)
    url = "https://dapi.kakao.com/v2/local/search/keyword.json"

    # HTTP 요청에 포함할 헤더 정보
    headers = {
        # 인증을 위한 API 키 전송
        "Authorization": f"KakaoAK {KAKAO_LOCAL_API_KEY}"
    }

    # API 요청에 전달할 파라미터 (공연장 이름)
    params = {
        "query": venue_name  # 검색할 공연장 이름
    }

    try:
        # Kakao API에 HTTP GET 요청 전송
        response = requests.get(url, headers=headers, params=params)

        # 요청이 성공했는지 확인 (상태코드 200 = 성공)
        if response.status_code == 200:
            # 응답 데이터를 JSON으로 파싱
            data = response.json()

            # 응답 데이터에 결과가 있는지 확인
            if data['documents'] and len(data['documents']) > 0:
                # 첫 번째 검색 결과 가져오기
                result = data['documents'][0]

                # 위도와 경도 추출
                latitude = float(result['y'])   # y = 위도
                longitude = float(result['x'])  # x = 경도

                # (위도, 경도) 튜플 반환
                return (latitude, longitude)
            else:
                # 검색 결과가 없음
                return None
        else:
            # API 요청 실패
            return None

    except Exception:
        # 요청 중 예외 발생
        return None

# ==================== 통합 지오코딩 함수 (주소 → 키워드 순서로 시도) ====================

def get_coordinates(location_text, venue_name):
    """
    좌표를 조회하는 통합 함수
    1단계: 주소로 검색 시도
    2단계: 실패하면 공연장 이름으로 검색

    입력값:
      - location_text = 주소 문자열
      - venue_name = 공연장 이름
    반환값: (위도, 경도) 튜플 또는 None (모두 실패 시)
    """

    # 1단계: 주소로 검색 시도
    coordinates = get_coordinates_by_address(location_text)

    if coordinates:
        # 주소 검색 성공
        latitude, longitude = coordinates
        print(f"  ✓ '{location_text}' → 위도: {latitude}, 경도: {longitude}")
        return coordinates
    else:
        # 주소 검색 실패 → 이름으로 재검색
        coordinates = get_coordinates_by_keyword(venue_name)

        if coordinates:
            # 이름 검색 성공
            latitude, longitude = coordinates
            print(f"  ✓ (이름 검색) '{venue_name}' → 위도: {latitude}, 경도: {longitude}")
            return coordinates
        else:
            # 둘 다 실패
            print(f"  ✗ '{location_text}' → 검색 결과 없음 (주소/이름 모두 시도)")
            return None

# ==================== venue 테이블에서 좌표 없는 데이터 조회 함수 ====================

def get_venues_without_coordinates(connection):
    """
    PostgreSQL의 venue 테이블에서 좌표가 없는 공연장을 조회하는 함수
    (latitude와 longitude가 NULL인 행)

    입력값: connection = 데이터베이스 연결 객체
    반환값: 공연장 정보 리스트 [(id, name, location), ...]
    """

    try:
        # 데이터베이스 커서 생성 (쿼리 실행을 위한 객체)
        cursor = connection.cursor()

        # SQL 쿼리: 좌표가 없는 모든 venue 조회
        # latitude IS NULL = 위도가 없는 행
        query = """
            SELECT id, name, location
            FROM venue
            WHERE latitude IS NULL OR longitude IS NULL
            ORDER BY id;
        """

        # 쿼리 실행
        cursor.execute(query)

        # 쿼리 결과 모두 가져오기
        venues = cursor.fetchall()

        # 커서 종료 (자원 해제)
        cursor.close()

        # 조회된 공연장 정보 반환
        return venues

    except Exception as e:
        # 쿼리 실행 중 에러 발생
        print(f"✗ venue 조회 실패: {e}")
        return []

# ==================== venue 테이블의 좌표 업데이트 함수 ====================

def update_venue_coordinates(connection, venue_id, latitude, longitude):
    """
    특정 venue(공연장)의 좌표를 데이터베이스에 저장하는 함수

    입력값:
      - connection = 데이터베이스 연결 객체
      - venue_id = 업데이트할 공연장의 ID
      - latitude = 위도
      - longitude = 경도

    반환값: 성공 여부 (True/False)
    """

    try:
        # 데이터베이스 커서 생성
        cursor = connection.cursor()

        # SQL 쿼리: venue 테이블 UPDATE
        # 지정한 venue_id의 latitude와 longitude 컬럼 값 변경
        query = """
            UPDATE venue
            SET latitude = %s, longitude = %s
            WHERE id = %s;
        """

        # 쿼리 실행 (파라미터: 위도, 경도, venue_id)
        # %s는 SQL Injection 방지를 위한 안전한 파라미터 플레이스홀더
        cursor.execute(query, (latitude, longitude, venue_id))

        # 변경사항을 데이터베이스에 저장 (COMMIT)
        connection.commit()

        # 커서 종료
        cursor.close()

        # 성공 반환
        return True

    except Exception as e:
        # 업데이트 실패 시 에러 메시지 출력
        print(f"  ✗ ID {venue_id} 업데이트 실패: {e}")
        # 트랜잭션 롤백 (변경사항 취소)
        connection.rollback()
        return False

# ==================== 메인 실행 함수 ====================

def main():
    """
    크롤러의 메인 실행 함수

    동작:
    1. 데이터베이스 연결
    2. 좌표 없는 venue 조회
    3. 각 venue의 주소로 지오코딩 실행
    4. 조회한 좌표를 데이터베이스에 업데이트
    5. 데이터베이스 연결 종료
    """

    # 시작 메시지 출력
    print("\n" + "="*60)
    print("🚀 venue 좌표 추가 크롤러 시작")
    print("="*60 + "\n")

    # 1. 데이터베이스 연결
    connection = connect_db()

    # 연결 실패 시 프로그램 종료
    if connection is None:
        print("데이터베이스 연결 실패로 프로그램 종료")
        return

    # 2. 좌표 없는 venue 조회
    print("\n📍 좌표 없는 공연장 조회 중...")
    venues = get_venues_without_coordinates(connection)

    # 조회 결과 출력
    if len(venues) == 0:
        print("✓ 좌표를 추가할 공연장이 없습니다.")
    else:
        print(f"✓ 좌표가 없는 공연장 {len(venues)}개 발견\n")

        # 3. 각 venue에 대해 지오코딩 수행 및 업데이트
        success_count = 0  # 성공한 업데이트 개수
        fail_count = 0     # 실패한 업데이트 개수

        # venues 리스트를 반복 (각 공연장별로 처리)
        for idx, (venue_id, name, location) in enumerate(venues, 1):
            # 처리 중인 공연장 정보 출력
            print(f"[{idx}/{len(venues)}] {name}")

            # Kakao API를 이용해 주소 → 좌표 변환 (또는 이름으로 검색)
            coordinates = get_coordinates(location, name)

            # 지오코딩 성공 시
            if coordinates:
                latitude, longitude = coordinates  # 튜플 분해

                # 데이터베이스에 좌표 저장
                if update_venue_coordinates(connection, venue_id, latitude, longitude):
                    success_count += 1  # 성공 개수 증가
                else:
                    fail_count += 1     # 실패 개수 증가
            else:
                # 지오코딩 실패
                fail_count += 1  # 실패 개수 증가

            # Kakao API 호출 제한 우회 (API 호출 간 지연)
            # Kakao API는 초당 요청 제한이 있으므로 일시 중지
            time.sleep(0.5)  # 0.5초 대기

        # 결과 요약 출력
        print("\n" + "="*60)
        print(f"✓ 성공: {success_count}개")
        print(f"✗ 실패: {fail_count}개")
        print("="*60 + "\n")

    # 4. 데이터베이스 연결 종료
    connection.close()
    print("✓ 데이터베이스 연결 종료")
    print("\n" + "="*60)
    print("✓ 크롤러 실행 완료")
    print("="*60 + "\n")

# ==================== 프로그램 실행 ====================

# 이 파일이 직접 실행될 때만 main() 함수 호출
# (다른 파일에서 import 될 때는 실행 안 함)
if __name__ == "__main__":
    main()
