# F002 Image-Based Classification — 프로덕션 강화

> ⚠️ 이 기능(F002)만 작업합니다. 다른 기능은 절대 수정하지 마세요.

## 현재 파일
- `app/api/v1/classify/image/route.ts` (79행) — 전용 이미지 분류 엔드포인트
- `app/lib/cost-engine/ai-classifier/claude-classifier.ts` (367-582행) — Claude Vision 통합

## CRITICAL 5개

### C1: API 키 없을 때 조용한 실패 (image/route.ts:34)
analyzeImageWithClaude()가 ANTHROPIC_API_KEY 없으면 null 반환 → 사용자는 "Image analysis failed" 500 에러만 봄
**수정**: API 키 없으면 명시적 503 에러 반환
```typescript
if (!process.env.ANTHROPIC_API_KEY) {
  return apiError(ApiErrorCode.SERVICE_UNAVAILABLE, 'Image classification service not configured. Contact support.');
}
```

### C2: JSON 파싱 실패 시 로깅 없음 (image/route.ts:85-86)
```typescript
const jsonMatch = text.match(/\{[\s\S]*\}/);
if (!jsonMatch) return null; // ← 원본 텍스트 로깅 없음
```
**수정**: 실패 시 원본 응답 로깅 + 구체적 에러 메시지
```typescript
if (!jsonMatch) {
  console.error('[F002] Claude Vision JSON parse failed. Raw response:', text.substring(0, 500));
  return { error: 'vision_parse_failed', rawResponsePreview: text.substring(0, 200) };
}
```

### C3: URL 이미지 크기 미검증 (route.ts:140-153)
이미지 URL에서 전체 다운로드 후 크기 체크 → 5MB 넘으면 네트워크 낭비
**수정**: HEAD 요청으로 Content-Length 사전 체크
```typescript
const headRes = await fetch(imageUrl, { method: 'HEAD' });
const contentLength = parseInt(headRes.headers.get('content-length') || '0');
if (contentLength > 5 * 1024 * 1024) {
  return apiError(ApiErrorCode.BAD_REQUEST, `Image too large (${Math.round(contentLength/1024/1024)}MB). Max 5MB.`);
}
```

### C4: Content-Type 폴백이 잘못됨 (route.ts:150)
```typescript
mediaType = imgRes.headers.get('content-type') || 'image/jpeg'; // PNG일 수 있음
```
**수정**: magic bytes로 실제 형식 감지
```typescript
const buffer = Buffer.from(await imgRes.arrayBuffer());
const mediaType = detectImageType(buffer); // PNG: 89 50 4E 47, JPEG: FF D8 FF, GIF: 47 49 46

function detectImageType(buf: Buffer): string {
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'image/png';
  if (buf[0] === 0xFF && buf[1] === 0xD8) return 'image/jpeg';
  if (buf[0] === 0x47 && buf[1] === 0x49) return 'image/gif';
  if (buf[0] === 0x52 && buf[1] === 0x49) return 'image/webp';
  return 'image/jpeg'; // 최후 폴백
}
```

### C5: Anthropic URL 이미지 스킵 (claude-classifier.ts:535)
```typescript
if (isUrl) return null; // Anthropic은 URL 이미지 불가 → 조용히 스킵
```
**수정**: URL이면 먼저 다운로드 후 base64로 변환하여 Anthropic에 전달

## MISSING 4개
M1: 애니메이션 GIF/WebP 감지 → 첫 프레임만 추출
M2: EXIF 회전 처리 → sharp 라이브러리로 auto-orient
M3: 대형 이미지 리사이즈 → 1024px 이하로 축소 (토큰 절약)
M4: OCR 폴백 → Vision 실패 시 Tesseract.js로 텍스트 추출 시도

## 수정할 파일: 2개 (image/route.ts, claude-classifier.ts)
## 테스트 8개
```
1. JPEG 이미지 업로드 → HS 코드 반환
2. PNG URL → 다운로드 + 분류 성공
3. 5MB 초과 이미지 URL → 400 에러 "Image too large"
4. API 키 미설정 → 503 에러 명시
5. Claude Vision JSON 파싱 실패 → 에러 로깅 + 구체적 메시지
6. WebP 이미지 → content-type 정확 감지
7. 1024px 초과 이미지 → 리사이즈 후 분류
8. EXIF 회전 이미지 → auto-orient 후 정상 분류
```

## 결과
```
=== F002 Image Classification — 강화 완료 ===
- 수정 파일: 2개
- CRITICAL 수정: 5개, MISSING 추가: 4개
- 테스트: 8개 | 빌드: PASS/FAIL
```
