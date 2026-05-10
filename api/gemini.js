// 파일 위치: /api/gemini.js
export default async function handler(req, res) {
    // POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 기존 const를 let으로 변경하여, 지원 중단된 모델명이 들어왔을 때 값을 덮어쓸 수 있도록 조치
    let { userInput, systemPrompt, modelType } = req.body;
    
    // Vercel 대시보드에 설정하신 환경 변수 (GEMINI_API_KEY)
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: '서버 환경 변수에 Gemini API 키가 설정되지 않았습니다.' });
    }

    // 프론트엔드에서 모델명을 누락했거나 서비스 종료된 1.5 버전을 보낸 경우, 최신 안정화 모델로 강제 보정
    if (!modelType || modelType.includes('1.5')) {
        modelType = 'gemini-2.5-flash'; // 안정적으로 서비스되는 최신 모델로 대체
    }

    try {
        const isTTS = modelType === 'gemini-2.5-flash-preview-tts';
        let payload;

        // 예기치 않은 null/undefined 입력으로 인한 TypeError 방지 처리 보강
        const safeUserInput = userInput || "";
        const safeSystemPrompt = systemPrompt || "";

        // 음성(TTS)과 일반 텍스트 모델의 페이로드 구조 분기
        if (isTTS) {
            payload = {
                contents: [{ parts: [{ text: "Say professionally and clearly: " + safeUserInput.substring(0, 1000) }] }],
                generationConfig: {
                    responseModalities: ["AUDIO"],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } }
                }
            };
        } else {
            payload = {
                contents: [{ parts: [{ text: safeUserInput }] }],
                systemInstruction: { parts: [{ text: safeSystemPrompt }] }
            };
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelType}:generateContent?key=${apiKey}`;
        
        // 구글 Gemini 서버와 직접 통신
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: `Gemini API 호출 실패: ${errorText}` });
        }

        const data = await response.json();
        
        // 분석 결과를 프론트엔드로 전달
        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({ error: '서버 내부 통신 오류: ' + error.message });
    }
}
