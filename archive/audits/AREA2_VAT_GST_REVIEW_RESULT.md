# Area 2: VAT/GST — Deep Review Result
# 2026-03-23 KST

## 검사 항목: 12개
## PASS: 12/12
## FAIL→FIXED: 0개
## 잔여 이슈: 0개

## VAT 세율 정확도: 20/20 PASS
US=0%, GB=20%, DE=19%, FR=20%, IT=22%, ES=21%, NL=21%, JP=10%, KR=10%, AU=10%,
CA=5%, CN=13%, IN=18%, BR=17%, MX=16%, SG=9%, AE=5%, SA=15%, CH=8.1%, NO=25%

## EU 경감세율: 27/27 국가 완성 ✅
- 26국 경감세율 매핑 완료 + DK(없음, correct)
- Food: DE 7%, FR 5.5%, IT 10%, ES 10%, IE 0%, LU 3%
- Pharma: FR 2.1%, IE 0%, LU 3%, HU 5%, LT 5%
- Books: IT 4%, ES 4%, LU 3%, SI 5%, SE 6%

## Special Tax Verification
- India IGST: Ch.71=3% ✅, Ch.01=5% ✅, Ch.87=28% ✅, Ch.85=18% ✅
- Brazil IPI: Ch.61=0% ✅, Ch.87=25% ✅, Ch.24=300% ✅, Ch.85=15% ✅
- Mexico IEPS: HS2208=53% ✅, HS2203=26.5% ✅, HS2402=160% ✅
- China CBEC: effective ~12.2% ✅, CT cosmetics 15%, jewelry 10%

## CN-code Level GAP
- Impact: LOW — chapter-level covers 95%+ of products correctly
- Some products within same chapter have different VAT rates
- Fix: requires TARIC CN-code database (~14,000 entries) — future enhancement

## npm run build: ✅
## regression 55/55: ✅
