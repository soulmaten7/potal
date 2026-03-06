# 아침 TODO 체크리스트 (세션 25 완료 후)

> 생성: 2026-03-06 | Claude가 밤새 작업 완료 후 은태님이 직접 진행해야 하는 항목

---

## 1. Git Push (필수 — 모든 변경사항 반영)

```bash
cd ~/portal
git add -A
git commit -m "chore: Cost Engine major upgrade - 181 countries, 97 HS chapters, 63 FTAs, 7 govt APIs, India/Brazil tax, Section 301 update"
git push origin main
```

> ⚠️ push 전에 `npm run build` 한번 더 확인 권장 (Claude가 빌드 통과 확인함)

---

## 2. Vercel 배포 확인

- Git push 후 Vercel에서 자동 배포됨
- https://potal.app 접속 → 홈페이지에 "181 countries"로 표시되는지 확인
- https://www.potal.app/api/v1/countries 호출 → 181개국 리스트 확인

---

## 3. Shopify 임베디드 앱 확인 + 심사 제출

- [ ] Shopify Partner Dashboard → Apps → POTAL
- [ ] "임베디드 앱 확인" 상태 체크 (자동 확인 최대 2시간)
- [ ] 확인 완료되면 → **"검토를 위해 제출"** 클릭
- [ ] 심사 기간: 7~14일

---

## 4. ITIN 신청 (Stripe Live mode 필수)

- [ ] IRS Acceptance Agent 또는 제주도 세무사 알아보기
- [ ] 여권 공증 준비
- [ ] Form W-7 + Form 1040-NR 작성
- [ ] 제출: IRS Austin, TX 73301-0215 (우편) 또는 대행 세무사
- 소요: 7~11주

---

## 5. Supabase 마이그레이션 확인 (이미 실행했다면 스킵)

- [ ] `supabase/migrations/003_b2b_schema.sql` 이미 실행되었는지 확인
- [ ] 안 되어 있다면 Supabase SQL Editor에서 실행

---

## 6. 선택 사항 (시간 될 때)

- [ ] RapidAPI 유료 구독 전부 취소 (Amazon PRO $25/mo 등)
- [ ] Product Hunt 런치 준비 (PRODUCT_HUNT_LAUNCH_PLAN.md 참조)
- [ ] Custom GPT / Gemini Gem / MCP 서버 업데이트 (181개국 반영)
  - GPT: "181 countries" 문구 업데이트
  - MCP: mcp-server 이미 코드에 반영됨, 재빌드 필요 (`cd mcp-server && npm run build`)
  - Gemini: CSV 재업로드 필요 (country-duty-reference.csv에 181개국)

---

## 밤새 완료한 작업 요약

| # | 작업 | 상태 |
|---|------|------|
| 1 | 4개 신규 관세 API Provider (CA, AU, JP, KR) | ✅ |
| 2 | country-data.ts 137→181개국 | ✅ |
| 3 | HS 챕터 56→97개 (전체 커버) | ✅ |
| 4 | FTA 27→63개 협정 | ✅ |
| 5 | India 세금 (BCD+SWS+IGST 캐스케이딩) | ✅ |
| 6 | Section 301 tariffs 2025/2026 업데이트 | ✅ |
| 7 | 8개국 processing fees 추가 | ✅ |
| 8 | Batch calculation 병렬화 (Promise.allSettled) | ✅ |
| 9 | Frontend/Docs/i18n 139→181 업데이트 (50+파일) | ✅ |
| 10 | session-context.md 업데이트 | ✅ |
| 11 | npm run build 통과 확인 | ✅ |
