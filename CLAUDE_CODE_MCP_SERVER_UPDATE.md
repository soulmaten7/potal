# MCP Server 수치 업데이트 + npm publish 명령어
# 생성: 2026-03-24 KST (Cowork CW18 8차)
# 목적: MCP Server의 description과 README에 최신 수치 반영 후 버전 올려서 npm publish

---

## 변경할 수치 (옛날 → 최신)

| 항목 | 현재 값 (잘못됨) | 최신 값 (정확) |
|------|----------------|--------------|
| tariff records | 113M+ | 257M+ (MIN ~105M + AGR ~129M + NTLC 537K + 무역구제 119K) |
| HS mappings | 3,400+ | ~1.36M (product_hs_mappings) |
| gov tariff schedules | 89,842 | 131,794 (7개국 10자리) |
| HS vectors | 미언급 | 3,431건 |
| API endpoints | 미언급 | ~155+ |
| GRI Pipeline | 미언급 | Layer 2 완성 (592 codified rules, 100% accuracy) |
| 9-field classification | 미언급 | 9-field 100% HS Code accuracy |
| sanctions entries | 21,301 | 21,301 (변경 없음) |
| FTAs | 63 | 63 (변경 없음) |

---

## 수정 대상 파일

### 1. `mcp-server/package.json`
- `description` 필드의 "113M+ tariff records" → "257M+ tariff records"
- `version` 올리기: "1.3.1" → "1.4.0" (수치 업데이트 = minor)

### 2. `mcp-server/README.md`
- 모든 수치를 위 표 기준으로 업데이트
- GRI Pipeline, 9-field accuracy, 131K tariff schedules 추가
- "1.36M product-to-HS mappings" 추가

### 3. `mcp-server/registry-metadata.json`
- description 수치 동일하게 업데이트

### 4. `mcp-server/src/index.ts` (또는 도구 설명이 있는 소스 파일)
- 도구(tool) description에 수치가 하드코딩되어 있으면 동일하게 업데이트
- "113M+" → "257M+", "3,400+" → "1.36M" 등

---

## 실행 절차

```bash
# 1. 파일 수정
# package.json, README.md, registry-metadata.json, src/index.ts 수치 업데이트

# 2. 빌드
cd mcp-server
npm run build

# 3. 빌드 확인
node build/index.js --help 2>&1 | head -5

# 4. 버전 확인
cat package.json | grep version

# 5. npm publish
npm publish --access public

# 6. 확인
npm info potal-mcp-server version
```

---

## 추가: description 권장 문구

```
Calculate total landed costs for cross-border commerce. 240 countries, 257M+ tariff records, 131K government tariff schedules (7 countries, 10-digit), 1.36M product-HS mappings, 63 FTAs, 9-field 100% HS Code accuracy (GRI Pipeline), sanctions screening (21,301 entries). MCP server for Claude, Cursor, and any MCP-compatible AI.
```

---

## 엑셀 로깅 필수
`POTAL_Claude_Code_Work_Log.xlsx`에 기록할 것.
