// 공연라인업 테이블의 복합키(PK) 구조를 정의하는 파일
package com.dazz.again.domain.performance;

import jakarta.persistence.Column;      // DB 컬럼 속성을 설정하는 어노테이션
import jakarta.persistence.Embeddable; // 이 클래스가 다른 엔티티에 PK로 내장(embed)될 수 있음을 선언
import lombok.AllArgsConstructor;      // Lombok: 모든 필드를 받는 생성자를 자동 생성
import lombok.EqualsAndHashCode;       // Lombok: equals()와 hashCode() 메서드를 자동 생성 (JPA 복합키 비교에 필수)
import lombok.NoArgsConstructor;       // Lombok: 파라미터 없는 기본 생성자를 자동 생성 (JPA 필수)

import java.io.Serializable;           // 복합키 클래스는 반드시 Serializable을 구현해야 함 (JPA 규칙)

@Embeddable                            // JPA에게 "이 클래스는 PK 구조체야, 다른 엔티티 안에 내장해서 써"라고 알림
@NoArgsConstructor                     // JPA가 내부적으로 빈 객체를 만들 때 사용
@AllArgsConstructor                    // new PerformanceLineupId(1L, 4L) 방식으로 직접 생성 가능
@EqualsAndHashCode                     // (1L, 4L)과 (1L, 4L)이 같은 PK인지 비교할 때 자동으로 동작
public class PerformanceLineupId implements Serializable {

    @Column(name = "performance_id")   // DB 컬럼명을 명시적으로 지정
    private Long performanceId;        // 공연 ID (performance 테이블의 id 참조)

    @Column(name = "musician_id")      // DB 컬럼명을 명시적으로 지정
    private Long musicianId;           // 뮤지션 ID (musician 테이블의 id 참조)
}