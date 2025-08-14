# Fireworks AI SDXL Integration

This document describes the comprehensive integration of Fireworks AI SDXL Turbo and SDXL 3 models into the BrandForge application, providing enhanced image generation and editing capabilities with intelligent model selection, consistent quality modes, and advanced controls.

## Overview

The Fireworks AI integration adds two powerful SDXL models to the existing image generation pipeline with complete consistency across generation and editing workflows:

- **SDXL Turbo**: Ultra-fast generation (1-4 steps, 2-3 seconds) - Perfect for rapid iteration
- **SDXL 3**: High-quality generation with advanced controls (20+ steps, 8-12 seconds) - Ideal for final assets

## Features

### Core Capabilities
- **Text-to-Image**: Generate brand marketing images from text prompts
- **img2img**: Transform existing images while preserving structure
- **Image Editing**: "Refine with AI" functionality with consistent quality modes
- **ControlNet**: Precise control over composition, pose, depth, and style
- **Batch Generation**: Multiple images in a single request
- **Intelligent Model Selection**: Context-aware optimal model selection with multimodal support
- **Quality Mode Consistency**: Same Fast/Balanced/Premium paradigm across generation and editing

### Advanced Controls
- **Quality Modes**: Fast, Balanced, Premium for consistent user experience
- **Guidance Scale**: Control prompt adherence (1-20)
- **Inference Steps**: Quality vs speed trade-off (4-50 steps)
- **img2img Strength**: Transformation intensity (0.0-1.0)
- **ControlNet Types**: canny, depth, openpose, scribble, seg
- **Aspect Ratios**: Full support for social media formats
- **Admin Controls**: Complete system-wide feature management

## Architecture

### Integration Points

1. **Fireworks Client** (`src/lib/fireworks-client.ts`)
   - Direct HTTP API integration with comprehensive error handling
   - No additional dependencies required
   - Handles all SDXL model variants (Turbo and SDXL 3)
   - ControlNet preprocessing and img2img support

2. **Enhanced Generate Images Flow** (`src/ai/flows/generate-images.ts`)
   - New provider options: `FIREWORKS_SDXL_TURBO`, `FIREWORKS_SDXL_3`
   - **Updated intelligent model selection** with multimodal task differentiation
   - Quality mode support (`fast`, `balanced`, `premium`)
   - Preserves all existing functionality with zero breaking changes

3. **Enhanced Edit Image Flow** (`src/ai/flows/edit-image-flow.ts`)
   - **NEW: Consistent quality modes** for image editing
   - Support for both SDXL Turbo and SDXL 3 in editing
   - Mode-specific parameter optimization
   - Robust fallback to Gemini if Fireworks fails
   - Maintains existing edit interface

4. **Type System Updates** (`src/types/index.ts`)
   - Enhanced `EditImageInput` schema with `qualityMode` parameter
   - Updated provider enums to include SDXL Turbo
   - Backward compatibility maintained

5. **Admin Controls** (`src/app/(authenticated)/settings/page.tsx`)
   - Complete admin UI for Fireworks configuration
   - Feature flags for gradual rollout and instant disable
   - Per-model enable/disable controls
   - System-wide intelligent selection toggle
   - Advanced controls visibility management

## Configuration

### Environment Variables
```bash
FIREWORKS_API_KEY=your_fireworks_api_key_here
FIREWORKS_BASE_URL=https://api.fireworks.ai/inference/v1
```

### Admin Configuration
The integration is controlled through the existing model configuration system with comprehensive admin UI:

```typescript
{
  // Existing config preserved
  fireworksEnabled: false,              // Master switch - enables/disables entire Fireworks integration
  fireworksSDXLTurboEnabled: false,     // Enable SDXL Turbo model specifically
  fireworksSDXL3Enabled: false,         // Enable SDXL 3 model specifically
  intelligentModelSelection: false,     // Enable context-aware automatic model selection
  showAdvancedImageControls: false,     // Show ControlNet and advanced parameter controls
  
  // Admin-Configurable Model Names (v2.1)
  fireworksSDXLTurboModel: 'sdxl-turbo',                    // SDXL Turbo model name
  fireworksSDXL3Model: 'stable-diffusion-xl-1024-v1-0',    // SDXL 3 model name
}
```

### Admin-Configurable Model Names (v2.1)
The system now supports dynamic model name configuration through the admin interface, providing future-proofing when Fireworks AI updates model names:

- **Dynamic Model Names**: Admins can update model names without code changes
- **Automatic Fallback**: Empty or invalid model names automatically fall back to Gemini
- **Future-Proof Architecture**: Easy adaptation when Fireworks AI updates model names
- **Zero Downtime Updates**: Model name changes take effect immediately

## Admin Controls

### Settings Interface
Administrators can control the Fireworks AI integration through the Settings page (`/settings`) with a dedicated "Fireworks AI Configuration" section:

