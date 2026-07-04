# Docker 이미지를 위한 설정 파일 (레시피)
# [멀티스테이지 빌드] 이 파일은 2단계(스테이지)로 나뉨:
#   - 빌드 스테이지: 소스코드를 받아서 jar 파일로 빌드 (요리하는 주방)
#   - 실행 스테이지: 완성된 jar만 가져와서 실행 (손님에게 나가는 접시)
# 이렇게 나누는 이유:
#   1. Render 같은 배포 서버는 git 저장소만 받아감 → build/libs 폴더가 없음 → 서버가 직접 빌드해야 함
#   2. 최종 이미지에 Gradle, 소스코드 같은 빌드 도구를 안 남겨서 이미지가 가볍고 안전해짐

# ─────────── 1단계: 빌드 스테이지 ───────────
# FROM ... AS builder : 이 스테이지에 "builder"라는 이름을 붙임 (아래에서 참조하기 위해)
# eclipse-temurin:21-jdk = Java 21 개발도구(JDK)가 설치된 리눅스 이미지 (빌드엔 JDK가 필요)
FROM eclipse-temurin:21-jdk AS builder

# 컨테이너 내부 작업 폴더를 /app으로 지정
WORKDIR /app

# Gradle 관련 파일들을 먼저 복사 (소스코드보다 먼저 복사하는 이유: Docker 캐시 활용)
# gradlew = Gradle을 설치 없이 실행해주는 스크립트 (로컬에서 ./gradlew 하던 그것)
# gradle/ = gradlew가 사용하는 Gradle 본체 설정 폴더
# build.gradle, settings.gradle = 프로젝트 빌드 설정 (의존성 목록 등)
COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./

# gradlew 스크립트에 실행 권한 부여 (리눅스는 권한 없으면 실행 거부함)
RUN chmod +x gradlew

# 의존성(라이브러리)만 미리 다운로드
# || true = 이 명령이 실패해도 무시하고 계속 진행 (소스코드가 아직 없어서 일부 작업은 실패할 수 있음)
# 이 줄의 목적: 소스코드만 바뀌었을 때 라이브러리 다운로드를 다시 안 하도록 캐시를 만들어둠 (재배포 속도 향상)
RUN ./gradlew dependencies --no-daemon || true

# 이제 소스코드 전체를 복사
COPY src src

# jar 파일로 빌드
# -x test = 테스트는 건너뜀 (테스트는 GitHub Actions CI에서 이미 돌고 있음.
#           여기서 또 돌리면 배포가 느려지고, DB가 없는 빌드 환경이라 실패할 수도 있음)
# --no-daemon = 백그라운드 프로세스 없이 1회성 실행 (컨테이너 환경 권장 옵션)
RUN ./gradlew build -x test --no-daemon

# ─────────── 2단계: 실행 스테이지 ───────────
# 새로운 깨끗한 이미지에서 다시 시작
# 21-jre = 실행 전용 Java (JRE). 빌드도구가 빠져서 JDK보다 가벼움
FROM eclipse-temurin:21-jre

WORKDIR /app

# COPY --from=builder : 위 "builder" 스테이지에서 만든 파일을 가져옴
# 소스코드, Gradle 등은 안 가져오고 완성된 jar 딱 하나만 가져옴
COPY --from=builder /app/build/libs/again-0.0.1-SNAPSHOT.jar app.jar

# 컨테이너 시작 시 실행할 명령어: java -jar app.jar (서버 실행)
ENTRYPOINT ["java", "-jar", "app.jar"]

# 이 컨테이너는 8080 포트를 사용한다고 문서화 (Render는 PORT 환경변수로 실제 포트를 알려줌)
EXPOSE 8080

# ⚠️ 환경변수(DB 접속정보, JWT 비밀키 등)는 이미지에 넣지 않음
# → Render 대시보드의 Environment 설정에서 주입함 (지난번 터미널에서 export 했던 것과 같은 원리)
