// 공연 DB테이블 구조를 정의하는 파일
package com.dazz.again.domain.performance;

import com.dazz.again.domain.venue.Venue;                  // 공연장 엔티티
import com.fasterxml.jackson.annotation.JsonPropertyOrder; // JSON 응답 필드 순서를 지정하는 어노테이션
import jakarta.persistence.Column;                         // DB 컬럼 속성을 설정하는 어노테이션
import jakarta.persistence.Entity;                         // 이 클래스가 DB 테이블과 연결된다고 선언하는 어노테이션
import jakarta.persistence.FetchType;                      // 연관 엔티티를 언제 불러올지 전략을 지정하는 옵션
import jakarta.persistence.GeneratedValue;                 // PK 값을 자동으로 생성해주는 어노테이션
import jakarta.persistence.GenerationType;                 // PK 자동 생성 전략 종류 (IDENTITY = DB가 알아서 증가)
import jakarta.persistence.Id;                             // 이 필드가 PK(기본키)임을 선언하는 어노테이션
import jakarta.persistence.JoinColumn;                     // 외래키(FK) 컬럼명을 지정하는 어노테이션
import jakarta.persistence.ManyToOne;                      // 다대일 관계를 선언하는 어노테이션
import jakarta.persistence.Table;                          // 연결할 DB 테이블 이름을 지정하는 어노테이션
import lombok.AccessLevel;                                 // Lombok: 접근제어자 수준 설정에 사용
import lombok.AllArgsConstructor;                          // Lombok: 모든 필드를 받는 생성자를 자동 생성
import lombok.Builder;                                     // Lombok: 빌더 패턴으로 객체를 생성할 수 있게 해줌
import lombok.Getter;                                      // Lombok: 모든 필드의 getter 메서드를 자동 생성
import lombok.NoArgsConstructor;                           // Lombok: 파라미터 없는 기본 생성자를 자동 생성 (JPA 필수)

import java.time.LocalDateTime;                            // 날짜+시간을 함께 저장하는 자바 타입

@JsonPropertyOrder({"id", "venue", "startTime", "title", "genre", "setInfo", "setList", "cancelled", "sourceUrl"})
@Entity
@Table(name = "performance")                               // 연결할 테이블 이름을 "performance"로 지정
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Performance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)    // INSERT 시 DB가 1, 2, 3... 자동으로 ID 부여
    private Long id;                                       // 공연 고유 번호

    @ManyToOne(fetch = FetchType.LAZY)                     // 여러 공연이 하나의 공연장에 속함
    @JoinColumn(name = "venue_id", nullable = false)       // DB에서 FK 컬럼명은 "venue_id", NULL 불가
    private Venue venue;                                   // 공연장 (공연 조회 시 공연장 정보도 함께 반환)

    @Column(nullable = false)
    private LocalDateTime startTime;                       // 공연 일시 (예: 2026-05-21T20:00:00)

    @Column(nullable = false)
    private String title;                                  // 공연명 (예: "The Steady Duo")

    @Column
    private String genre;                                  // 장르 — NULL 허용 (표기된 공연만 값 존재)

    @Column(columnDefinition = "TEXT")
    private String setInfo;                                // 세트 정보 — NULL 허용 (예: "1부(20:00-20:40) 2부(21:00-21:40)")

    @Column(columnDefinition = "TEXT")
    private String setList;                                // 셋리스트 — NULL 허용 (곡명 콤마 구분)

    @Column(name = "is_cancelled", nullable = false)       // Lombok @Getter규칙(boolean은 is를 자동으로붙임)
    private boolean cancelled;                             // 취소 여부 (true = 취소된 공연)

    @Column(columnDefinition = "TEXT")
    private String sourceUrl;                              // 출처 URL — NULL 허용 (인스타 포스트 링크)
}