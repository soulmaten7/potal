# F141/F144/F145 Education + Marketplace Exposure + Marketing Feed — 강화

> ⚠️ 이 3개 기능만 작업합니다.

## 현재 파일
- `app/api/v1/education/training/route.ts` — F141 교육/인증
- `app/api/v1/marketplace/exposure/route.ts` — F144/F145 마켓플레이스/피드

---

## F141 Education/Training — CRITICAL 2개

### C1: 학습 진도 추적 없음
코스 목록만 반환. 사용자별 진도/완료 상태 추적 안 됨.
**수정**: 사용자별 진도 추적
```typescript
// GET /education/training/progress
async function getUserProgress(userId: string): Promise<CourseProgress[]> {
  const { data } = await supabase.from('user_course_progress')
    .select('course_id, completed_lessons, total_lessons, last_accessed, completed_at')
    .eq('user_id', userId);

  return courses.map(course => ({
    ...course,
    progress: data?.find(p => p.course_id === course.id)?.completed_lessons || 0,
    totalLessons: course.lessons.length,
    completed: data?.find(p => p.course_id === course.id)?.completed_at || null,
    percentComplete: Math.round((progress / totalLessons) * 100)
  }));
}

// POST /education/training/complete-lesson
await supabase.from('user_course_progress').upsert({
  user_id: userId, course_id: courseId,
  completed_lessons: currentProgress + 1,
  last_accessed: new Date().toISOString()
});
```

### C2: 인증서 발급 없음
시험 통과해도 인증서 PDF 생성 안 됨.
**수정**: 인증서 생성
```typescript
if (examPassed) {
  const certId = `POTAL-CERT-${Date.now().toString(36).toUpperCase()}`;
  const certData = {
    id: certId, name: userName, course: courseName,
    issuedAt: new Date().toISOString(), validUntil: addYears(new Date(), 2),
    score: examScore
  };
  // DB 기록
  await supabase.from('user_certifications').insert({ user_id: userId, ...certData });
  // PDF 응답 옵션
  if (format === 'pdf') {
    return new Response(generateCertificatePdf(certData), { headers: { 'Content-Type': 'application/pdf' } });
  }
  return NextResponse.json(certData);
}
```

---

## F144 Marketplace Exposure — CRITICAL 2개

### C1: 마켓플레이스 가입 가이드 없음
지원 마켓플레이스 나열만. 각 마켓플레이스 셀러 가입 절차 안내 없음.
**수정**: 가입 가이드 추가
```typescript
const MARKETPLACE_GUIDES: Record<string, MarketplaceGuide> = {
  amazon_us: {
    signupUrl: 'https://sellercentral.amazon.com/gp/register',
    requirements: ['Business entity', 'Bank account', 'Tax ID', 'Product UPC/EAN'],
    fees: { monthly: 39.99, referral: '8-15%', fba: 'varies' },
    estimatedApproval: '1-3 business days'
  },
  coupang: {
    signupUrl: 'https://wing.coupang.com',
    requirements: ['Korean business registration', 'Bank account (Korean)', 'Product images'],
    fees: { monthly: 0, commission: '5-15%' },
    note: 'Korean business entity required'
  },
};
```

### C2: 상품 적합성 분석 없음
"이 상품이 어느 마켓플레이스에 적합한가" 추천 없음.
**수정**: 간단한 적합성 분석
```typescript
function recommendMarketplaces(product: ProductInfo): MarketplaceRecommendation[] {
  const recommendations = [];
  if (product.category === 'electronics') recommendations.push({ marketplace: 'amazon_us', fit: 'high' });
  if (product.originCountry === 'KR') recommendations.push({ marketplace: 'coupang', fit: 'high' });
  if (product.price < 50) recommendations.push({ marketplace: 'shopee', fit: 'high' });
  if (product.isHandmade) recommendations.push({ marketplace: 'etsy', fit: 'high' });
  return recommendations.sort((a, b) => fitScore(b.fit) - fitScore(a.fit));
}
```

---

## F145 Marketing Feed Generation — CRITICAL 2개

### C1: 피드 DDP 가격 미포함
상품 피드에 관세/세금 포함 가격(DDP) 미표시. Google Shopping에서 가격 불일치 → 정지 위험.
**수정**: DDP 가격 계산 포함
```typescript
for (const product of products) {
  const landedCost = await calculateLandedCost({
    hsCode: product.hsCode, originCountry: product.origin,
    destinationCountry: targetCountry, declaredValue: product.price
  });
  product.ddpPrice = product.price + (landedCost.totalDuties || 0) + (landedCost.totalTaxes || 0);
  product.localPrice = product.ddpPrice * exchangeRate;
  product.localCurrency = countryCurrency[targetCountry];
}
```

### C2: 피드 유효성 검증 없음
생성된 피드가 Google/Amazon 규격에 맞는지 검증 안 함.
**수정**: 피드별 필수 필드 검증
```typescript
const FEED_REQUIRED_FIELDS: Record<string, string[]> = {
  google_shopping: ['title', 'description', 'link', 'image_link', 'price', 'availability', 'gtin'],
  facebook: ['title', 'description', 'availability', 'image_url', 'url', 'price'],
  amazon: ['sku', 'title', 'price', 'quantity', 'product_type'],
};
const missing = FEED_REQUIRED_FIELDS[feedType]?.filter(f => !product[f]);
if (missing?.length > 0) {
  validationErrors.push({ product: product.id, missingFields: missing });
}
```

## 테스트 8개
```
1. F141: 레슨 완료 → progress 증가
2. F141: 시험 통과 → 인증서 발급
3. F144: 마켓플레이스 가이드 → signupUrl 포함
4. F144: 전자제품 → amazon 추천
5. F144: 핸드메이드 → etsy 추천
6. F145: Google Shopping 피드 → DDP 가격 포함
7. F145: 필수 필드 누락 → validationErrors
8. F141: 인증서 PDF → Content-Type: application/pdf
```
