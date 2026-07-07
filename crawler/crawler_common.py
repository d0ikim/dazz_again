# ==================== 이 파일의 목적 ====================
# 세 개의 재즈바 크롤러(클럽에반스/올댓재즈/부기우기)가 "공통으로" 쓰는 코드 모음.
#
# 각 크롤러는 사이트에서 뮤지션 목록을 뽑아내는 방식만 다르고,
# 그렇게 뽑은 뮤지션을 DB에 저장하는 과정은 완전히 똑같다.
# → 똑같은 코드를 3번 복사하지 않기 위해 여기 한 곳에 모아두고,
#   각 크롤러 파일이 이 파일을 import 해서 가져다 쓴다.
#
# 이 파일이 제공하는 것:
# 1. connect_db()                  → PostgreSQL에 연결
# 2. get_existing_musician_names() → 이미 저장된 뮤지션 활동명 목록 조회 (중복 방지용)
# 3. insert_musician()             → 뮤지션 1명을 musician 테이블에 INSERT
# 4. save_musicians()              → 뮤지션 리스트를 통째로 저장 (중복 스킵 + 결과 요약)
#
# ※ 이 파일은 직접 실행하지 않는다. 항상 크롤러 파일이 import 해서 사용한다.
# =====================================================

# ==================== 라이브러리 Import (외부 코드 불러오기) ====================

# PostgreSQL 데이터베이스에 연결하기 위한 라이브러리
import psycopg2

# .env 파일에서 환경변수를 읽기 위한 라이브러리
from dotenv import load_dotenv

# 운영체제 환경변수를 다루기 위한 라이브러리
import os

# 파일 경로를 쉽게 다루기 위한 라이브러리
from pathlib import Path

# ==================== 환경변수 로드 (설정 파일에서 DB 접속 정보 읽기) ====================

# backend/.env 파일에서 DB 접속 정보를 읽는다.
# Path(__file__).parent      = 이 파일(crawler_common.py)이 있는 crawler 폴더
# Path(__file__).parent.parent = 그 상위 = 프로젝트 루트
# → 루트 밑의 backend/.env 를 가리킨다.
backend_env_path = Path(__file__).parent.parent / 'backend' / '.env'
load_dotenv(backend_env_path)

# DB 접속에 필요한 값들을 환경변수에서 꺼낸다.
DB_USER = os.getenv('DB_USER')                 # PostgreSQL 유저명
DB_PASSWORD = os.getenv('DB_PASSWORD')         # PostgreSQL 비밀번호
DB_DATABASE = os.getenv('DB_DATABASE')         # PostgreSQL 데이터베이스명
DB_HOST = os.getenv('DB_HOST', 'localhost')    # 서버 주소 (없으면 localhost)
DB_PORT = os.getenv('DB_PORT', '5432')         # 포트 번호 (없으면 5432)

# ==================== 데이터베이스 연결 함수 ====================

def connect_db():
    """
    PostgreSQL 데이터베이스에 연결하는 함수.

    반환값: 연결 성공 시 연결 객체(connection), 실패 시 None
    """
    try:
        # 위에서 읽은 접속 정보로 PostgreSQL에 연결 시도
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
        # 연결 실패 시 에러 메시지 출력 후 None 반환
        print(f"✗ 데이터베이스 연결 실패: {e}")
        return None

# ==================== 기존 뮤지션 활동명 조회 함수 ====================

def get_existing_musician_names(connection):
    """
    musician 테이블에 이미 저장된 모든 활동명(stage_name)을 조회하는 함수.
    (같은 뮤지션을 두 번 INSERT하지 않기 위해 미리 확인용으로 쓴다)

    입력값: connection = 데이터베이스 연결 객체
    반환값: 활동명 집합(set) — 'in' 검사가 빠른 자료구조
    """
    try:
        # 쿼리를 실행할 커서 생성
        cursor = connection.cursor()

        # musician 테이블의 모든 활동명 조회
        cursor.execute("SELECT stage_name FROM musician;")

        # 결과의 각 행에서 첫 번째 컬럼(stage_name)만 꺼내 집합으로 만든다
        names = {row[0] for row in cursor.fetchall()}

        # 커서 종료 (자원 해제)
        cursor.close()

        return names
    except Exception as e:
        # 조회 실패 시 에러 출력 후 빈 집합 반환
        print(f"✗ 기존 musician 조회 실패: {e}")
        return set()

