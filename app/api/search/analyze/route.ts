import { NextRequest, NextResponse } from 'next/server';

// [설정] true로 변경하여 실제 OpenAI를 사용합니다.
const USE_REAL_AI = true; 

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File;

    // 1. 파일 유효성 검사
    if (!image) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    // 파일 크기 체크 (5MB 제한)
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 400 });
    }

    console.log(`[Vision API] Received image: ${image.name} (${image.size} bytes)`);

    let resultKeywords = "";

    // 2. AI 분석 시작
    if (USE_REAL_AI) {
      // API Key 확인
      if (!process.env.OPENAI_API_KEY) {
        console.error("Error: OPENAI_API_KEY is missing.");
        throw new Error("Server configuration error: API Key missing");
      }

      // 실제 OpenAI Vision API 호출
      resultKeywords = await analyzeWithOpenAI(image);
      console.log(`[Vision API] Real Analysis Result: "${resultKeywords}"`);
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
 */
async function analyzeWithOpenAI(file: File): Promise<string> {
  // 1. 파일을 Base64 문자열로 변환
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Image = buffer.toString('base64');
  const mimeType = file.type || 'image/jpeg';

  // 2. OpenAI API 호출
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o", // Vision 기능이 포함된 최신 모델
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Identify the main product in this image. Return ONLY the precise product name and model number (if visible). Do not add any conversational filler like 'This is...' or 'The image shows...'." 
            },
            { 
              type: "image_url", 
              image_url: { 
                url: `data:${mimeType};base64,${base64Image}` 
              } 
            }
          ]
        }
      ],
      max_tokens: 100 // 짧고 간결한 상품명만 받기 위해 토큰 제한
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