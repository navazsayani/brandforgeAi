# Fireworks AI SDXL Integration

This document describes the integration of Fireworks AI SDXL Turbo and SDXL 3 models into the BrandForge application, providing enhanced image generation capabilities with img2img and ControlNet support.

## Overview

The Fireworks AI integration adds two powerful SDXL models to the existing image generation pipeline:

- **SDXL Turbo**: Ultra-fast generation (1-4 steps, 2-3 seconds)
- **SDXL 3**: High-quality generation with advanced controls (20+ steps, 8-12 seconds)

## Features

### Core Capabilities
- **Text-to-Image**: Generate brand marketing images from text prompts
- **img2img**: Transform existing images while preserving structure
- **ControlNet**: Precise control over composition, pose, depth, and style
- **Batch Generation**: Multiple images in a single request
- **Intelligent Model Selection**: Automatic optimal model selection based on context

### Advanced Controls
- **Guidance Scale**: Control prompt adherence (1-20)
- **Inference Steps**: Quality vs speed trade-off (4-50 steps)
- **img2img Strength**: Transformation intensity (0.0-1.0)
- **ControlNet Types**: canny, depth, openpose, scribble, seg
- **Aspect Ratios**: Full support for social media formats

## Architecture

### Integration Points

1. **Fireworks Client** (`src/lib/fireworks-client.ts`)
   - Direct HTTP API integration
   - No additional dependencies required
   - Handles all SDXL model variants

2. **Enhanced Generate Images Flow** (`src/ai/flows/generate-images.ts`)
   - New provider options: `FIREWORKS_SDXL_TURBO`, `FIREWORKS_SDXL_3`
   - Intelligent model selection logic
   - Preserves all existing functionality

3. **Enhanced Edit Image Flow** (`src/ai/flows/edit-image-flow.ts`)
   - Improved img2img editing with SDXL 3
   - Fallback to Gemini if Fireworks fails
   - Maintains existing edit interface

4. **Admin Controls** (Model Configuration)
   - Feature flags for gradual rollout
   - Per-model enable/disable controls
   - System-wide configuration

## Configuration

### Environment Variables
```bash
FIREWORKS_API_KEY=your_fireworks_api_key_here
FIREWORKS_BASE_URL=https://api.fireworks.ai/inference/v1
```

### Admin Configuration
The integration is controlled through the existing model configuration system:

```typescript
{
  // Existing config preserved
  fireworksEnabled: false,              // Master switch
  fireworksSDXLTurboEnabled: false,     // Enable SDXL Turbo
  fireworksSDXL3Enabled: false,         // Enable SDXL 3
  intelligentModelSelection: false,     // Auto model selection
  showAdvancedImageControls: false,     // Power user controls
}
```

## Usage

### Basic Usage (Automatic Selection)
When intelligent model selection is enabled, the system automatically chooses the optimal model:

```typescript
const result = await generateImages({
  brandDescription: "A modern tech startup",
  imageStyle: "professional, clean",
  qualityMode: "premium", // Triggers SDXL 3
  numberOfImages: 1
});
```

### Advanced Usage (Manual Control)
```typescript
const result = await generateImages({
  provider: "FIREWORKS_SDXL_3",
  brandDescription: "Luxury fashion brand",
  imageStyle: "high-fashion, dramatic lighting",
  // Advanced Fireworks parameters
  fireworksGuidanceScale: 8.0,
  fireworksNumInferenceSteps: 25,
  fireworksImg2ImgStrength: 0.7,
  fireworksControlNet: {
    type: "canny",
    conditioning_scale: 1.0,
    control_image: "base64_encoded_image"
  }
});
```

### img2img Editing
```typescript
const editedImage = await editImage({
  imageDataUri: "data:image/png;base64,...",
  instruction: "Make the background more vibrant",
  provider: "FIREWORKS_SDXL_3",
  fireworksImg2ImgStrength: 0.6
});
```

## Model Selection Logic

The intelligent model selection follows this priority:

