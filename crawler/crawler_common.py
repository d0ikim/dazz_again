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
