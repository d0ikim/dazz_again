// 공연-뮤지션 연결 테이블 구조를 정의하는 파일
package com.dazz.again.domain.performance;

import com.dazz.again.domain.musician.Musician;     // 뮤지션 엔티티
import jakarta.persistence.EmbeddedId;              // 복합키 구조체를 PK로 사용한다고 선언하는 어노테이션
import jakarta.persistence.Entity;                  // 이 클래스가 DB 테이블과 연결된다고 선언하는 어노테이션
import jakarta.persistence.FetchType;               // 연관 엔티티를 언제 불러올지 전략을 지정하는 옵션
import jakarta.persistence.JoinColumn;              // 외래키(FK) 컬럼명을 지정하는 어노테이션
import jakarta.persistence.ManyToOne;               // 다대일 관계를 선언하는 어노테이션
import jakarta.persistence.MapsId;                  // 복합키의 특정 필드와 FK를 연결해주는 어노테이션
import jakarta.persistence.Table;                   // 연결할 DB 테이블 이름을 지정하는 어노테이션
import lombok.AccessLevel;                          // Lombok: 접근제어자 수준 설정에 사용
import lombok.AllArgsConstructor;                   // Lombok: 모든 필드를 받는 생성자를 자동 생성
import lombok.Builder;                              // Lombok: 빌더 패턴으로 객체를 생성할 수 있게 해줌
import lombok.Getter;                               // Lombok: 모든 필드의 getter 메서드를 자동 생성
import lombok.NoArgsConstructor;                    // Lombok: 파라미터 없는 기본 생성자를 자동 생성 (JPA 필수)

@Entity
@Table(name = "performance_lineup")                 // 연결할 테이블 이름을 "performance_lineup"으로 지정
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class PerformanceLineup {

    @EmbeddedId                                     // PerformanceLineupId 구조체를 이 엔티티의 PK로 사용
    private PerformanceLineupId id;

    @ManyToOne(fetch = FetchType.LAZY)              // 여러 라인업 행이 하나의 공연에 속함
    @MapsId("performanceId")                        // 복합키(id) 안의 performanceId 필드와 이 FK를 연결
    @JoinColumn(name = "performance_id")            // DB에서 FK 컬럼명은 "performance_id"
    private Performance performance;

    @ManyToOne(fetch = FetchType.LAZY)              // 여러 라인업 행이 하나의 뮤지션에 속함
    @MapsId("musicianId")                           // 복합키(id) 안의 musicianId 필드와 이 FK를 연결
    @JoinColumn(name = "musician_id")               // DB에서 FK 컬럼명은 "musician_id"
    private Musician musician;
}