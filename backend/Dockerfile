# Docker 이미지를 위한 설정 파일 (레시피)
# 이 파일을 통해 Java 환경이 완벽하게 갖춰진 이미지를 만듦

# 1단계: 기초 이미지 선택 (운영체제 + Java)
# FROM: 어떤 기초 이미지를 사용할 것인가?
# eclipse-temurin:21-jdk = Java 21이 이미 설치된 리눅스 이미지
# eclipse-temurin = OpenJDK의 공식 배포판 (가장 안정적)
FROM eclipse-temurin:21-jdk

# 2단계: 작업 디렉토리 설정
# WORKDIR: 컨테이너 내부에서 어디를 기본 위치로 할 것인가?
# /app = 모든 파일을 /app 폴더에 저장
WORKDIR /app

# 3단계: 빌드된 jar 파일을 컨테이너로 복사
# COPY: 파일을 복사해서 넣는 명령어
# ./build/libs/again-0.0.1-SNAPSHOT.jar = 로컬 PC의 jar 파일 (build.gradle의 artifactId에서 결정됨)
# app.jar = 컨테이너 내부에서의 이름 (간단하게)
# 주의: 이 jar 파일은 미리 빌드되어 있어야 함 (gradle build 후)
COPY build/libs/again-0.0.1-SNAPSHOT.jar app.jar

# 4단계: 컨테이너가 실행될 때 뭘 할 것인가?
# ENTRYPOINT: 컨테이너 시작 시 실행할 명령어 (변경 불가)
# java -jar app.jar = jar 파일 실행
ENTRYPOINT ["java", "-jar", "app.jar"]

# ⚠️ 주의: 환경변수 설정
# 현재 이 Dockerfile은 환경변수 설정이 없음
# docker run 할 때 -e 옵션으로 환경변수를 넘겨줘야 함
# 예: docker run -e DB_PASSWORD=xxx -e JWT_SECRET=yyy app