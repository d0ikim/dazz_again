// ADMIN이 공연을 등록하거나 수정할 때 클라이언트에서 받는 요청 데이터를 담는 파일
package com.dazz.again.domain.performance;

import lombok.Getter;        // 모든 필드에 getter 메서드를 자동 생성
import lombok.NoArgsConstructor; // 파라미터 없는 기본 생성자 자동 생성 — Spring이 JSON을 이 객체로 변환할 때 필요

import java.time.LocalDateTime; // 공연 일시를 담기 위한 날짜+시각 타입
import java.util.List;          // 출연 뮤지션 id를 여러 개 담기 위한 컬렉션 타입

// @Entity 없음 — DB 테이블이 아니라 요청 데이터를 잠시 담는 그릇(DTO)
@Getter
@NoArgsConstructor
public class PerformanceRequest {

    private Long venueId;           // 공연이 열리는 공연장 ID (필수) — venue 테이블의 id 참조
    private LocalDateTime startTime; // 공연 일시 (필수, 예: "2026-07-01T20:00:00")
    private String title;           // 공연명 (필수)
    private String genre;           // 장르 (선택)
    private String setInfo;         // 세트 정보 (선택, 예: "1부(20:00) 2부(21:00)")
    private String setList;         // 셋리스트 (선택, 곡명 콤마 구분)
    private boolean cancelled;      // 취소 여부 (필수, 기본값 false)
    private String sourceUrl;       // 출처 URL (선택)
    private List<Long> musicianIds; // 출연 뮤지션 id 목록 (선택) — null이면 라인업을 건드리지 않고, 값이 있으면 라인업을 이 목록으로 통째로 교체
}