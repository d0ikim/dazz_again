// 뮤지션 DB테이블 구조를 정의하는 파일
package com.dazz.again.domain.musician;

import com.fasterxml.jackson.annotation.JsonPropertyOrder; // JSON 응답 필드 순서를 지정하는 어노테이션
import jakarta.persistence.Column;                         // DB 컬럼 속성을 설정하는 어노테이션
import jakarta.persistence.Entity;                         // 이 클래스가 DB 테이블과 연결된다고 선언하는 어노테이션
import jakarta.persistence.GeneratedValue;                 // PK 값을 자동으로 생성해주는 어노테이션
import jakarta.persistence.GenerationType;                 // PK 자동 생성 전략 종류 (IDENTITY = DB가 알아서 증가)
import jakarta.persistence.Id;                             // 이 필드가 PK(기본키)임을 선언하는 어노테이션
import jakarta.persistence.Table;                          // 연결할 DB 테이블 이름을 지정하는 어노테이션
import lombok.AccessLevel;                                 // Lombok: 접근제어자 수준 설정에 사용
import lombok.AllArgsConstructor;                          // Lombok: 모든 필드를 받는 생성자를 자동 생성 (@Builder가 필요로 함)
import lombok.Builder;                                     // Lombok: 빌더 패턴으로 객체를 생성할 수 있게 해줌
import lombok.Getter;                                      // Lombok: 모든 필드의 getter 메서드를 자동 생성
import lombok.NoArgsConstructor;                           // Lombok: 파라미터 없는 기본 생성자를 자동 생성 (JPA 필수)

@JsonPropertyOrder({"id", "stageName", "realName", "position", "bio", "snsUrl", "profileImageUrl", "sourceType", "sourceUrl"})
@Entity                                                    // JPA에게 "이 클래스는 DB 테이블이야"라고 알림
@Table(name = "musician")                                  // 연결할 테이블 이름을 "musician"으로 지정
@Getter                                                    // 모든 필드에 대해 getXxx() 메서드 자동 생성
@NoArgsConstructor(access = AccessLevel.PROTECTED)         // JPA가 내부적으로 쓸 기본 생성자, 외부에서 직접 new Musician() 못하게 막음
@AllArgsConstructor(access = AccessLevel.PRIVATE)          // @Builder가 내부적으로 사용할 전체 필드 생성자, 외부 직접 호출 불가
@Builder                                                   // Musician.builder().stageName("조에스더").build() 방식으로 객체 생성 가능
public class Musician {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)    // INSERT 시 DB가 1, 2, 3... 자동으로 ID 부여
    private Long id;                                       // 뮤지션 고유 번호

    @Column(nullable = false)
    private String stageName;                              // 활동명 (예: "조에스더")

    @Column
    private String realName;                               // 본명 (예: "조에스더") — NULL 허용

    @Column(nullable = false)
    private String position;                               // 악기 (예: "PIANO", "VOCAL", "DRUMS")

    @Column(columnDefinition = "TEXT")
    private String bio;                                    // 소개 — 긴 텍스트 허용, NULL 허용

    @Column(columnDefinition = "TEXT")
    private String snsUrl;                                 // 인스타그램 URL — NULL 허용

    @Column(columnDefinition = "TEXT")
    private String profileImageUrl;                        // 프로필 사진 URL — NULL 허용

    @Column(nullable = false)
    private String sourceType;                             // 출처 구분 (예: "ADMIN_CURATED")

    @Column(columnDefinition = "TEXT")
    private String sourceUrl;                              // 출처 URL — NULL 허용
}