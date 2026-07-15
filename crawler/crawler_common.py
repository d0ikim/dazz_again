# ==================== 이 파일의 목적 ====================
# 재즈바 크롤러들(클럽에반스/올댓재즈/부기우기/천년동안도)이 "공통으로" 쓰는 코드 모음.
#
# 각 크롤러는 사이트에서 뮤지션/공연 목록을 뽑아내는 방식만 다르고,
# 그렇게 뽑은 데이터를 DB에 저장하는 과정은 완전히 똑같다.
# → 똑같은 코드를 크롤러마다 복사하지 않기 위해 여기 한 곳에 모아두고,
#   각 크롤러 파일이 이 파일을 import 해서 가져다 쓴다.
#
# 이 파일이 제공하는 것:
# [뮤지션 저장 — musician 테이블]
# 1. connect_db()               → PostgreSQL에 연결
# 2. get_existing_musicians()   → 이미 저장된 뮤지션의 활동명/사진 유무 조회 (중복 방지 + 사진 보완용)
# 3. insert_musician()          → 뮤지션 1명을 musician 테이블에 INSERT
# 4. update_musician_image()    → 기존 뮤지션의 비어 있는 프로필사진만 UPDATE
# 5. save_musicians()           → 뮤지션 리스트를 통째로 저장
#                                 (신규는 INSERT, 기존인데 사진이 없으면 사진만 보완, 나머지는 스킵)
# [공연 저장 — performance / performance_lineup 테이블]
# 6. get_venue_id()             → 공연장 이름으로 venue 테이블의 id 조회
# 7. get_existing_performances()→ 이미 저장된 공연의 (일시, 제목) 조회 (중복 방지용)
# 8. get_musician_lookup()      → 라인업 이름을 musician id로 바꾸기 위한 검색표 조회
# 9. save_performances()        → 공연 리스트를 통째로 저장하고 라인업까지 연결
#                                 (공연 INSERT + performance_lineup INSERT,
#                                  라인업 뮤지션이 DB에 없으면 musician까지 새로 INSERT)
#
# ※ 이 파일은 직접 실행하지 않는다. 항상 크롤러 파일이 import 해서 사용한다.
# =====================================================

# ==================== 라이브러리 Import (외부 코드 불러오기) ====================

# PostgreSQL 데이터베이스에 연결하기 위한 라이브러리
import psycopg2

# 문자열에서 특정 패턴을 찾기 위한 정규표현식 라이브러리 (인스타 핸들 추출용)
import re

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

# ==================== 악기 표기 매핑표 (여러 크롤러가 공용) ====================

# 악기 표기 → 우리 DB에서 쓸 표준 악기명 매핑표.
# 사이트마다 'Guitar', '기타', 'Tenor Saxophone' 등 표기가 달라서 하나로 통일한다.
# (여러 표기가 같은 악기를 가리키면 같은 값으로 모은다. 예: 'sax'와 'saxophone' → 'SAXOPHONE')
# 부기우기(멤버 텍스트)와 클럽에반스(라인업 텍스트) 크롤러가 함께 사용한다.
INSTRUMENT_MAP = {
    # --- 영어 표기 ---
    'tenor saxophone': 'SAXOPHONE', 'alto saxophone': 'SAXOPHONE', 'bass clarinet': 'CLARINET',
    'double bass': 'BASS', 'tenorsax': 'SAXOPHONE', 'saxophone': 'SAXOPHONE', 'trombone': 'TROMBONE',
    'trumpet': 'TRUMPET', 'clarinet': 'CLARINET', 'keyboard': 'KEYBOARD', 'guitar': 'GUITAR',
    'violin': 'VIOLIN', 'flute': 'FLUTE', 'vocal': 'VOCAL', 'piano': 'PIANO', 'drums': 'DRUMS',
    'drum': 'DRUMS', 'harp': 'HARP', 'bass': 'BASS', 'cello': 'CELLO', 'oud': 'OUD', 'sax': 'SAXOPHONE',
    'chromatic harmonica': 'HARMONICA', 'harmonica': 'HARMONICA', 'harnonica': 'HARMONICA',  # harnonica = 에반스 사이트의 실제 오타
    'vibraphone': 'VIBRAPHONE',
    'percussion': 'PERCUSSION', 'kontrabass': 'BASS', 'contrabass': 'BASS', 'synthesizer': 'KEYBOARD',
    'synth': 'KEYBOARD', 'organ': 'KEYBOARD',
    # --- 한글 표기 ---
    '기타': 'GUITAR', '베이스': 'BASS', '드럼': 'DRUMS', '피아노': 'PIANO', '트럼펫': 'TRUMPET',
    '트롬본': 'TROMBONE', '트럼본': 'TROMBONE', '색소폰': 'SAXOPHONE', '보컬': 'VOCAL', '바이올린': 'VIOLIN',
    '플루트': 'FLUTE', '클라리넷': 'CLARINET', '하프': 'HARP', '건반': 'KEYBOARD',
    '하모니카': 'HARMONICA', '비브라폰': 'VIBRAPHONE', '퍼커션': 'PERCUSSION', '콘트라베이스': 'BASS',
    '신디사이저': 'KEYBOARD', '오르간': 'KEYBOARD',
}

