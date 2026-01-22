
import { GoogleGenAI, Type } from "@google/genai";
import { ScenarioInput, AnalysisResult, ComplianceStatus, ChatMessage } from "../types";
import { MOCK_LEGAL_CHUNKS, SYSTEM_PROMPT } from "../constants";

// Use process.env.API_KEY directly as per initialization guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeScenario = async (input: ScenarioInput): Promise<AnalysisResult> => {
  const context = JSON.stringify(MOCK_LEGAL_CHUNKS);
  const userPrompt = `
  다음 시나리오를 분석하십시오:
  - 작업유형: ${input.work_type}
  - 인력구성: ${input.workforce}
  - 사용장비: ${input.equipment}
  - 작업환경: ${input.environment}
  - 추가정보: ${input.optional_text}

  참고할 법령 컨텍스트:
  ${context}

  중요: 각 체크리스트 항목(checklist item)에 대해 해당 판정의 근거가 되는 구체적인 법령 명칭과 조항 번호(legal_basis)를 반드시 포함하십시오.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          checklist: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                item_title: { type: Type.STRING },
                status: { type: Type.STRING, enum: Object.values(ComplianceStatus) },
                why_it_matters: { type: Type.STRING },
                required_action: { type: Type.STRING },
                legal_basis: { type: Type.STRING, description: "근거 법령 및 조항 (예: 산업안전보건법 제38조)" },
                evidence: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["item_title", "status", "why_it_matters", "required_action", "legal_basis", "evidence"],
            },
          },
          risk_assessment: {
            type: Type.OBJECT,
            properties: {
              overview: { type: Type.STRING },
              hazards: { type: Type.ARRAY, items: { type: Type.STRING } },
              measures: { type: Type.ARRAY, items: { type: Type.STRING } },
              residual_risk: { type: Type.STRING },
              legal_basis: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
          compliance_evaluation: {
            type: Type.OBJECT,
            properties: {
              applied_laws: { type: Type.ARRAY, items: { type: Type.STRING } },
              summary: { type: Type.STRING },
              improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
              legal_basis: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
          summary_stats: {
            type: Type.OBJECT,
            properties: {
              total_items: { type: Type.NUMBER },
              fail_count: { type: Type.NUMBER },
              warn_count: { type: Type.NUMBER },
              top_3_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
        },
        required: ["checklist", "risk_assessment", "compliance_evaluation", "summary_stats"],
      },
    },
  });

  const raw = response.text || "{}";
  const parsed = JSON.parse(raw);
  
  return {
    ...parsed,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    scenario: input
  };
};

export const chatWithLegalAI = async (message: string, history: ChatMessage[]): Promise<string> => {
  const context = JSON.stringify(MOCK_LEGAL_CHUNKS);
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      컨텍스트: ${context}
      사용자 메시지: ${message}
      이전 대화 내용: ${JSON.stringify(history.slice(-5))}
    `,
    config: {
      systemInstruction: SYSTEM_PROMPT + "\n대화형으로 답하고 전문적이지만 쉬운 용어를 사용하세요."
    }
  });

  return response.text || "죄송합니다. 답변을 생성할 수 없습니다.";
};
