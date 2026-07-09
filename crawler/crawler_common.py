# ==================== 이 파일의 목적 ====================
# 세 개의 재즈바 크롤러(클럽에반스/올댓재즈/부기우기)가 "공통으로" 쓰는 코드 모음.
#
# 각 크롤러는 사이트에서 뮤지션 목록을 뽑아내는 방식만 다르고,
# 그렇게 뽑은 뮤지션을 DB에 저장하는 과정은 완전히 똑같다.
# → 똑같은 코드를 3번 복사하지 않기 위해 여기 한 곳에 모아두고,
#   각 크롤러 파일이 이 파일을 import 해서 가져다 쓴다.
#
# 이 파일이 제공하는 것:
# 1. connect_db()               → PostgreSQL에 연결
# 2. get_existing_musicians()   → 이미 저장된 뮤지션의 활동명/사진 유무 조회 (중복 방지 + 사진 보완용)
# 3. insert_musician()          → 뮤지션 1명을 musician 테이블에 INSERT
# 4. update_musician_image()    → 기존 뮤지션의 비어 있는 프로필사진만 UPDATE
# 5. save_musicians()           → 뮤지션 리스트를 통째로 저장
#                                 (신규는 INSERT, 기존인데 사진이 없으면 사진만 보완, 나머지는 스킵)
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

# ==================== 기존 뮤지션 조회 함수 ====================

def get_existing_musicians(connection):
    """
    musician 테이블에 이미 저장된 뮤지션들의 정보를 조회하는 함수.

    두 가지 용도로 쓴다:
      1. 같은 활동명이 이미 있으면 INSERT하지 않기 위한 중복 검사
      2. 이미 있는 뮤지션인데 프로필사진이 비어 있으면,
         크롤링한 사진으로 채워주기 위한 '사진 유무' 확인

    입력값: connection = 데이터베이스 연결 객체
    반환값: 딕셔너리 { 활동명: {'id': 뮤지션ID, 'hasImage': 사진있음여부(True/False)} }
    """
    try:
        # 쿼리를 실행할 커서 생성
        cursor = connection.cursor()

        # 모든 뮤지션의 ID, 활동명, 프로필사진 URL 조회
        cursor.execute("SELECT id, stage_name, profile_image_url FROM musician;")

        # 활동명을 키로 하는 딕셔너리로 변환.
        # 사진 있음 판정: 실제 DB에는 NULL뿐 아니라 빈 문자열('')로 들어간 행도 있어서,
        # "NULL이 아니고, 공백을 뺀 내용이 있어야" 진짜 사진이 있는 것으로 본다.
        musicians = {}
        for row in cursor.fetchall():
            image_value = row[2]
            musicians[row[1]] = {
                'id': row[0],   # 뮤지션 고유 번호 (UPDATE할 때 필요)
                'hasImage': image_value is not None and image_value.strip() != '',
            }

        # 커서 종료 (자원 해제)
        cursor.close()

        return musicians
    except Exception as e:
        # 조회 실패 시 에러 출력 후 빈 딕셔너리 반환
        print(f"✗ 기존 musician 조회 실패: {e}")
        return {}

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

# ==================== 기존 뮤지션 프로필사진 보완 함수 ====================

def update_musician_image(connection, musician_id, image_url):
    """
    기존 뮤지션의 프로필사진(profile_image_url)만 UPDATE하는 함수.

    ※ 이 함수는 save_musicians()가 '사진이 비어 있는 뮤지션'에 대해서만 호출한다.
      이미 사진이 있는 뮤지션(예: 관리자가 직접 등록한 사진)은 절대 덮어쓰지 않는다.

    입력값:
      - connection  = 데이터베이스 연결 객체
      - musician_id = 사진을 채워줄 뮤지션의 고유 번호(id)
      - image_url   = 크롤링으로 얻은 프로필사진 URL
    반환값: 성공 시 True, 실패 시 False
    """
    try:
        # 쿼리를 실행할 커서 생성
        cursor = connection.cursor()

        # 해당 id 뮤지션의 프로필사진 컬럼만 갱신
        cursor.execute(
            "UPDATE musician SET profile_image_url = %s WHERE id = %s;",
            (image_url, musician_id)
        )

        # 변경사항을 실제 DB에 반영 (COMMIT)
        connection.commit()

        # 커서 종료
        cursor.close()

        return True
    except Exception as e:
        # UPDATE 실패 시 에러 출력 후 트랜잭션 되돌림
        print(f"  ✗ 사진 보완 실패 (musician id={musician_id}): {e}")
        connection.rollback()
        return False

