import { GoogleGenAI, Type } from "@google/genai";
import { DIRECTORS } from "../data/compendium";
import { jsonrepair } from "jsonrepair";
import geminiConfig from "../gemini-config.json";

// Helper to get the latest API key safely
function getAI() {
  const apiKey = geminiConfig.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined. Please provide it in src/gemini-config.json or set it in the environment.");
  }
  return new GoogleGenAI({ apiKey });
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 6, initialDelay = 3000): Promise<T> {
  let lastError: any;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message?.toLowerCase() || "";
      const isRateLimit = error?.status === 429 || error?.code === 429 || 
                         errorMessage.includes('429') || 
                         errorMessage.includes('quota') || 
                         errorMessage.includes('rate limit');
      
      if (isRateLimit && i < maxRetries) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Gemini rate limited. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function transcribeAudio(audioBase64: string, mimeType: string) {
  try {
    return await withRetry(async () => {
      const ai = getAI();
      const result = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: {
          parts: [
            { text: "Listen to this audio and provide the lyrics or a detailed description of the musical composition if it is instrumental. Be precise. Return ONLY the text of the lyrics or description." },
            { inlineData: { data: audioBase64, mimeType } }
          ]
        }
      });

      if (!result.text) {
        console.warn("Gemini returned empty text for transcription.");
        return "Lyrics not found or audio could not be processed.";
      }

      return result.text;
    });
  } catch (error) {
    console.error("Transcription failed error detail:", error);
    if (error instanceof Error) {
      throw new Error(`Transcription failed: ${error.message}`);
    }
    throw new Error("Transcription failed due to an unknown error.");
  }
}

