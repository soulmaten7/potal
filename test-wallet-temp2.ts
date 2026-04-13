// Voting 로직을 수동으로 재현해서 각 subheading별 투표 내역 확인
const subs = [
  { code: '420211', description: 'Trunks, suit-cases, vanity-cases, executive-cases, brief-cases, school satchels and similar containers; with outer surface of leather, of composition leather or of patent leather' },
  { code: '420221', description: 'Handbags, whether or not with shoulder strap, including those without handle; with outer surface of leather, of composition leather or of patent leather' },
  { code: '420231', description: 'Articles of a kind normally carried in the pocket or in the handbag; with outer surface of leather, of composition leather or of patent leather' },
  { code: '420291', description: 'Other; with outer surface of leather, of composition leather or of patent leather' },
  { code: '420299', description: 'Other' },
];

// Test 2 입력: description에 pocket/carried
const allWords = ['wallet', 'leather', 'goods', 'small', 'item', 'carried', 'pocket', 'holding', 'money', 'cards'];

console.log('=== 각 subheading별 투표 내역 (Test 2: pocket/carried) ===\n');
for (const s of subs) {
  const dl = s.description.toLowerCase();
  let votes = 0;
  const reasons: string[] = [];
  
  // material vote: "of leather" 패턴 매칭
  if (/\bof leather\b/.test(dl)) { votes++; reasons.push('material(leather)'); }
  
  // keyword vote: allWords 중 description에 있는 단어
  const dlWords = dl.split(/[\s;,()]+/);
  let kwMatch = false;
  for (const w of allWords) {
    if (w.length <= 2) continue;
    if (dlWords.some(dw => dw === w || dw.startsWith(w) || w.startsWith(dw))) {
      if (!kwMatch) { votes++; kwMatch = true; reasons.push(`keyword("${w}" in desc)`); }
    }
  }
  
  // n.e.c. check
  const isNec = dl.includes('n.e.c.') || dl.includes('n.e.s.') || dl.includes('not elsewhere');
  if (isNec) reasons.push('NEC(-1 penalty)');
  
  console.log(`${s.code}: votes=${votes} | ${reasons.join(', ') || 'none'}`);
  console.log(`  desc: ${dl.substring(0, 80)}...`);
  
  // 키워드 매칭 디테일
  const matched = allWords.filter(w => w.length > 2 && dlWords.some(dw => dw === w || dw.startsWith(w) || w.startsWith(dw)));
  console.log(`  matched words: [${matched.join(', ')}]`);
  console.log('');
}
