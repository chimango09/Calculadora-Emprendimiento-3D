import { GoogleGenAI, Type } from "@google/genai";
import { Project, Filament, CalculationResult } from "../types";

export const getSmartPricingAdvice = async (
  project: Project,
  filaments: Filament[],
  calculation: CalculationResult,
) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const usedFilaments = project.filaments
      .map((pf) => {
        const f = filaments.find((fill) => fill.id === pf.filamentId);
        return `${pf.gramsUsed}g de ${f?.name || "Material estándar"} (${f?.material})`;
      })
      .join(", ");

    const prompt = `
      Actúa como un asesor financiero experto en manufactura aditiva e impresión 3D. 
      Analiza la viabilidad económica de este producto: "${project.name}".
      Descripción del diseño: ${project.description || "Sin descripción"}.
      Materiales técnicos: ${usedFilaments}.
      Tiempo de producción: ${project.printingHours}h.
      Inversión en Mano de Obra: $${project.postProcessingCost.toFixed(2)}.
      Insumos adicionales: $${calculation.totalAccessoryCost.toFixed(2)}.
      Coste de fabricación unitario (base): $${calculation.subtotal.toFixed(2)}.
      Punto de equilibrio sugerido (margen ${project.profitMargin}%): $${calculation.totalPrice.toFixed(2)}.

      Proporciona una recomendación de precio basada en el mercado actual de decoración 3D.
      ¿Es un producto de lujo, decoración premium o de consumo masivo?
      Sugiere un precio de venta optimizado y una breve estrategia de marketing.
      Responde estrictamente en formato JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advice: {
              type: Type.STRING,
              description: "Análisis estratégico y consejos de mercado.",
            },
            suggestedPrice: {
              type: Type.NUMBER,
              description: "Precio de venta al público sugerido.",
            },
            perceivedValue: {
              type: Type.STRING,
              description: "Categoría: Lujo, Premium o Volumen",
            },
          },
          propertyOrdering: ["advice", "suggestedPrice", "perceivedValue"],
        },
      },
    });

    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return null;
  }
};
