import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from "../types";

// Initialize the client. 
// SECURITY NOTE: In a production app, never expose API keys on the client. 
// This should be proxied through a backend.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    cattleCount: {
      type: Type.NUMBER,
      description: "Número aproximado de animais identificados na imagem.",
    },
    healthScore: {
      type: Type.NUMBER,
      description: "Uma pontuação de saúde geral de 0 a 100 baseada na aparência visual (100 = perfeito, 0 = crítico).",
    },
    identifiedIssues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          issue: {
            type: Type.STRING,
            description: "Nome curto do problema identificado (ex: Manqueira, Magreza, Isolamento)."
          },
          description: {
            type: Type.STRING,
            description: "Uma explicação detalhada do que foi observado visualmente na imagem relacionado a este problema."
          },
          possibleCauses: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Lista de possíveis causas prováveis para este problema (nutricional, doença, trauma, etc)."
          }
        },
        required: ["issue", "description", "possibleCauses"]
      },
      description: "Lista detalhada de problemas visuais detectados.",
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Ações recomendadas para o fazendeiro ou veterinário.",
    },
    summary: {
      type: Type.STRING,
      description: "Um breve resumo técnico da análise visual.",
    }
  },
  required: ["cattleCount", "healthScore", "identifiedIssues", "recommendations", "summary"],
};

export const analyzeFrame = async (base64Image: string): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key não configurada. Por favor, configure a chave da API do Google Gemini.");
  }

  try {
    // We use gemini-2.5-flash for speed and multimodal capabilities
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming JPEG for simplicity from canvas/input
              data: base64Image,
            },
          },
          {
            text: `Você é o sistema Smart Ranch AI Vision. Analise esta imagem de gado. 
            Identifique padrões de saúde visual, condição corporal (BCS), postura e comportamento.
            Se a imagem não contiver gado, retorne 0 contagem e score null.
            Para cada problema identificado, forneça uma descrição visual clara e possíveis causas veterinárias ou de manejo.
            Seja preciso e técnico.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.4, // Lower temperature for more analytical results
      },
    });

    const text = response.text;
    if (!text) throw new Error("Sem resposta do modelo.");

    const json = JSON.parse(text);

    return {
      timestamp: new Date().toISOString(),
      cattleCount: json.cattleCount || 0,
      identifiedIssues: json.identifiedIssues || [],
      healthScore: json.healthScore || 0,
      recommendations: json.recommendations || [],
      rawAnalysis: json.summary || "Análise concluída.",
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};