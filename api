// 파일 위치: /api/gemini.js
export default async function handler(req, res) {
    // POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { userInput, systemPrompt, modelType } = req.body;
    
    // Vercel 대시보드에 설정하신 환경 변수 (GEMINI_API_KEY)
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: '서버 환경 변수에 Gemini API 키가 설정되지 않았습니다.' });
    }

    try {
        const isTTS = modelType === 'gemini-2.5-flash-preview-tts';
        let payload;

        // 음성(TTS)과 일반 텍스트 모델의 페이로드 구조 분기
        if (isTTS) {
            payload = {
                contents: [{ parts: [{ text: "Say professionally and clearly: " + userInput.substring(0, 1000) }] }],
                generationConfig: {
                    responseModalities: ["AUDIO"],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } }
                }
            };
        } else {
            payload = {
                contents: [{ parts: [{ text: userInput }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] }
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