# ==================== 뮤지션 1명 INSERT 함수 ====================

def insert_musician(connection, musician):
    """
    뮤지션 1명을 musician 테이블에 INSERT하는 함수.

    입력값:
      - connection = 데이터베이스 연결 객체
      - musician   = 뮤지션 정보 딕셔너리. 아래 키를 가진다:
          stageName        : 활동명 (필수)
          realName         : 본명 (없으면 None)
          position         : 악기 (필수, 예: "PIANO")
          bio              : 소개 (없으면 None)
          snsUrl           : 인스타그램 URL (없으면 None)
          profileImageUrl  : 프로필 사진 URL (없으면 None)
          sourceType       : 출처 구분 (예: "CRAWLED_EVANS")
          sourceUrl        : 출처 URL (없으면 None)
    반환값: 성공 시 True, 실패 시 False
    """
    try:
        # 쿼리를 실행할 커서 생성
        cursor = connection.cursor()

        # musician 테이블에 새 행을 추가하는 SQL.
        # 컬럼명은 JPA가 만든 스네이크케이스 규칙을 따른다 (stageName → stage_name).
        # user_id는 넣지 않는다 → 크롤링 데이터는 특정 로그인 유저의 것이 아니므로 NULL로 둔다.
        # %s 는 SQL Injection을 막는 안전한 값 자리표시자다.
        query = """
            INSERT INTO musician
                (stage_name, real_name, position, bio, sns_url, profile_image_url, source_type, source_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
        """

        # 딕셔너리에서 값을 꺼내 SQL의 %s 순서대로 전달한다.
        cursor.execute(query, (
            musician['stageName'],
            musician['realName'],
            musician['position'],
            musician['bio'],
            musician['snsUrl'],
            musician['profileImageUrl'],
            musician['sourceType'],
            musician['sourceUrl'],
        ))

        # 변경사항을 실제 DB에 반영 (COMMIT)
        connection.commit()

        # 커서 종료
        cursor.close()

        return True
    except Exception as e:
        # INSERT 실패 시 에러 출력
        print(f"  ✗ '{musician['stageName']}' INSERT 실패: {e}")
        # 실패한 트랜잭션을 되돌린다 (다음 INSERT가 정상 동작하도록)
        connection.rollback()
        return False

# ==================== 뮤지션 리스트 통째로 저장 함수 ====================

def save_musicians(connection, musicians):
    """
    크롤러가 뽑아낸 뮤지션 리스트를 통째로 DB에 저장하는 함수.

    저장 규칙:
      - 이미 같은 활동명이 DB에 있으면 건너뛴다 (중복 방지).
      - 이번에 방금 넣은 활동명도 기억해서, 크롤링 결과 안에 같은 이름이
        또 나와도 중복 INSERT하지 않는다.

    입력값:
      - connection = 데이터베이스 연결 객체
      - musicians  = 뮤지션 정보 딕셔너리 리스트
    반환값: 없음 (결과를 화면에 요약 출력한다)
    """

    # DB에 이미 있는 활동명 목록을 미리 조회 (중복 검사용)
    existing_names = get_existing_musician_names(connection)
    print(f"✓ 기존 musician {len(existing_names)}개 확인\n")

    # 결과 집계용 변수
    insert_count = 0   # 새로 추가된 수
    skip_count = 0     # 중복이라 건너뛴 수
    fail_count = 0     # INSERT 실패 수

    # 뮤지션을 하나씩 저장 시도
    for idx, musician in enumerate(musicians, 1):
        name = musician['stageName']

        # 이미 있는 활동명이면 건너뛴다
        if name in existing_names:
            print(f"[{idx}/{len(musicians)}] ⏭ 스킵 (이미 존재): {name}")
            skip_count += 1
            continue

        # INSERT 시도
        if insert_musician(connection, musician):
            print(f"[{idx}/{len(musicians)}] ✓ 추가: {name} ({musician['position']})")
            insert_count += 1
            # 방금 넣은 이름도 기존 목록에 추가 → 뒤에 같은 이름 또 나오면 스킵되도록
            existing_names.add(name)
        else:
            fail_count += 1

    # 결과 요약 출력
    print("\n" + "="*60)
    print(f"✓ 새로 추가: {insert_count}개")
    print(f"⏭ 중복 스킵: {skip_count}개")
    print(f"✗ 실패: {fail_count}개")
    print("="*60 + "\n")
