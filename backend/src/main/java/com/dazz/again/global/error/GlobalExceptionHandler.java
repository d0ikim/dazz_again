// 모든 컨트롤러에서 발생하는 예외를 한 곳에서 받아 일관된 형식의 에러 응답으로 변환하는 파일
package com.dazz.again.global.error;

import org.springframework.http.ResponseEntity;                        // HTTP 상태코드 + 응답 바디를 함께 반환하는 클래스
import org.springframework.web.bind.MethodArgumentNotValidException;   // @Valid 검증 실패 시 스프링이 던지는 예외
import org.springframework.web.bind.annotation.ExceptionHandler;       // "이 예외가 발생하면 이 메서드가 처리한다"고 지정하는 어노테이션
import org.springframework.web.bind.annotation.RestControllerAdvice;   // 모든 @RestController의 예외를 가로채는 전역 처리기임을 선언

import java.util.LinkedHashMap; // 필드 순서가 유지되는 Map (에러 메시지를 필드 선언 순서대로 보여주기 위함)
import java.util.Map;

// @RestControllerAdvice: 프로젝트의 모든 컨트롤러에 공통으로 적용되는 "예외 처리 전담반"
// 컨트롤러마다 try-catch를 쓰는 대신, 여기 한 곳에서 예외 → 에러 응답 변환을 담당한다
@RestControllerAdvice
public class GlobalExceptionHandler {

    // @Valid 검증 실패 처리 — DTO의 @Pattern 등 검증에 걸리면 스프링이
    // MethodArgumentNotValidException을 던지는데, 그걸 여기서 받아서
    // { "필드명": "에러 메시지" } 형태의 400 응답으로 바꿔준다
    // (이 핸들러가 없으면 클라이언트는 알아보기 힘든 기본 에러 응답을 받게 됨)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationError(MethodArgumentNotValidException e) {
        Map<String, String> errors = new LinkedHashMap<>();

        // 검증에 실패한 필드가 여러 개일 수 있으므로 전부 모아서 담음
        e.getBindingResult().getFieldErrors().forEach(
                fieldError -> errors.put(fieldError.getField(), fieldError.getDefaultMessage())
        );

        // 400 Bad Request + 예: { "snsUrl": "URL 형식이 아닙니다 (예: https://instagram.com/dazz)" }
        return ResponseEntity.badRequest().body(errors);
    }
}