#### **Master Controls**
- **Enable Fireworks AI**: Master switch to enable/disable the entire integration
- **Enable Intelligent Model Selection**: Activate context-aware automatic model selection

#### **Model-Specific Controls**
- **Enable SDXL Turbo**: Allow fast generation mode (2-3 seconds)
- **Enable SDXL 3**: Allow premium generation mode (8-12 seconds)

#### **Advanced Features**
- **Show Advanced Image Controls**: Enable ControlNet and advanced parameter controls for power users

#### **Model Name Configuration (v2.1)**
- **SDXL Turbo Model Name**: Configure the exact model name for SDXL Turbo (default: `sdxl-turbo`)
- **SDXL 3 Model Name**: Configure the exact model name for SDXL 3 (default: `stable-diffusion-xl-1024-v1-0`)

### Admin UI Implementation
```typescript
// Located in src/app/(authenticated)/settings/page.tsx
const modelSettingsSchema = z.object({
  // ... existing fields
  fireworksEnabled: z.boolean().default(false),
  fireworksSDXLTurboEnabled: z.boolean().default(false),
  fireworksSDXL3Enabled: z.boolean().default(false),
  intelligentModelSelection: z.boolean().default(false),
  showAdvancedImageControls: z.boolean().default(false),
  
  // Admin-Configurable Model Names (v2.1)
  fireworksSDXLTurboModel: z.string().default('sdxl-turbo'),
  fireworksSDXL3Model: z.string().default('stable-diffusion-xl-1024-v1-0'),
});
```

### Deployment Strategy
1. **Phase 1**: Deploy with all flags disabled (zero user impact)
2. **Phase 2**: Admin enables for internal testing
3. **Phase 3**: Enable specific models for premium users
4. **Phase 4**: Full rollout with intelligent selection
5. **Emergency**: Instant disable via admin controls if issues arise

## Usage

### Quality Mode System
The integration provides consistent **Fast/Balanced/Premium** quality modes across both image generation and editing:

| Mode | Speed | Provider | Use Case | Parameters |
|------|-------|----------|----------|------------|
| **Fast** | ⚡ 2-3s | SDXL Turbo | Quick iterations, previews | 4 steps, guidance 1.0 |
| **Balanced** | 🔄 5-8s | Gemini* | Smart understanding, multimodal | Default Gemini settings |
| **Premium** | 🎨 8-12s | SDXL 3 | Final assets, high quality | 25 steps, guidance 7.5 |

*For multimodal tasks (example images), Gemini is used in balanced mode for superior understanding

### Image Generation with Quality Modes
```typescript
// Fast iteration workflow
const result = await generateImages({
  brandDescription: "A modern tech startup",
  imageStyle: "professional, clean",
  qualityMode: "fast", // → SDXL Turbo (2-3s)
  numberOfImages: 4
});

// Premium final asset
const finalResult = await generateImages({
  brandDescription: "Luxury fashion brand",
  imageStyle: "high-fashion, dramatic lighting",
  qualityMode: "premium", // → SDXL 3 (8-12s)
  numberOfImages: 1
});

// Multimodal with example image
const multimodalResult = await generateImages({
  brandDescription: "Tech product showcase",
  imageStyle: "modern, sleek",
  exampleImage: "https://example.com/reference.jpg",
  qualityMode: "balanced", // → Gemini (intelligent understanding)
  numberOfImages: 1
});
```

### Image Editing with Quality Modes
```typescript
// Quick edit iteration
const quickEdit = await editImage({
  imageDataUri: "data:image/png;base64,...",
  instruction: "Make the background more vibrant",
  qualityMode: "fast", // → SDXL Turbo (2-3s)
});

// High-quality final polish
const finalEdit = await editImage({
  imageDataUri: "data:image/png;base64,...",
  instruction: "Professional color grading and lighting",
  qualityMode: "premium", // → SDXL 3 (8-12s)
  fireworksImg2ImgStrength: 0.7
});

// Intelligent balanced editing
const smartEdit = await editImage({
  imageDataUri: "data:image/png;base64,...",
  instruction: "Enhance the mood while preserving the subject",
  qualityMode: "balanced", // → Gemini (intelligent understanding)
});
```

### Advanced Manual Control
```typescript
const result = await generateImages({
  provider: "FIREWORKS_SDXL_3", // Override quality mode
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

### Workflow Examples
```typescript
// Rapid prototyping workflow
const concepts = await generateImages({
  brandDescription: "Eco-friendly startup",
  imageStyle: "modern, clean",
  qualityMode: "fast", // Quick concepts
  numberOfImages: 6
});

// Refine selected concept
const refined = await editImage({
  imageDataUri: concepts.generatedImages[2],
  instruction: "Add more vibrant green elements",
  qualityMode: "fast", // Quick iteration
});