# 악기 키워드를 찾는 정규식.
# 긴 표기가 먼저 매칭되도록 길이 내림차순으로 정렬한다.
# (예: 'Tenor Saxophone'을 'Sax'보다 먼저 시도해야 통째로 잡힌다)
_INSTRUMENT_KEYS = sorted(INSTRUMENT_MAP.keys(), key=len, reverse=True)
INSTRUMENT_REGEX = re.compile('(' + '|'.join(re.escape(k) for k in _INSTRUMENT_KEYS) + ')', re.IGNORECASE)

# ==================== 그룹명 판별 함수 ====================

# 그룹(팀) 이름에 흔히 들어가는 단어들의 패턴.
# musician 테이블은 '개인'만 저장하는 테이블인데, 올댓재즈에는
# '고희안 트리오', '구본웅밴드'처럼 그룹 명의로 등록된 계정이 섞여 있어서
# 이런 이름은 뮤지션으로 저장하지 않고 걸러내야 한다.
# (그룹 자체는 나중에 공연 크롤러에서 performance.title로 다룬다)
GROUP_NAME_REGEX = re.compile(
    r'(트리오|trio|quartet|콰르텟|쿼텟|퀄텟|quintet|퀸텟|sextet|밴드|band|두오|듀오|duo'
    r'|그룹|group|collective|&|friends|앙상블|ensemble|오케스트라|orchestra)',
    re.IGNORECASE
)

def is_group_name(name):
    """
    활동명이 개인이 아닌 '그룹(팀) 이름'으로 보이는지 판별하는 함수.

    입력값: name = 활동명 문자열 (예: '고희안 트리오', '김도이')
    반환값: 그룹명으로 보이면 True, 개인명으로 보이면 False
    """

    # 값이 없으면 그룹명 아님으로 처리
    if not name:
        return False

    # 그룹 단어 패턴이 이름 안에 하나라도 있으면 그룹명으로 판단
    return GROUP_NAME_REGEX.search(name) is not None

# ==================== 인스타그램 핸들 추출 함수 ====================

