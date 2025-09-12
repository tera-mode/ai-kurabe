import { NextRequest, NextResponse } from 'next/server';
import { convertPrompt } from '@/lib/prompt-converter';

export async function POST(request: NextRequest) {
  try {
    const { prompt, modelId } = await request.json();

    if (!prompt || !modelId) {
      return NextResponse.json(
        { error: 'プロンプトとモデルIDが必要です' },
        { status: 400 }
      );
    }

    // Convert prompt using Claude 3 Haiku
    const convertedPrompt = await convertPrompt(prompt, modelId);

    let imageUrl: string | null = null;
    let error: string | null = null;

    try {
      switch (modelId) {
        case 'gemini-imagen3':
          imageUrl = await generateWithGeminiImagen(convertedPrompt);
          break;
        case 'google-imagen4':
          imageUrl = await generateWithGoogleImagen4(convertedPrompt);
          break;
        case 'flux-pro-1.1':
          imageUrl = await generateWithFluxPro(convertedPrompt);
          break;
        case 'replicate-sdxl':
          imageUrl = await generateWithReplicateSDXL(convertedPrompt);
          break;
        case 'dall-e-3':
          imageUrl = await generateWithDALLE(convertedPrompt);
          break;
        case 'midjourney':
          imageUrl = await generateWithMidjourney(convertedPrompt);
          break;
        case 'leonardo-ai':
          imageUrl = await generateWithLeonardo(convertedPrompt);
          break;
        default:
          throw new Error(`サポートされていないモデル: ${modelId}`);
      }
    } catch (genError) {
      error = genError instanceof Error ? genError.message : 'Unknown generation error';
    }

    return NextResponse.json({
      imageUrl,
      convertedPrompt,
      error
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

async function generateWithGeminiImagen(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('Google AI API key is not configured');
  }

  try {
    // Use Google GenAI SDK for Gemini 2.5 Flash Image generation
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({
      apiKey: apiKey
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: prompt,
    });

    if (!response.candidates || !response.candidates[0] || !response.candidates[0].content) {
      throw new Error('Gemini 2.5 Flash Imageで画像が生成されませんでした');
    }

    // Find the image part in the response
    const parts = response.candidates[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          // Convert base64 image to data URL
          const base64Image = part.inlineData.data;
          return `data:image/png;base64,${base64Image}`;
        }
      }
    }

    throw new Error('レスポンスに画像データが含まれていませんでした');

  } catch (error) {
    console.error('Gemini 2.5 Flash Image generation error:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('429') || error.message.includes('quota')) {
        throw new Error('⚠️ Gemini 2.5 Flash Image APIの利用制限に達しました。しばらく待ってから再試行してください。');
      }
      if (error.message.includes('not found') || error.message.includes('404')) {
        throw new Error('Gemini 2.5 Flash Image Previewモデルが利用できません。APIアクセス権限を確認してください。');
      }
    }
    
    throw new Error(`Gemini 2.5 Flash Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function generateWithGoogleImagen4(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('Google AI API key is not configured');
  }

  try {
    // Use Google GenAI SDK for Imagen 4 generation
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({
      apiKey: apiKey
    });

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
      },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error('Google Imagen 4で画像が生成されませんでした');
    }

    // Get the first generated image
    const generatedImage = response.generatedImages[0];
    if (!generatedImage.image || !generatedImage.image.imageBytes) {
      throw new Error('生成された画像データが不正です');
    }

    // Convert base64 image to data URL
    const base64Image = generatedImage.image.imageBytes;
    return `data:image/png;base64,${base64Image}`;

  } catch (error) {
    console.error('Google Imagen 4 generation error:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('429') || error.message.includes('quota')) {
        throw new Error('⚠️ Google Imagen 4 APIの利用制限に達しました。しばらく待ってから再試行してください。');
      }
      if (error.message.includes('not found') || error.message.includes('404')) {
        throw new Error('Google Imagen 4モデルが利用できません。APIアクセス権限を確認してください。');
      }
      if (error.message.includes('permission') || error.message.includes('access')) {
        throw new Error('Google Imagen 4へのアクセス権限がありません。Google Cloud Consoleで権限を確認してください。');
      }
    }
    
    throw new Error(`Google Imagen 4 generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function generateWithFluxPro(prompt: string): Promise<string> {
  const apiKey = process.env.BFL_API_KEY;
  if (!apiKey) {
    throw new Error('BFL API key is not configured');
  }

  try {
    // Submit generation request
    const response = await fetch('https://api.bfl.ai/v1/flux-kontext-pro', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'x-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        aspect_ratio: "1:1",
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FLUX Pro API error: ${response.status} - ${errorText}`);
    }

    const requestData = await response.json();
    const requestId = requestData.id;
    const pollingUrl = requestData.polling_url;

    if (!requestId || !pollingUrl) {
      throw new Error('Invalid response from FLUX Pro API');
    }

    // Poll for results
    let attempts = 0;
    const maxAttempts = 120; // 60 seconds with 0.5s intervals
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const pollResponse = await fetch(pollingUrl, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'x-key': apiKey,
        },
      });

      if (!pollResponse.ok) {
        throw new Error(`Polling error: ${pollResponse.status}`);
      }

      const result = await pollResponse.json();
      const status = result.status;

      if (status === 'Ready') {
        const imageUrl = result.result?.sample;
        if (!imageUrl) {
          throw new Error('No image URL in response');
        }
        return imageUrl;
      } else if (status === 'Error' || status === 'Failed') {
        throw new Error(`Generation failed: ${JSON.stringify(result)}`);
      }

      attempts++;
    }

    throw new Error('Generation timed out after 60 seconds');

  } catch (error) {
    console.error('FLUX Pro generation error:', error);
    throw new Error(`FLUX Pro generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function generateWithReplicateSDXL(prompt: string): Promise<string> {
  // For now, return a demo/placeholder message since we don't have Replicate API key
  // In production, you would implement the actual Replicate API call
  throw new Error('Stable Diffusion XL integration requires Replicate API key. Please add REPLICATE_API_TOKEN to environment variables.');
}

async function generateWithFlux(prompt: string): Promise<string> {
  // Placeholder for Flux API integration
  // You would need to implement the actual Flux API call here
  throw new Error('Flux API integration pending');
}

async function generateWithDALLE(prompt: string): Promise<string> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`DALL-E API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.data[0].url;
}

async function generateWithMidjourney(prompt: string): Promise<string> {
  // Placeholder for Midjourney API integration
  // Note: Midjourney doesn't have an official public API
  throw new Error('Midjourney API integration pending');
}

async function generateWithLeonardo(prompt: string): Promise<string> {
  // Placeholder for Leonardo.ai API integration
  throw new Error('Leonardo.ai API integration pending');
}