// Final production version
const final = await editImage({
  imageDataUri: refined.editedImageDataUri,
  instruction: "Professional polish and color grading",
  qualityMode: "premium", // High-quality final
});
```

## Intelligent Model Selection Logic

The system uses context-aware intelligent selection with special handling for multimodal tasks:

### Multimodal Tasks (Example Images Present)
When an example image is provided, the selection prioritizes different strengths:

1. **Fast + Example Image** → SDXL Turbo (Speed wins - rapid img2img iteration)
2. **Balanced + Example Image** → Gemini (Understanding wins - superior multimodal comprehension)
3. **Premium + Example Image** → SDXL 3 (Quality wins - high-fidelity img2img + ControlNet)

### Text-Only Generation
For pure text-to-image generation:

1. **Fast Mode** → SDXL Turbo (if enabled)
2. **Balanced Mode** → Gemini (default intelligent generation)
3. **Premium Mode** → SDXL 3 (if enabled)

### Context-Based Overrides
Additional factors that influence selection:

- **Preview/Iteration Intent** → SDXL Turbo (speed priority)
- **Final Asset Intent** → SDXL 3 (quality priority)
- **Batch Generation (3+ images)** → SDXL Turbo (efficiency priority)
- **ControlNet Required** → SDXL 3 (advanced control support)

### Image Editing Selection
For "Refine with AI" image editing:

1. **Fast Editing** → SDXL Turbo (4 steps, strength 0.6, guidance 1.0)
2. **Balanced Editing** → Gemini (intelligent understanding of edit intent)
3. **Premium Editing** → SDXL 3 (25 steps, strength 0.7, guidance 7.5)

### Fallback Strategy
- If selected Fireworks model is disabled → Graceful fallback to Gemini
- If Fireworks API fails → Automatic fallback to Gemini with error logging
- If intelligent selection is disabled → Use manual provider or default to Gemini

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

## Recent Enhancements (Latest Implementation)

### Admin-Configurable Model Names (v2.1)
- **Dynamic Model Management**: Admins can update SDXL model names without code changes
- **Future-Proof Architecture**: Easy adaptation when Fireworks AI updates model names
- **Automatic Fallback System**: Empty/invalid model names automatically fall back to Gemini
- **Zero Downtime Updates**: Model name changes take effect immediately
- **Robust Error Handling**: Comprehensive validation and fallback logic
- **Admin UI Integration**: Intuitive interface for model name configuration

### Quality Mode Consistency (v2.0)
- **Unified Experience**: Same Fast/Balanced/Premium paradigm across generation and editing
- **Image Editing Quality Modes**: "Refine with AI" now supports consistent quality selection
- **Mode-Specific Optimization**: Tailored parameters for each quality level
- **Backward Compatibility**: All existing implementations continue working unchanged

### Enhanced Multimodal Intelligence (v2.0)
- **Context-Aware Selection**: Different strategies for text-only vs multimodal tasks
- **Balanced Mode Strategy**: Gemini used strategically for example images in balanced mode
- **Speed vs Understanding**: Fast/Premium modes use Fireworks even with example images
- **Intelligent Fallbacks**: Graceful degradation when models are unavailable

### Complete Admin Control System (v2.0)
- **Granular Controls**: Individual model enable/disable switches
- **Feature Flag Management**: System-wide intelligent selection toggle
- **Advanced Controls**: ControlNet and parameter visibility management
- **Emergency Controls**: Instant disable capability for production issues

## Monitoring

### Core Metrics
- Generation success rates by model (SDXL Turbo vs SDXL 3 vs Gemini)
- Average generation times by quality mode
- User preference patterns (fast vs balanced vs premium)
- Cost per generation by model and quality mode
- Error rates and fallback frequency

### Quality Mode Analytics
- **Fast Mode Usage**: Iteration patterns and user satisfaction
- **Balanced Mode Performance**: Multimodal task success rates
- **Premium Mode ROI**: Final asset quality vs cost analysis
- **Mode Switching Patterns**: User workflow analysis

### Admin Dashboard Metrics
- Feature flag adoption rates
- Model availability and uptime
- Admin control usage patterns
- Emergency disable frequency and reasons

## Future Enhancements

### Planned Features
- **Custom ControlNet Models**: Brand-specific control models
- **Style Transfer**: Advanced style consistency across campaigns
- **Batch ControlNet**: Multiple control types in single request
- **Real-time Preview**: Live preview during parameter adjustment

### Quality Mode Extensions
- **Custom Quality Profiles**: User-defined speed/quality trade-offs
- **Workflow Templates**: Predefined generation → editing pipelines
- **Smart Batching**: Automatic optimization for multi-image workflows
- **Quality Mode Analytics**: Usage pattern insights and recommendations