def extract_instagram_handle(url):
    """
    인스타그램 URL에서 아이디(핸들) 부분만 뽑아 소문자로 돌려주는 함수.

    같은 사람이 사이트마다 다른 활동명으로 등록된 경우가 있어서
    (예: 올댓재즈 'Diego Bae' = 부기우기 'Diego'),
    이름 대신 인스타 아이디로 "같은 사람인지"를 판별하는 데 쓴다.

    입력값: url = 'https://www.instagram.com/blueshouse_diego' 같은 URL (None 가능)
    반환값: 'blueshouse_diego' 같은 소문자 핸들. 인스타 URL이 아니거나 없으면 None
    """

    # 값이 없으면 핸들도 없음
    if not url:
        return None

    # instagram.com/ 뒤의 아이디(영문/숫자/./_)를 찾는다
    match = re.match(r'https?://(www\.)?instagram\.com/([A-Za-z0-9._]+)', url.strip(), re.IGNORECASE)

    # 대소문자 차이로 다른 사람 취급하지 않도록 소문자로 통일해서 반환
    return match.group(2).lower() if match else None

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

        # 모든 뮤지션의 ID, 활동명, 프로필사진 URL, 인스타 URL 조회
        cursor.execute("SELECT id, stage_name, profile_image_url, sns_url FROM musician;")

        # 활동명을 키로 하는 딕셔너리로 변환.
        # 사진 있음 판정: 실제 DB에는 NULL뿐 아니라 빈 문자열('')로 들어간 행도 있어서,
        # "NULL이 아니고, 공백을 뺀 내용이 있어야" 진짜 사진이 있는 것으로 본다.
        musicians = {}
        for row in cursor.fetchall():
            image_value = row[2]
            sns_value = row[3]
            musicians[row[1]] = {
                'id': row[0],   # 뮤지션 고유 번호 (UPDATE할 때 필요)
                'hasImage': image_value is not None and image_value.strip() != '',
                'hasSns': sns_value is not None and sns_value.strip() != '',   # SNS 보완 필요 여부 판단용
                'handle': extract_instagram_handle(row[3]),  # 인스타 핸들 (같은 사람 판별용, 없으면 None)
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
    반환값: 성공 시 새 뮤지션의 id 숫자, 실패 시 None
      ※ 원래는 True/False를 반환했지만, 공연 크롤러가 라인업 연결에
        방금 넣은 뮤지션의 id를 바로 써야 해서 id를 반환하도록 바꿨다.
        id는 1부터 시작하는 숫자라 if문에서 항상 참(truthy)이고 None은 거짓(falsy)이므로,
        기존의 `if insert_musician(...)` 방식 호출도 그대로 동작한다.
    """
    try:
        # 쿼리를 실행할 커서 생성
        cursor = connection.cursor()

        # musician 테이블에 새 행을 추가하는 SQL.
        # 컬럼명은 JPA가 만든 스네이크케이스 규칙을 따른다 (stageName → stage_name).
        # user_id는 넣지 않는다 → 크롤링 데이터는 특정 로그인 유저의 것이 아니므로 NULL로 둔다.
        # %s 는 SQL Injection을 막는 안전한 값 자리표시자다.
        # RETURNING id = INSERT하면서 방금 생성된 id를 바로 돌려받는 PostgreSQL 문법.
        query = """
            INSERT INTO musician
                (stage_name, real_name, position, bio, sns_url, profile_image_url, source_type, source_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
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

        # RETURNING이 돌려준 새 뮤지션의 id를 꺼낸다
        new_id = cursor.fetchone()[0]

        # 변경사항을 실제 DB에 반영 (COMMIT)
        connection.commit()

        # 커서 종료
        cursor.close()

        return new_id
    except Exception as e:
        # INSERT 실패 시 에러 출력
        print(f"  ✗ '{musician['stageName']}' INSERT 실패: {e}")
        # 실패한 트랜잭션을 되돌린다 (다음 INSERT가 정상 동작하도록)
        connection.rollback()
        return None

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

# ==================== 기존 뮤지션 SNS(인스타) 보완 함수 ====================

def update_musician_sns(connection, musician_id, sns_url):
    """
    기존 뮤지션의 SNS 주소(sns_url)만 UPDATE하는 함수.

    ※ 사진 보완(update_musician_image)과 같은 원리:
      save_musicians()가 'SNS가 비어 있는 뮤지션'에 대해서만 호출한다.
      이미 SNS가 있는 뮤지션은 절대 덮어쓰지 않는다.
      (예: 에반스 크롤러가 처음엔 인스타 없이 저장했다가,
       나중에 라인업에서 인스타를 발견하면 그때 채워준다)

    입력값:
      - connection  = 데이터베이스 연결 객체
      - musician_id = SNS를 채워줄 뮤지션의 고유 번호(id)
      - sns_url     = 크롤링으로 얻은 인스타그램 URL
    반환값: 성공 시 True, 실패 시 False
    """
    try:
        # 쿼리를 실행할 커서 생성
        cursor = connection.cursor()

        # 해당 id 뮤지션의 SNS 컬럼만 갱신
        cursor.execute(
            "UPDATE musician SET sns_url = %s WHERE id = %s;",
            (sns_url, musician_id)
        )

        # 변경사항을 실제 DB에 반영 (COMMIT)
        connection.commit()

        # 커서 종료
        cursor.close()

        return True
    except Exception as e:
        # UPDATE 실패 시 에러 출력 후 트랜잭션 되돌림
        print(f"  ✗ SNS 보완 실패 (musician id={musician_id}): {e}")
        connection.rollback()
        return False

# ==================== 뮤지션 리스트 통째로 저장 함수 ====================

def save_musicians(connection, musicians):
    """
    크롤러가 뽑아낸 뮤지션 리스트를 통째로 DB에 저장하는 함수.

    저장 규칙:
      1. DB에 없는 활동명           → 새로 INSERT
      2. 이미 있는데 사진/SNS가 비어 있고,
         크롤링 데이터에 그 값이 있음 → 비어 있는 항목만 UPDATE (보완)
      3. 그 외 (이미 있고 보완할 것도 없음) → 건너뜀 (기존 데이터 보호)
      4. 활동명은 달라도 '인스타 핸들'이 같은 뮤지션이 이미 있으면
         → 같은 사람으로 보고 INSERT하지 않는다 (사진 보완만 시도)
         (예: 올댓재즈 'Diego Bae' = 부기우기 'Diego' — 표기만 다른 동일 인물)
      - 이번에 방금 넣은 활동명/핸들도 기억해서, 크롤링 결과 안에 같은 사람이
        또 나와도 중복 INSERT하지 않는다.

    입력값:
      - connection = 데이터베이스 연결 객체
      - musicians  = 뮤지션 정보 딕셔너리 리스트
    반환값: 없음 (결과를 화면에 요약 출력한다)
    """

    # DB에 이미 있는 뮤지션 정보(활동명/사진유무/인스타핸들)를 미리 조회
    existing = get_existing_musicians(connection)
    print(f"✓ 기존 musician {len(existing)}개 확인\n")

    # 인스타 핸들 → 활동명 빠른 검색표(인덱스)를 만든다.
    # "이 핸들을 가진 뮤지션이 이미 있나?"를 빠르게 확인하기 위한 용도.
    handle_to_name = {}
    for name, info in existing.items():
        if info['handle']:
            handle_to_name[info['handle']] = name

    # 결과 집계용 변수
    insert_count = 0   # 새로 추가된 수
    enrich_count = 0   # 기존 뮤지션의 사진을 보완한 수
    skip_count = 0     # 건너뛴 수
    fail_count = 0     # INSERT/UPDATE 실패 수

    # 뮤지션을 하나씩 저장 시도
    for idx, musician in enumerate(musicians, 1):
        name = musician['stageName']

        # 크롤링한 뮤지션의 인스타 핸들 (없으면 None)
        handle = extract_instagram_handle(musician['snsUrl'])

        # ── 규칙 4: 활동명은 다르지만 인스타 핸들이 같은 뮤지션이 이미 있는 경우 ──
        # 같은 사람이 사이트마다 다른 표기로 등록된 것이므로 새로 INSERT하지 않는다.
        if name not in existing and handle and handle in handle_to_name:
            matched_name = handle_to_name[handle]   # DB에 이미 있는 그 사람의 활동명
            # 그 사람의 사진이 비어 있고 크롤링 데이터에 사진이 있으면 보완만 해준다
            # (id가 None = 이번 실행에서 방금 INSERT한 사람 → UPDATE할 id를 모르므로 보완 생략)
            if existing[matched_name]['id'] is not None \
                    and not existing[matched_name]['hasImage'] and musician['profileImageUrl']:
                if update_musician_image(connection, existing[matched_name]['id'], musician['profileImageUrl']):
                    print(f"[{idx}/{len(musicians)}] 🖼 사진 보완: {matched_name} (인스타 동일: {name})")
                    enrich_count += 1
                    existing[matched_name]['hasImage'] = True
                else:
                    fail_count += 1
            else:
                print(f"[{idx}/{len(musicians)}] ⏭ 스킵 (인스타 동일: 기존 '{matched_name}'): {name}")
                skip_count += 1
            continue

        # ── 규칙 2, 3: 이미 있는 활동명인 경우 ──
        if name in existing:
            info = existing[name]
            enriched = []   # 이번에 보완한 항목 이름들 (출력용)

            # id가 None = 이번 실행에서 방금 INSERT한 사람 → UPDATE할 id를 모르므로 보완 생략
            if info['id'] is not None:
                # 사진이 없는데 크롤링 데이터에 사진이 있으면 → 사진 보완
                if not info['hasImage'] and musician['profileImageUrl']:
                    if update_musician_image(connection, info['id'], musician['profileImageUrl']):
                        info['hasImage'] = True   # 같은 이름이 또 나와도 다시 UPDATE하지 않도록 표시
                        enriched.append('사진')
                    else:
                        fail_count += 1

                # SNS가 없는데 크롤링 데이터에 인스타가 있으면 → SNS 보완
                if not info['hasSns'] and musician['snsUrl']:
                    if update_musician_sns(connection, info['id'], musician['snsUrl']):
                        info['hasSns'] = True
                        info['handle'] = handle
                        # 핸들 검색표에도 추가 → 이후 같은 핸들이 다른 이름으로 와도 중복 INSERT 방지
                        if handle:
                            handle_to_name[handle] = name
                        enriched.append('SNS')
                    else:
                        fail_count += 1

            # 하나라도 보완했으면 보완으로 집계, 아니면 스킵
            if enriched:
                print(f"[{idx}/{len(musicians)}] 🖼 보완({'+'.join(enriched)}): {name}")
                enrich_count += 1
            else:
                print(f"[{idx}/{len(musicians)}] ⏭ 스킵 (이미 존재): {name}")
                skip_count += 1
            continue

        # ── 규칙 1: 없는 활동명이면 INSERT 시도 ──
        if insert_musician(connection, musician):
            print(f"[{idx}/{len(musicians)}] ✓ 추가: {name} ({musician['position']})")
            insert_count += 1
            # 방금 넣은 뮤지션도 기존 목록/핸들 검색표에 추가 → 뒤에 같은 사람이 또 나오면 스킵되도록
            # (id는 이후 로직에서 쓰지 않으므로 None으로 둔다)
            existing[name] = {'id': None, 'hasImage': musician['profileImageUrl'] is not None,
                              'hasSns': musician['snsUrl'] is not None, 'handle': handle}
            if handle:
                handle_to_name[handle] = name
        else:
            fail_count += 1

    # 결과 요약 출력
    print("\n" + "="*60)
    print(f"✓ 새로 추가: {insert_count}개")
    print(f"🖼 보완(사진/SNS): {enrich_count}개")
    print(f"⏭ 중복 스킵: {skip_count}개")
    print(f"✗ 실패: {fail_count}개")
    print("="*60 + "\n")

# ════════════════════════════════════════════════════════════
#  여기서부터는 '공연(performance)' 저장용 공용 함수들
# ════════════════════════════════════════════════════════════

# ==================== 공연장 ID 조회 함수 ====================

def get_venue_id(connection, venue_name):
    """
    공연장 이름으로 venue 테이블의 id를 조회하는 함수.

    performance 테이블의 venue_id 컬럼(FK, NULL 불가)에 넣을 값이 필요해서,
    각 공연 크롤러가 저장 전에 자기 공연장의 id를 이 함수로 알아낸다.
    (venue id를 크롤러에 숫자로 박아두면 DB를 새로 만들 때 id가 달라져 깨질 수 있어서
     '이름으로 조회'하는 방식을 쓴다)

    입력값:
      - connection = 데이터베이스 연결 객체
      - venue_name = 공연장 이름 (예: '클럽에반스')
    반환값: venue의 id 숫자. 없으면 None
    """
    try:
        # 쿼리를 실행할 커서 생성
        cursor = connection.cursor()

        # 이름이 정확히 일치하는 공연장의 id 조회
        cursor.execute("SELECT id FROM venue WHERE name = %s;", (venue_name,))
        row = cursor.fetchone()

        # 커서 종료 (자원 해제)
        cursor.close()

        # 조회 결과가 있으면 id 숫자, 없으면 None
        return row[0] if row else None
    except Exception as e:
        print(f"✗ 공연장 '{venue_name}' 조회 실패: {e}")
        return None

# ==================== 기존 공연 조회 함수 ====================

def get_existing_performances(connection, venue_id):
    """
    특정 공연장의 이미 저장된 공연들을 조회하는 함수.

    크롤러를 여러 번 실행해도 같은 공연이 중복 저장되지 않도록,
    '(공연 일시, 공연명)' 조합을 중복 판단 기준으로 쓴다.
    (같은 공연장에서 같은 시각에 같은 제목의 공연이 두 개일 수는 없으므로)

    입력값:
      - connection = 데이터베이스 연결 객체
      - venue_id   = 공연장 id
    반환값: {(start_time, title), ...} 형태의 집합(set) — "이 조합은 이미 있다" 빠른 확인용
    """
    try:
        # 쿼리를 실행할 커서 생성
        cursor = connection.cursor()

        # 이 공연장의 모든 공연의 (일시, 제목) 조회
        cursor.execute("SELECT start_time, title FROM performance WHERE venue_id = %s;", (venue_id,))

        # (일시, 제목) 튜플의 집합으로 변환 — set은 'in' 검사가 매우 빠르다
        performances = {(row[0], row[1]) for row in cursor.fetchall()}

        # 커서 종료
        cursor.close()

        return performances
    except Exception as e:
        print(f"✗ 기존 performance 조회 실패: {e}")
        return set()

# ==================== 뮤지션 검색표 조회 함수 ====================

def get_musician_lookup(connection):
    """
    라인업의 뮤지션 이름을 musician 테이블의 id로 바꾸기 위한 검색표를 만드는 함수.

    performance_lineup 테이블은 (공연 id, 뮤지션 id) 쌍을 저장하므로,
    크롤링한 라인업의 '이름'을 'id'로 변환해야 한다. 두 가지 검색표를 만든다:
      1. 활동명 → id  (기본 검색)
      2. 인스타 핸들 → id  (활동명 표기가 사이트마다 달라도 같은 사람을 찾기 위한 보조 검색.
                            예: 올댓재즈 'Diego Bae' = 부기우기 'Diego')

    입력값: connection = 데이터베이스 연결 객체
    반환값: (name_to_id, handle_to_id) 딕셔너리 두 개의 튜플
    """
    try:
        # 쿼리를 실행할 커서 생성
        cursor = connection.cursor()

        # 모든 뮤지션의 id, 활동명, SNS URL 조회
        cursor.execute("SELECT id, stage_name, sns_url FROM musician;")

        name_to_id = {}     # 활동명 → id
        handle_to_id = {}   # 인스타 핸들 → id
        for row in cursor.fetchall():   # row = (5, '김이슬', 'Https://www.instagram.com/kis')
            name_to_id[row[1]] = row[0] # name_to_id['김이슬'] = 5 <-이런식.
            # 최종적으로 name_to_id = {'김이슬': 5, '이선지': 12, 'Diego Bae': 33, ...}
            # 이 검색표 없으면, 라인업한명당 DB쿼리왕복이 한번씩 생기는데, 검색표를 미리 만들어두면 라인업한명당 딕셔너리 조회만으로 id를 바로 찾을 수 있다.

            # SNS URL에서 인스타 핸들을 뽑아 보조 검색표에도 등록 (인스타가 아니면 None이라 제외)
            handle = extract_instagram_handle(row[2])
            if handle:
                handle_to_id[handle] = row[0]   # handle_to_id = {'kimdoii': 7, 'mona.jazz': 5, ...}

        # 커서 종료
        cursor.close()

        return (name_to_id, handle_to_id)
    except Exception as e:
        print(f"✗ musician 검색표 조회 실패: {e}")
        return ({}, {})

# ==================== 공연 1개 INSERT 함수 ====================

def insert_performance(connection, venue_id, perf):
    """
    공연 1개를 performance 테이블에 INSERT하는 함수.

    입력값:
      - connection = 데이터베이스 연결 객체
      - venue_id   = 공연장 id (FK)
      - perf       = 공연 정보 딕셔너리. 아래 키를 가진다:
          startTime : 공연 일시 (파이썬 datetime 객체, 필수)
          title     : 공연명 (필수)
          genre     : 장르 (없으면 None)
          setInfo   : 세트 안내 (없으면 None, 예: "1부 8시 - 8시 50분")
          setList   : 셋리스트 (없으면 None)
          sourceUrl : 출처 URL (없으면 None)
    반환값: 성공 시 새 공연의 id 숫자, 실패 시 None
    """
    try:
        # 쿼리를 실행할 커서 생성
        cursor = connection.cursor()

        # performance 테이블에 새 행을 추가하는 SQL.
        # is_cancelled는 NULL 불가 컬럼이므로 항상 FALSE(취소 아님)로 넣는다.
        # RETURNING id = INSERT하면서 방금 생성된 id를 바로 돌려받는 PostgreSQL 문법.
        #               (라인업 연결에 이 id가 필요해서 씀)
        query = """
            INSERT INTO performance
                (venue_id, start_time, title, genre, set_info, set_list, is_cancelled, source_url)
            VALUES (%s, %s, %s, %s, %s, %s, FALSE, %s)
            RETURNING id;
        """

        # 딕셔너리에서 값을 꺼내 SQL의 %s 순서대로 전달
        cursor.execute(query, (
            venue_id,
            perf['startTime'],
            perf['title'],
            perf['genre'],
            perf['setInfo'],
            perf['setList'],
            perf['sourceUrl'],
        ))

        # RETURNING이 돌려준 새 공연의 id를 꺼낸다
        new_id = cursor.fetchone()[0]

        # 변경사항을 실제 DB에 반영 (COMMIT)
        connection.commit()

        # 커서 종료
        cursor.close()

        return new_id
    except Exception as e:
        # INSERT 실패 시 에러 출력 후 트랜잭션 되돌림
        print(f"  ✗ 공연 '{perf['title']}' INSERT 실패: {e}")
        connection.rollback()
        return None

# ==================== 라인업 1행 INSERT 함수 ====================

def insert_lineup(connection, performance_id, musician_id):
    """
    공연-뮤지션 연결 1행을 performance_lineup 테이블에 INSERT하는 함수.

    performance_lineup은 "이 공연에 이 뮤지션이 출연했다"를 기록하는 연결 테이블로,
    (performance_id, musician_id) 쌍이 복합 기본키(PK)다.

    입력값:
      - connection     = 데이터베이스 연결 객체
      - performance_id = 공연 id
      - musician_id    = 뮤지션 id
    반환값: 성공 시 True, 실패 시 False
    """
    try:
        # 쿼리를 실행할 커서 생성
        cursor = connection.cursor()

        # 연결 행 추가
        cursor.execute(
            "INSERT INTO performance_lineup (performance_id, musician_id) VALUES (%s, %s);",
            (performance_id, musician_id)
        )

        # 변경사항을 실제 DB에 반영 (COMMIT)
        connection.commit()

        # 커서 종료
        cursor.close()

        return True
    except Exception as e:
        # INSERT 실패 시 에러 출력 후 트랜잭션 되돌림
        print(f"  ✗ 라인업 연결 실패 (performance={performance_id}, musician={musician_id}): {e}")
        connection.rollback()
        return False

# ==================== 공연 리스트 통째로 저장 함수 ====================

def save_performances(connection, venue_name, performances, musician_source_type):
    """
    크롤러가 뽑아낸 공연 리스트를 통째로 DB에 저장하고 라인업까지 연결하는 함수.

    저장 규칙:
      1. (공연 일시, 공연명)이 이미 DB에 있으면          → 건너뜀 (중복 방지)
      2. 없으면 performance INSERT 후, 라인업의 뮤지션마다:
         a. 활동명이 musician 테이블에 있으면            → 그 id로 라인업 연결
         b. 활동명은 없지만 인스타 핸들이 같은 사람이 있으면 → 그 id로 연결 (표기만 다른 동일 인물)
         c. 둘 다 없고 악기(position) 정보가 있으면       → musician을 새로 INSERT 후 연결
            (단, 그룹명으로 보이는 이름은 musician에 넣지 않으므로 연결도 생략)
         d. 둘 다 없고 악기 정보도 없으면                → 연결 생략 (누구인지 특정 불가)

    입력값:
      - connection           = 데이터베이스 연결 객체
      - venue_name           = 공연장 이름 (venue id를 조회하는 데 사용)
      - performances         = 공연 정보 딕셔너리 리스트.
                               insert_performance()의 키에 더해 'lineup' 키를 가진다:
                               lineup = [{'stageName': 이름, 'position': 악기 또는 None,
                                          'snsUrl': 인스타 URL 또는 None}, ...]
      - musician_source_type = 라인업에서 새 뮤지션을 INSERT할 때 쓸 출처 구분값
    반환값: 없음 (결과를 화면에 요약 출력한다)
    """

    # 공연장 id 조회 — 없으면 저장 자체가 불가능하므로 중단
    venue_id = get_venue_id(connection, venue_name)
    if venue_id is None:
        print(f"✗ venue 테이블에 '{venue_name}' 공연장이 없어 저장을 중단합니다")
        return

    # 이 공연장의 기존 공연 (일시, 제목) 집합 — 중복 방지용
    existing = get_existing_performances(connection, venue_id)
    print(f"✓ '{venue_name}'(venue id={venue_id})의 기존 공연 {len(existing)}개 확인")

    # 뮤지션 검색표 (활동명 → id, 인스타 핸들 → id)
    name_to_id, handle_to_id = get_musician_lookup(connection)
    print(f"✓ 기존 musician 검색표 {len(name_to_id)}명 준비\n")

    # 결과 집계용 변수
    insert_count = 0         # 새로 저장된 공연 수
    skip_count = 0           # 중복으로 건너뛴 공연 수
    fail_count = 0           # INSERT 실패 수
    lineup_count = 0         # 연결된 라인업 행 수
    new_musician_count = 0   # 라인업에서 새로 INSERT된 뮤지션 수
    unmatched_count = 0      # 누구인지 특정하지 못해 연결을 생략한 수

    # 공연을 하나씩 저장 시도
    for idx, perf in enumerate(performances, 1):
        key = (perf['startTime'], perf['title'])

        # ── 규칙 1: 이미 있는 (일시, 제목) 조합이면 건너뜀 ──
        if key in existing:
            print(f"[{idx}/{len(performances)}] ⏭ 스킵 (이미 존재): {perf['startTime']} {perf['title']}")
            skip_count += 1
            continue

        # ── 규칙 2: 공연 INSERT ──
        performance_id = insert_performance(connection, venue_id, perf)
        if performance_id is None:
            fail_count += 1
            continue

        # 방금 넣은 공연도 기존 집합에 추가 → 크롤링 결과 안에 같은 공연이 또 있어도 중복 방지
        existing.add(key)
        insert_count += 1

        # ── 라인업 연결 ──
        linked_ids = set()   # 이 공연에 이미 연결한 뮤지션 id (한 공연에 같은 사람 중복 연결 방지)
        linked_names = []    # 연결된 이름들 (출력용)

        for member in perf['lineup']:
            member_name = member['stageName']

            # a. 활동명으로 검색
            musician_id = name_to_id.get(member_name)

            # b. 활동명으로 못 찾으면 인스타 핸들로 검색 (표기만 다른 동일 인물 대비)
            if musician_id is None:
                handle = extract_instagram_handle(member.get('snsUrl'))
                if handle:
                    musician_id = handle_to_id.get(handle)

            # c. DB에 없는 사람 → 악기 정보가 있으면 musician을 새로 INSERT
            if musician_id is None and member.get('position'):
                # 그룹명으로 보이는 이름은 musician 테이블(개인 전용)에 넣지 않는다
                if is_group_name(member_name):
                    unmatched_count += 1
                    continue

                # 새 뮤지션 INSERT (출처 = 이 공연 크롤러, 출처 URL = 이 공연 페이지)
                new_musician = {
                    'stageName': member_name,
                    'realName': None,
                    'position': member['position'],
                    'bio': None,
                    'snsUrl': member.get('snsUrl'),
                    'profileImageUrl': None,
                    'sourceType': musician_source_type,
                    'sourceUrl': perf['sourceUrl'],
                }
                # insert_musician()이 방금 만든 id를 바로 돌려준다 (실패하면 None)
                musician_id = insert_musician(connection, new_musician)
                if musician_id is not None:
                    # 검색표에도 등록 → 다른 공연 라인업에 같은 사람이 또 나오면 재사용
                    name_to_id[member_name] = musician_id
                    new_musician_count += 1

            # d. 여기까지도 못 찾았으면 연결 생략
            if musician_id is None:
                unmatched_count += 1
                continue

            # 이 공연에 이미 연결한 사람이면 건너뜀 (같은 이름이 라인업에 두 번 적힌 경우)
            if musician_id in linked_ids:
                continue

            # 공연-뮤지션 연결 행 INSERT
            if insert_lineup(connection, performance_id, musician_id):
                linked_ids.add(musician_id)
                linked_names.append(member_name)
                lineup_count += 1

        print(f"[{idx}/{len(performances)}] ✓ 추가: {perf['startTime']} {perf['title']}"
              f" (라인업 {len(linked_names)}명: {', '.join(linked_names) if linked_names else '없음'})")

    # 결과 요약 출력
    print("\n" + "="*60)
    print(f"✓ 새로 저장된 공연: {insert_count}개")
    print(f"⏭ 중복 스킵: {skip_count}개")
    print(f"✗ 실패: {fail_count}개")
    print(f"🎵 연결된 라인업: {lineup_count}명 (새로 추가된 뮤지션 {new_musician_count}명 포함)")
    print(f"❓ 특정 실패로 연결 생략: {unmatched_count}명")
    print("="*60 + "\n")
