import { NextRequest, NextResponse } from 'next/server';

// [설정] true로 변경하여 실제 OpenAI를 사용합니다.
const USE_REAL_AI = true;

// ── Rate limiting for Vision API (expensive endpoint) ──
const VISION_RATE_LIMIT_WINDOW = 60_000; // 1분
const VISION_RATE_LIMIT_MAX = 5; // 1분당 최대 5회 (비용 보호)
const visionRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isVisionRateLimited(ip: string): boolean {
  const now = Date.now();
  // Lazy cleanup
  if (visionRateLimitMap.size > 1000) {
    for (const [key, entry] of visionRateLimitMap) {
      if (now > entry.resetAt) visionRateLimitMap.delete(key);
    }
  }
  const entry = visionRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    visionRateLimitMap.set(ip, { count: 1, resetAt: now + VISION_RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > VISION_RATE_LIMIT_MAX;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    if (isVisionRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many image analysis requests. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
    const formData = await req.formData();
    const image = formData.get('image') as File;
    const userText = (formData.get('userText') as string) || '';  // 사용자가 입력한 텍스트 컨텍스트

    // 1. 파일 유효성 검사
    if (!image) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    // 파일 크기 체크 (5MB 제한)
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 400 });
    }

    // 이미지 형식 검증 (MIME type whitelist)
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (image.type && !ALLOWED_TYPES.includes(image.type)) {
      return NextResponse.json({ error: `Unsupported image format: ${image.type}. Use JPEG, PNG, GIF, or WebP.` }, { status: 400 });
    }

    let resultKeywords = "";

    // 2. AI 분석 시작
    if (USE_REAL_AI) {
      // API Key 확인
      if (!process.env.OPENAI_API_KEY) {
        console.error("Error: OPENAI_API_KEY is missing.");
        throw new Error("Server configuration error: API Key missing");
      }

      // 실제 OpenAI Vision API 호출 (15초 타임아웃)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        resultKeywords = await analyzeWithOpenAI(image, userText, controller.signal);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          throw new Error('Image analysis timed out (15s). Please try again.');
        }
        throw err;
      } finally {
        clearTimeout(timeout);
      }
    } else {
      // (테스트용) 시뮬레이션 모드
      await new Promise(resolve => setTimeout(resolve, 1500));
      resultKeywords = "Simulation: Lego Star Wars";
    }

    // 3. 결과 반환
    return NextResponse.json({
      success: true,
      keywords: resultKeywords,
      message: "Image analyzed successfully"
    });

  } catch (error: any) {
    console.error("[Vision API Error]", error);
    return NextResponse.json({ error: error.message || 'Failed to analyze image' }, { status: 500 });
  }
}

/**
 * OpenAI (GPT-4o) 연동 함수
 * 이미지를 Base64로 변환하여 전송하고, 상품명 텍스트만 받아옵니다.
 * @param userText 사용자가 검색창에 입력한 텍스트 (컨텍스트로 활용)
 * @param signal AbortController signal (타임아웃 지원)
 */
async function analyzeWithOpenAI(file: File, userText: string = '', signal?: AbortSignal): Promise<string> {
  // 1. 파일을 Base64 문자열로 변환
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Image = buffer.toString('base64');
  const mimeType = file.type || 'image/jpeg';

  // 2. 프롬프트 구성 — 사용자 텍스트가 있으면 컨텍스트로 포함
  let promptText = "Identify the main product in this image. Return ONLY the precise product name, brand, and model number (if visible) as a concise search query. Do not add any conversational filler like 'This is...' or 'The image shows...'.";
  if (userText.trim()) {
    // Prompt injection defense: limit length + strip control chars + neutralize injection attempts
    const sanitizedText = userText.trim()
      .slice(0, 200)
      .replace(/[\x00-\x1F\x7F]/g, '')
      .replace(/["""''`]/g, '')          // Strip quote variants
      .replace(/\b(ignore|disregard|forget|system|assistant|prompt)\b/gi, ''); // Strip injection keywords
    if (sanitizedText) {
      promptText += `\n\nThe user also described this product as: "${sanitizedText}". Use this context to produce a more accurate product search query.`;
    }
  }

  // 3. OpenAI API 호출
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    signal, // 타임아웃 지원
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: promptText },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 100
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API Error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content?.trim();

  // AI가 가끔 "I cannot identify..." 라고 할 때가 있으므로 빈 문자열 처리
  return content || "";
}