# ==================== 뮤지션 리스트 통째로 저장 함수 ====================

def save_musicians(connection, musicians):
    """
    크롤러가 뽑아낸 뮤지션 리스트를 통째로 DB에 저장하는 함수.

    저장 규칙:
      1. DB에 없는 활동명           → 새로 INSERT
      2. 이미 있는데 사진이 비어 있고,
         크롤링 데이터에 사진이 있음 → 프로필사진만 UPDATE (보완)
      3. 그 외 (이미 있고 사진도 있음) → 건너뜀 (기존 데이터 보호)
      - 이번에 방금 넣은 활동명도 기억해서, 크롤링 결과 안에 같은 이름이
        또 나와도 중복 INSERT하지 않는다.

    입력값:
      - connection = 데이터베이스 연결 객체
      - musicians  = 뮤지션 정보 딕셔너리 리스트
    반환값: 없음 (결과를 화면에 요약 출력한다)
    """

    # DB에 이미 있는 뮤지션 정보(활동명/사진유무)를 미리 조회
    existing = get_existing_musicians(connection)
    print(f"✓ 기존 musician {len(existing)}개 확인\n")

    # 결과 집계용 변수
    insert_count = 0   # 새로 추가된 수
    enrich_count = 0   # 기존 뮤지션의 사진을 보완한 수
    skip_count = 0     # 건너뛴 수
    fail_count = 0     # INSERT/UPDATE 실패 수

    # 뮤지션을 하나씩 저장 시도
    for idx, musician in enumerate(musicians, 1):
        name = musician['stageName']

        # ── 규칙 2, 3: 이미 있는 활동명인 경우 ──
        if name in existing:
            # 사진이 없는데 크롤링 데이터에 사진이 있으면 → 사진만 보완
            if not existing[name]['hasImage'] and musician['profileImageUrl']:
                if update_musician_image(connection, existing[name]['id'], musician['profileImageUrl']):
                    print(f"[{idx}/{len(musicians)}] 🖼 사진 보완: {name}")
                    enrich_count += 1
                    # 이제 사진이 생겼다고 표시 → 같은 이름이 또 나와도 다시 UPDATE하지 않음
                    existing[name]['hasImage'] = True
                else:
                    fail_count += 1
            else:
                # 이미 있고 보완할 것도 없으면 건너뜀
                print(f"[{idx}/{len(musicians)}] ⏭ 스킵 (이미 존재): {name}")
                skip_count += 1
            continue

        # ── 규칙 1: 없는 활동명이면 INSERT 시도 ──
        if insert_musician(connection, musician):
            print(f"[{idx}/{len(musicians)}] ✓ 추가: {name} ({musician['position']})")
            insert_count += 1
            # 방금 넣은 뮤지션도 기존 목록에 추가 → 뒤에 같은 이름 또 나오면 스킵되도록
            # (id는 이후 로직에서 쓰지 않으므로 None으로 둔다)
            existing[name] = {'id': None, 'hasImage': musician['profileImageUrl'] is not None}
        else:
            fail_count += 1

    # 결과 요약 출력
    print("\n" + "="*60)
    print(f"✓ 새로 추가: {insert_count}개")
    print(f"🖼 사진 보완: {enrich_count}개")
    print(f"⏭ 중복 스킵: {skip_count}개")
    print(f"✗ 실패: {fail_count}개")
    print("="*60 + "\n")