1. **Fast Mode** → SDXL Turbo (if enabled)
2. **Premium Mode** → SDXL 3 (if enabled)
3. **Preview/Iteration** → SDXL Turbo (if enabled)
4. **Final Assets** → SDXL 3 (if enabled)
5. **Batch Generation (3+)** → SDXL Turbo (if enabled)
6. **Example Image Present** → Gemini (multimodal strength)
7. **Default Fallback** → Gemini

## API Endpoints

### Fireworks AI Image Generation
```
POST https://api.fireworks.ai/inference/v1/image_generation
```

**Request Body:**
```json
{
  "model": "accounts/fireworks/models/sdxl-turbo",
  "prompt": "A professional marketing image...",
  "width": 1024,
  "height": 1024,
  "guidance_scale": 1.0,
  "num_inference_steps": 4,
  "num_images": 1,
  "response_format": "b64_json",
  "image": "base64_image_for_img2img",
  "strength": 0.8,
  "controlnet": {
    "type": "canny",
    "conditioning_scale": 1.0,
    "control_image": "base64_control_image"
  }
}
```

**Response:**
```json
{
  "images": [
    {
      "b64_json": "base64_encoded_image_data"
    }
  ]
}
```

## Model Specifications

### SDXL Turbo
- **Model ID**: `accounts/fireworks/models/sdxl-turbo`
- **Speed**: 2-3 seconds
- **Steps**: 1-4 (optimal: 4)
- **Guidance Scale**: 1.0 (fixed)
- **Use Cases**: Previews, rapid iteration, A/B testing

### SDXL 3
- **Model ID**: `accounts/fireworks/models/stable-diffusion-xl-1024-v1-0`
- **Speed**: 8-12 seconds
- **Steps**: 15-30 (optimal: 20-25)
- **Guidance Scale**: 5.0-10.0 (optimal: 7.5)
- **Use Cases**: Final assets, high-quality marketing images

## ControlNet Types

| Type | Description | Use Case |
|------|-------------|----------|
| `canny` | Edge detection | Preserve composition/structure |
| `depth` | Depth estimation | Maintain 3D spatial relationships |
| `openpose` | Human pose detection | Consistent character poses |
| `scribble` | Sketch-based control | Rough composition guidance |
| `seg` | Segmentation masks | Object-level control |

## Error Handling

The integration includes comprehensive error handling:

1. **API Key Missing**: Clear error message with setup instructions
2. **API Errors**: Detailed error reporting with status codes
3. **Fallback Logic**: Automatic fallback to Gemini if Fireworks fails
4. **Admin Controls**: Feature can be disabled instantly if issues arise

## Testing

Run the Fireworks AI tests:
```bash
npm run test __tests__/unit/ai/flows/fireworks-generation.test.ts
```

## Deployment Strategy

1. **Phase 1**: Deploy with all flags disabled (zero user impact)
2. **Phase 2**: Admin enables for testing (`admin@brandforge.ai`)
3. **Phase 3**: Enable for premium users
4. **Phase 4**: Full rollout with intelligent selection

## Performance Considerations

- **SDXL Turbo**: Optimized for speed, ideal for user feedback loops
- **SDXL 3**: Higher quality but slower, best for final deliverables
- **Batch Processing**: Fireworks supports multiple images per request
- **Caching**: Consider caching frequently used ControlNet preprocessed images

## Cost Optimization

- Use SDXL Turbo for previews and iterations
- Reserve SDXL 3 for final, high-value assets
- Implement intelligent batching for multiple image requests
- Monitor usage patterns to optimize model selection

## Monitoring

Key metrics to track:
- Generation success rates by model
- Average generation times
- User preference patterns (fast vs premium)
- Cost per generation by model
- Error rates and fallback frequency

## Future Enhancements

- **Custom ControlNet Models**: Brand-specific control models
- **Style Transfer**: Advanced style consistency across campaigns
- **Batch ControlNet**: Multiple control types in single request
- **Real-time Preview**: Live preview during parameter adjustment