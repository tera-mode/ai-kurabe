import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface PromptConversionRule {
  modelId: string;
  systemPrompt: string;
  examples: Array<{
    input: string;
    output: string;
  }>;
}

const conversionRules: PromptConversionRule[] = [
  {
    modelId: 'gemini-imagen3',
    systemPrompt: `You are a minimal prompt translator for Gemini 2.5 Flash Image model. Translate Japanese to English while preserving the user's original intent and style.

Guidelines:
- Translate Japanese to English accurately and simply
- Preserve the user's intended style (anime, realistic, abstract, etc.)
- Only add minimal technical improvements if needed
- Do NOT force photorealistic or professional photography styles
- Keep the original artistic direction intact
- Avoid adding unwanted descriptors like "professional" or "high quality" unless specifically requested`,
    examples: [
      {
        input: "美しい女性の肖像画",
        output: "Beautiful portrait of a woman"
      },
      {
        input: "アニメ風の猫のキャラクター",
        output: "Anime-style cat character"
      },
      {
        input: "抽象的なアート",
        output: "Abstract art"
      }
    ]
  },
  {
    modelId: 'google-imagen4',
    systemPrompt: `You are a minimal prompt translator for Google Imagen 4 model. Translate Japanese to English while preserving the user's original intent and style.

Guidelines:
- Translate Japanese to English accurately and simply
- Preserve the user's intended style (anime, realistic, abstract, etc.)
- Only add minimal technical improvements if needed
- Do NOT force photorealistic or professional photography styles
- Keep the original artistic direction intact
- Avoid adding unwanted descriptors like "professional" or "high quality" unless specifically requested`,
    examples: [
      {
        input: "美しい女性の肖像画",
        output: "Beautiful portrait of a woman"
      },
      {
        input: "アニメ風の猫のキャラクター",
        output: "Anime-style cat character"
      },
      {
        input: "抽象的なアート",
        output: "Abstract art"
      }
    ]
  },
  {
    modelId: 'flux-pro-1.1',
    systemPrompt: `You are a minimal prompt translator for FLUX Pro 1.1 model. Translate Japanese to English while preserving the user's original intent and style.

Guidelines:
- Translate Japanese to English accurately and simply
- Preserve the user's intended style (anime, realistic, abstract, etc.)
- Only add minimal technical improvements if needed
- Do NOT force photorealistic or professional photography styles
- Keep the original artistic direction intact
- Avoid adding unwanted descriptors unless specifically requested`,
    examples: [
      {
        input: "美しい女性の肖像画",
        output: "Beautiful portrait of a woman"
      },
      {
        input: "アニメ風の猫のキャラクター",
        output: "Anime-style cat character"
      },
      {
        input: "抽象的なアート",
        output: "Abstract art"
      }
    ]
  },
  {
    modelId: 'replicate-sdxl',
    systemPrompt: `You are a prompt optimizer for Stable Diffusion XL via Replicate. Convert Japanese prompts to English and optimize them for SDXL.

Guidelines:
- Translate Japanese to English accurately
- SDXL responds well to detailed, specific prompts
- Include quality tags like "masterpiece, best quality, high resolution"
- Add artistic styles and technical photography terms
- Keep prompts under 800 characters
- Use comma-separated descriptive tags`,
    examples: [
      {
        input: "美しい女性の肖像画",
        output: "masterpiece, best quality, beautiful portrait of a woman, professional photography, soft lighting, detailed facial features, high resolution, photorealistic, elegant composition"
      },
      {
        input: "猫が公園で遊んでいる写真",
        output: "masterpiece, best quality, playful cat in park, natural lighting, vibrant colors, shallow depth of field, candid moment, high quality photography"
      }
    ]
  },
  {
    modelId: 'flux-dev',
    systemPrompt: `You are a prompt optimizer for Flux Dev model. Convert and optimize prompts for artistic and creative image generation.

Guidelines:
- Translate Japanese to English if needed
- Emphasize artistic styles and techniques
- Include mood and atmosphere descriptions
- Keep prompts under 512 characters
- Focus on visual aesthetics
- Add artistic mediums when relevant`,
    examples: [
      {
        input: "抽象的なアート作品",
        output: "Abstract art piece, vibrant colors, dynamic composition, modern artistic style, expressive brushstrokes, contemporary digital art"
      },
      {
        input: "未来都市の風景",
        output: "Futuristic cityscape, neon lights, cyberpunk aesthetic, dramatic lighting, sci-fi architecture, digital art style"
      }
    ]
  },
  {
    modelId: 'dall-e-3',
    systemPrompt: `You are a prompt optimizer for DALL-E 3. Create detailed, descriptive prompts that work well with DALL-E 3's capabilities.

Guidelines:
- Translate Japanese to English
- Be very specific and descriptive
- Include style, mood, and technical details
- Avoid negative prompts (DALL-E doesn't use them effectively)
- Focus on positive descriptions
- Keep under 4000 characters`,
    examples: [
      {
        input: "ファンタジーの城",
        output: "Majestic fantasy castle on a hilltop, medieval architecture, towering spires, stone walls, surrounded by misty mountains, golden sunset lighting, detailed stonework, magical atmosphere"
      }
    ]
  },
  {
    modelId: 'midjourney',
    systemPrompt: `You are a prompt optimizer for Midjourney. Create prompts that leverage Midjourney's strengths in artistic and stylized imagery.

Guidelines:
- Translate Japanese to English
- Use Midjourney-specific parameters when helpful
- Include artistic styles and techniques
- Add aspect ratio suggestions when relevant
- Focus on visual aesthetics and composition
- Include quality and style modifiers`,
    examples: [
      {
        input: "日本庭園の写真",
        output: "Traditional Japanese garden, zen aesthetic, carefully raked gravel, bonsai trees, wooden bridges, serene pond, soft natural lighting, peaceful atmosphere --ar 16:9 --style raw"
      }
    ]
  },
  {
    modelId: 'leonardo-ai',
    systemPrompt: `You are a prompt optimizer for Leonardo.ai. Create prompts optimized for Leonardo's AI art generation capabilities.

Guidelines:
- Translate Japanese to English
- Include artistic style preferences
- Add technical details for better results
- Focus on composition and visual elements
- Include mood and lighting descriptions
- Keep prompts clear and descriptive`,
    examples: [
      {
        input: "宇宙飛行士のイラスト",
        output: "Astronaut illustration, space suit detail, cosmic background, stars and nebula, dramatic lighting, sci-fi art style, high contrast, detailed rendering"
      }
    ]
  }
];

export async function convertPrompt(originalPrompt: string, modelId: string): Promise<string> {
  try {
    const rule = conversionRules.find(r => r.modelId === modelId);
    if (!rule) {
      // If no specific rule found, return original prompt
      return originalPrompt;
    }

    const exampleText = rule.examples
      .map(ex => `Input: "${ex.input}"\nOutput: "${ex.output}"`)
      .join('\n\n');

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `${rule.systemPrompt}

Examples:
${exampleText}

Now convert this prompt: "${originalPrompt}"

Return only the optimized prompt, no explanations.`
      }]
    });

    const convertedPrompt = message.content[0].type === 'text' 
      ? message.content[0].text.trim() 
      : originalPrompt;

    return convertedPrompt;
  } catch (error) {
    console.error('Prompt conversion error:', error);
    // Return original prompt if conversion fails
    return originalPrompt;
  }
}

export function getAvailableModels(): string[] {
  return conversionRules.map(rule => rule.modelId);
}