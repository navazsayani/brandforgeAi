interface FireworksGenerationParams {
  model: string; // Now accepts any string for admin-configurable model names
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
  seed?: number;
  num_images?: number;
  // img2img specific
  image?: string; // base64 encoded image
  strength?: number; // 0.0 to 1.0, how much to transform the input image
  // ControlNet specific
  controlnet?: {
    type: 'canny' | 'depth' | 'openpose' | 'scribble' | 'seg';
    conditioning_scale: number; // 0.0 to 2.0
    control_image: string; // base64 encoded control image
  };
}

interface FireworksResponse {
  images: Array<{
    url?: string;
    b64_json?: string;
  }>;
  error?: {
    message: string;
    type: string;
  };
}

export async function generateImageWithFireworks(params: FireworksGenerationParams): Promise<string[]> {
  const apiKey = process.env.FIREWORKS_API_KEY;
  const baseUrl = process.env.FIREWORKS_BASE_URL || 'https://api.fireworks.ai/inference/v1';
  
  if (!apiKey) {
    throw new Error('FIREWORKS_API_KEY is not set in environment variables');
  }

  console.log(`[Fireworks] Generating image with model: ${params.model}`);
  console.log(`[Fireworks] Prompt: ${params.prompt.substring(0, 100)}...`);
  console.log(`[Fireworks] Parameters:`, {
    width: params.width,
    height: params.height,
    num_images: params.num_images,
    guidance_scale: params.guidance_scale,
    num_inference_steps: params.num_inference_steps,
    hasImage: !!params.image,
    hasControlNet: !!params.controlnet
  });

  // Determine the correct endpoint based on generation type
  let endpoint: string;
  if (params.controlnet) {
    // ControlNet endpoint
    endpoint = `${baseUrl}/image_generation/accounts/fireworks/models/${params.model}/control_net`;
    console.log(`[Fireworks] Using ControlNet endpoint`);
  } else if (params.image) {
    // Image-to-Image endpoint
    endpoint = `${baseUrl}/image_generation/accounts/fireworks/models/${params.model}/image_to_image`;
    console.log(`[Fireworks] Using Image-to-Image endpoint`);
  } else {
    // Text-to-Image endpoint
    endpoint = `${baseUrl}/image_generation/accounts/fireworks/models/${params.model}`;
    console.log(`[Fireworks] Using Text-to-Image endpoint`);
  }

  console.log(`[Fireworks] Full endpoint URL: ${endpoint}`);

  // Construct the request body (no longer need to include model in body since it's in URL)
  const requestBody: any = {
    prompt: params.prompt,
    width: params.width || 1024,
    height: params.height || 1024,
    guidance_scale: params.guidance_scale || (params.model.includes('turbo') ? 1.0 : 7.5),
    num_inference_steps: params.num_inference_steps || (params.model.includes('turbo') ? 4 : 20),
    num_images: params.num_images || 1,
    response_format: 'b64_json', // Get base64 encoded images
  };

  // Add negative prompt if provided
  if (params.negative_prompt && params.negative_prompt.trim()) {
    requestBody.negative_prompt = params.negative_prompt.trim();
  }

  // Add seed if provided
  if (params.seed !== undefined) {
    requestBody.seed = params.seed;
  }

  // img2img: Add image and strength if provided
  if (params.image) {
    requestBody.image = params.image;
    requestBody.strength = params.strength || 0.8;
    console.log(`[Fireworks] Using img2img with strength: ${requestBody.strength}`);
  }

  // ControlNet: Add control parameters if provided
  if (params.controlnet) {
    requestBody.controlnet = {
      type: params.controlnet.type,
      conditioning_scale: params.controlnet.conditioning_scale,
      control_image: params.controlnet.control_image
    };
    console.log(`[Fireworks] Using ControlNet: ${params.controlnet.type} with scale: ${params.controlnet.conditioning_scale}`);
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Fireworks] API error: ${response.status} - ${errorText}`);
      throw new Error(`Fireworks API error: ${response.status} - ${errorText}`);
    }

    const data: FireworksResponse = await response.json();
    console.log(`[Fireworks] Response received:`, {
      imageCount: data.images?.length || 0,
      hasError: !!data.error
    });

    if (data.error) {
      throw new Error(`Fireworks API error: ${data.error.message}`);
    }

    if (!data.images || data.images.length === 0) {
      throw new Error('Fireworks API returned no images');
    }

    // Convert base64 images to data URIs
    const dataUris = data.images.map((image, index) => {
      if (image.b64_json) {
        return `data:image/png;base64,${image.b64_json}`;
      } else if (image.url) {
        return image.url;
      } else {
        console.error(`[Fireworks] Image ${index + 1} has no b64_json or url:`, image);
        throw new Error(`Fireworks API returned invalid image data for image ${index + 1}`);
      }
    });

    console.log(`[Fireworks] Successfully generated ${dataUris.length} image(s)`);
    return dataUris;

  } catch (error: any) {
    console.error('[Fireworks] Generation failed:', error);
    throw new Error(`Fireworks image generation failed: ${error.message}`);
  }
}

// Helper function to convert aspect ratio to width/height
export function getFireworksDimensions(aspectRatio?: string): { width: number; height: number } {
  const dimensionMap: Record<string, { width: number; height: number }> = {
    '1:1': { width: 1024, height: 1024 },
    '4:5': { width: 832, height: 1024 },
    '3:4': { width: 768, height: 1024 },
    '4:3': { width: 1024, height: 768 },
    '16:9': { width: 1024, height: 576 },
    '9:16': { width: 576, height: 1024 },
  };

  return dimensionMap[aspectRatio || '1:1'] || { width: 1024, height: 1024 };
}

// Helper function to preprocess images for ControlNet
export async function preprocessControlNetImage(
  imageUrl: string,
  controlType: 'canny' | 'depth' | 'openpose' | 'scribble' | 'seg'
): Promise<string> {
  // For now, return the original image as base64
  // In a full implementation, you would apply the appropriate preprocessing
  // (edge detection for canny, depth estimation for depth, etc.)
  
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    console.log(`[Fireworks] Preprocessed image for ControlNet ${controlType}`);
    return base64;
  } catch (error: any) {
    console.error(`[Fireworks] Failed to preprocess image for ControlNet:`, error);
    throw new Error(`Failed to preprocess image for ControlNet: ${error.message}`);
  }
}