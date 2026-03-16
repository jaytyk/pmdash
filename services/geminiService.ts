
import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = () => {
  const key = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!key || key === 'undefined') {
    console.warn("Gemini API Key가 설정되지 않았습니다. .env 파일을 확인해주세요.");
    return "NO_API_KEY";
  }
  return key;
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const generateTemplate = async (
  type: 'CHARTER' | 'REQUIREMENTS' | 'WEEKLY_REPORT' | 'RETROSPECTIVE',
  projectData: { name: string; description: string; status: string }
) => {
  const prompt = `
    당신은 숙련된 IT 프로젝트 매니저입니다. 
    다음 프로젝트 정보를 바탕으로 전문적인 ${type} 템플릿 내용을 한국어로 작성해주세요.
    
    프로젝트명: ${projectData.name}
    상세설명: ${projectData.description}
    현재상태: ${projectData.status}
    
    출력 형식: Markdown
    내용은 매우 상세하고 전문적이어야 합니다.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "템플릿 생성 실패";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI 연동 중 오류가 발생했습니다.";
  }
};