export async function suggestConcept(lyrics: string) {
  try {
    return await withRetry(async () => {
      const ai = getAI();
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on these lyrics, propose a creative and cinematic music video concept in one paragraph. Focus on visual atmosphere, tone, and metaphors. Use professional cinematography language.\n\nLyrics: ${lyrics}`,
      });

      return result.text || "No concept suggested.";
    });
  } catch (error) {
    console.error("Concept suggestion failed:", error);
    throw error;
  }
}

export async function generateStoryboard(
  songDescription: string, 
  videoConcept: string, 
  numCharacters: number, 
  directorId: string, 
  videoType: string, 
  duration: number,
  referenceImages: {data: string, mimeType: string}[]
) {
  const director = DIRECTORS.find(d => d.id === directorId) || DIRECTORS[0];
  const numScenes = Math.ceil(duration / 8);

  const systemInstruction = `You are a professional Music Video Director and Creative Strategist. 
Your task is to generate a master creative brief and a shot list for a music video.

VISUAL STYLE MANDATE:
All shots and reference assets must be described for HIGHEST visual quality:
- Style: Hyper-realistic mode, cinematic style.
- Quality: No plastic image, professional cinematography, 8k resolution, meticulously detailed textures, high-fidelity surfaces.
- Lighting: High-end production value, dramatic lighting, volumetric atmosphere, Rembrandt lighting, god rays, or neon-noir shadows where applicable.

STRICT CONSTRAINTS:
1. Divide the video into scenes of approximately 8 seconds each.
2. Maintain character identity consistency using the provided reference images.
3. Every shot must follow the director's specific style DNA: ${director.name} (${director.description}).
4. Use technical cinematography terms (camera movements: push-in, dolly zoom, pan; lighting: softbox, rim light; lens: anamorphic, 35mm).
5. Output MUST be valid JSON matching the specified schema.
6. The "imagePrompt" and "generationPrompt" fields MUST be exhaustive (80-120 words), functioning as professional technical briefs. Include specific camera gear (Arri Alexa, 35mm Anamorphic), lighting setups (Rembrandt, Three-point, High-key), and deep atmospheric descriptions. The user will use these prompts in external high-end image/video generators.

7. The "animationPrompt" MUST describe specific motion dynamics, temporal transitions, and physical behavior (e.g., "dolly-in with subtle handheld jitter", "fluid liquid simulation behavior", "stochastic environmental movement").

CONTEXT:
Song/Lyrics: ${songDescription}
Concept: ${videoConcept}
Ref Characters: ${numCharacters}
Director Style: ${director.name}
Video Type: ${videoType}
Needed Duration: ${duration}s (approx ${numScenes} scenes)`;

  const imageParts = referenceImages.map(img => ({
    inlineData: { data: img.data, mimeType: img.mimeType }
  }));

  try {
    return await withRetry(async () => {
      const ai = getAI();
      const result = await ai.models.generateContent({ 
        model: "gemini-3.1-pro-preview",
        contents: {
          parts: [
            ...imageParts,
            { text: "Generate the complete technical storyboard in JSON format. Ensure the response is a valid JSON object." }
          ]
        },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          maxOutputTokens: 16384, // Increase limit for long storyboards
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              creativeBrief: {
                type: Type.OBJECT,
                properties: {
                  projectOverview: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      targetAudience: { type: Type.STRING },
                      rhythmDriver: { type: Type.STRING },
                      estimatedDuration: { type: Type.STRING },
                      summary: { type: Type.STRING }
                    },
                    required: ["title", "targetAudience", "rhythmDriver", "estimatedDuration", "summary"]
                  },
                  creativeConcept: {
                    type: Type.OBJECT,
                    properties: {
                      structureType: { type: Type.STRING },
                      coreDrive: { type: Type.STRING },
                      contentOutline: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            block: { type: Type.STRING },
                            timeframe: { type: Type.STRING },
                            strategy: { type: Type.STRING }
                          }
                        }
                      }
                    },
                    required: ["structureType", "coreDrive", "contentOutline"]
                  },
                  referenceAssets: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        type: { type: Type.STRING },
                        description: { type: Type.STRING },
                        generationPrompt: { type: Type.STRING }
                      }
                    }
                  },
                  scriptAndSound: {
                    type: Type.OBJECT,
                    properties: {
                      bgmBrief: { type: Type.STRING }
                    },
                    required: ["bgmBrief"]
                  }
                },
                required: ["projectOverview", "creativeConcept", "referenceAssets", "scriptAndSound"]
              },
              shotList: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sceneNumber: { type: Type.NUMBER },
                    timecode: { type: Type.STRING },
                    caption: { type: Type.STRING },
                    startFrame: { type: Type.STRING },
                    actionCamera: { type: Type.STRING },
                    imagePrompt: { type: Type.STRING },
                    animationPrompt: { type: Type.STRING },
                    assetReferences: { type: Type.ARRAY, items: { type: Type.STRING } },
                    lyrics: { type: Type.STRING }
                  },
                  required: ["sceneNumber", "imagePrompt", "animationPrompt"]
                }
              }
            },
            required: ["creativeBrief", "shotList"]
          }
        }
      });

      let text = result.text || '{}';
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.warn("Standard JSON parse failed, attempting repair...", parseError);
        try {
          const repaired = jsonrepair(text);
          return JSON.parse(repaired);
        } catch (repairError) {
          console.error("JSON repair failed:", repairError);
          // Fallback: If it's truly truncated and unrepairable, we might have to strip the last partial object if it's an array
          throw new Error("The AI response was too long and failed to generate valid JSON. Try reducing the video duration or complexity.");
        }
      }
    });
  } catch (error) {
    console.error("Storyboard generation failed:", error);
    throw error;
  }
}

const IMAGE_MODEL = 'gemini-3.1-flash-image-preview';

declare const puter: any;

export async function generateAssetImage(prompt: string, _aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1") {
  try {
    return await withRetry(async () => {
      if (typeof puter === 'undefined') {
        throw new Error("Puter.js not loaded. Please ensure you are connected to the internet.");
      }

      const qualityModifiers = "hyper-realistic, cinematic, high-fidelity, professional cinematography, 8k resolution, meticulously detailed textures, no plastic image, natural light.";
      const finalPrompt = `${prompt}. Visual quality: ${qualityModifiers}`;

      const result = await puter.ai.chat(finalPrompt, {
        model: IMAGE_MODEL,
        image_config: { image_size: "1K" }
      });

      const img = result.message.images?.[0];
      if (img) {
        return {
          url: img.image_url.url,
          thoughtSignature: img.thoughtSignature
        };
      }

      return { url: null, thoughtSignature: undefined };
    });
  } catch (error) {
    console.error("Asset image generation failed:", error);
    return { url: null, thoughtSignature: undefined };
  }
}

export async function generateSceneImage(
  prompt: string, 
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "16:9",
  referenceAssets: {id: string, name: string, description: string, imageUrl: string, thoughtSignature?: string}[]
) {
  try {
    return await withRetry(async () => {
      if (typeof puter === 'undefined') {
        throw new Error("Puter.js not loaded.");
      }

      // Enhance character consistency by prepending asset descriptions to the prompt
      let context = "";
      if (referenceAssets && referenceAssets.length > 0) {
        context = "Character/Asset reference guide for visual consistency:\n" + 
          referenceAssets.map(a => `- ${a.id} (${a.name}): ${a.description}`).join('\n') + 
          "\n\nScene requirements:\n";
      }

      const qualityModifiers = "hyper-realistic, cinematic, high-fidelity, professional cinematography, meticulously detailed textures, no plastic image, consistent character design, natural textures.";
      const enhancedPrompt = `${context}${prompt}. Visual quality: ${qualityModifiers}. Ensure consistency with asset descriptions provided above.`;

      // If we have a primary reference asset with a thought signature, use it for follow-up turn
      const primaryAsset = referenceAssets.find(a => a.thoughtSignature && a.imageUrl);

      let result;
      if (primaryAsset) {
        result = await puter.ai.chat([
          { 
            role: "user", 
            content: `Generate a character reference: ${primaryAsset.name}. ${primaryAsset.description}.` 
          },
          { 
            role: "assistant", 
            content: [
              { type: "text", text: `I have generated the reference asset for ${primaryAsset.name}.` },
              { 
                type: "image_url", 
                image_url: { url: primaryAsset.imageUrl }, 
                thoughtSignature: primaryAsset.thoughtSignature 
              },
            ]
          },
          { 
            role: "user", 
            content: enhancedPrompt 
          },
        ], {
          model: IMAGE_MODEL,
          image_config: { aspect_ratio: aspectRatio, image_size: "2K" },
        });
      } else {
        result = await puter.ai.chat(enhancedPrompt, {
          model: IMAGE_MODEL,
          image_config: { aspect_ratio: aspectRatio, image_size: "2K" },
        });
      }

      if (result.message.images?.length > 0) {
        return result.message.images[0].image_url.url;
      }

      return null;
    });
  } catch (error) {
    console.error("Scene image generation failed:", error);
    return null;
  }
}

export async function generateCustomStyle(request: string) {
  const systemInstruction = `You are a visual DNA architect. Based on the user's custom style request, generate a new Director Style profile.

Output MUST be JSON:
{
  "id": "slugified-name",
  "name": "Creative Name",
  "description": "Short technical description",
  "prompt": "Detailed Midjourney-style image prompt",
  "params": "Technical parameters like --ar 21:9 --stylize 400"
}`;

  try {
    return await withRetry(async () => {
      const ai = getAI();
      const result = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: request,
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });

      let text = result.text || '{}';
      try {
        return JSON.parse(text);
      } catch (e) {
        return JSON.parse(jsonrepair(text));
      }
    });
  } catch (error) {
    console.error("Custom style generation failed:", error);
    throw error;
  }
}
