# 콜드이메일 규칙
> 마지막 업데이트: 2026-03-30 07:00 KST

## 필수 사전 읽기
- **콜드이메일 작성/발송 시 반드시 `POTAL_Cold_Email_Master.xlsx`를 먼저 읽을 것**

## 엑셀 시트 구성
| 시트명 | 내용 |
|--------|------|
| 이메일템플릿_EN | 본문 텍스트 |
| 경쟁사비교표 | 가격+기능 비교 (Avalara $1,500+ / Zonos $4,000+ / POTAL $0) |
| 국가별앵글 | 국가별 맞춤 메시지 |
| 발송규칙 | 발송 타이밍, 주의사항 |
| 검증결과 | 이메일 유효성 검증 결과 |

## 본문 필수 포함
- 경쟁사 비교 (Avalara $1,500+/mo / Zonos $4,000+/mo / POTAL $0 — Forever Free)

## 발송 대상
- `data/MASTER_TARGET_LIST.csv`의 `verified_email` 있는 회사만 발송
- verified_email 없는 회사는 절대 발송 금지

## 사용 금지 파일 (아카이브됨)
- `marketing/cold-email-final.md` → `archive/cold-email-old/`로 이동됨
- `cold-email-comparison-chart.html` → `archive/cold-email-old/`로 이동됨
