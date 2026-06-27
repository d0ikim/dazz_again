// 뮤지션 REST API 엔드포인트를 정의하는 파일
package com.dazz.again.domain.musician;

import io.swagger.v3.oas.annotations.Operation;              // API 메서드 설명 어노테이션
import io.swagger.v3.oas.annotations.Parameter;              // API 파라미터 설명 어노테이션
import io.swagger.v3.oas.annotations.responses.ApiResponse;  // API 응답 코드 설명 어노테이션
import io.swagger.v3.oas.annotations.tags.Tag;               // API 그룹 이름 어노테이션
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.NoSuchElementException;

import java.util.List;

@Tag(name = "뮤지션 API", description = "서울 재즈 뮤지션 목록 조회 및 검색")
@RestController
@RequestMapping("/api/musicians")
@RequiredArgsConstructor
public class MusicianController {

    private final MusicianService musicianService;

    @Operation(
            summary = "전체 뮤지션 목록 조회",
            description = "등록된 모든 뮤지션 목록을 반환합니다."
    )
    @ApiResponse(responseCode = "200", description = "조회 성공")
    @GetMapping
    public ResponseEntity<List<Musician>> findAll() {
        List<Musician> musicians = musicianService.findAll();
        return ResponseEntity.ok(musicians);    // HTTP응답을 만들어야하므로 200상태코드까지 포함한 Entity를 포장해서 내보냄
    }

    @Operation(summary = "뮤지션 단건 조회", description = "id로 특정 뮤지션 1명을 조회합니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공")
    @ApiResponse(responseCode = "404", description = "해당 id의 뮤지션 없음")
    @GetMapping("/{id}")
    public ResponseEntity<Musician> findById(
            @Parameter(description = "뮤지션 id", example = "1")
            @PathVariable Long id
    ) {
        try {
            return ResponseEntity.ok(musicianService.findById(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(
            summary = "뮤지션 검색",
            description = """
                    활동명 또는 악기(포지션) 키워드로 뮤지션을 검색합니다.

                    **type 파라미터**
                    - `stageName` : 활동명으로 검색 (예: 조에스더)
                    - `position`  : 악기로 검색 (예: PIANO, VOCAL, DRUMS)
                    """
    )
    @ApiResponse(responseCode = "200", description = "검색 성공")
    @ApiResponse(responseCode = "400", description = "type 값이 stageName 또는 position이 아닌 경우")
    @GetMapping("/search")
    public ResponseEntity<List<Musician>> search(
            @Parameter(description = "검색 기준 (stageName: 활동명 검색 / position: 악기 검색)", example = "stageName")
            @RequestParam String type,
            @Parameter(description = "검색 키워드", example = "조에스더")
            @RequestParam String keyword
    ) {
        List<Musician> result;

        if (type.equals("stageName")) {
            result = musicianService.searchByStageName(keyword);
        } else if (type.equals("position")) {
            result = musicianService.searchByPosition(keyword);
        } else {
            return ResponseEntity.badRequest().build(); // 검색실패시에도 HTTP응답을 만들어 400상태코드까지 포함한 Entity를 포장해서 내보냄
        }

        return ResponseEntity.ok(result);
    }
}