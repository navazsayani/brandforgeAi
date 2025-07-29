import { generateImageWithFireworks, getFireworksDimensions } from '../../../../src/lib/fireworks-client';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Fireworks AI Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FIREWORKS_API_KEY = 'test-api-key';
    process.env.FIREWORKS_BASE_URL = 'https://api.fireworks.ai/inference/v1';
  });

  afterEach(() => {
    delete process.env.FIREWORKS_API_KEY;
    delete process.env.FIREWORKS_BASE_URL;
  });

  describe('getFireworksDimensions', () => {
    it('should return correct dimensions for standard aspect ratios', () => {
      expect(getFireworksDimensions('1:1')).toEqual({ width: 1024, height: 1024 });
      expect(getFireworksDimensions('16:9')).toEqual({ width: 1024, height: 576 });
      expect(getFireworksDimensions('9:16')).toEqual({ width: 576, height: 1024 });
      expect(getFireworksDimensions('4:3')).toEqual({ width: 1024, height: 768 });
    });

    it('should return default dimensions for unknown aspect ratio', () => {
      expect(getFireworksDimensions('unknown')).toEqual({ width: 1024, height: 1024 });
      expect(getFireworksDimensions()).toEqual({ width: 1024, height: 1024 });
    });
  });

  describe('generateImageWithFireworks', () => {
    it('should generate image with SDXL Turbo model', async () => {
      const mockResponse = {
        images: [
          { b64_json: 'base64imagedata' }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await generateImageWithFireworks({
        model: 'sdxl-turbo',
        prompt: 'A beautiful landscape',
        width: 1024,
        height: 1024,
        num_images: 1
      });

      expect(result).toEqual(['data:image/png;base64,base64imagedata']);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.fireworks.ai/inference/v1/image_generation',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('"model":"accounts/fireworks/models/sdxl-turbo"')
        })
      );
    });

    it('should generate image with SDXL 3 model', async () => {
      const mockResponse = {
        images: [
          { b64_json: 'base64imagedata' }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await generateImageWithFireworks({
        model: 'stable-diffusion-xl-1024-v1-0',
        prompt: 'A professional marketing image',
        width: 1024,
        height: 1024,
        guidance_scale: 7.5,
        num_inference_steps: 20,
        num_images: 1
      });

      expect(result).toEqual(['data:image/png;base64,base64imagedata']);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.fireworks.ai/inference/v1/image_generation',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('"model":"accounts/fireworks/models/stable-diffusion-xl-1024-v1-0"')
        })
      );
    });

    it('should handle img2img generation', async () => {
      const mockResponse = {
        images: [
          { b64_json: 'editedimagedata' }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await generateImageWithFireworks({
        model: 'stable-diffusion-xl-1024-v1-0',
        prompt: 'Make the sky more dramatic',
        image: 'base64inputimage',
        strength: 0.7,
        width: 1024,
        height: 1024,
        num_images: 1
      });

      expect(result).toEqual(['data:image/png;base64,editedimagedata']);
      
      const requestBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      expect(requestBody.image).toBe('base64inputimage');
      expect(requestBody.strength).toBe(0.7);
    });

    it('should handle ControlNet generation', async () => {
      const mockResponse = {
        images: [
          { b64_json: 'controlnetimage' }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await generateImageWithFireworks({
        model: 'stable-diffusion-xl-1024-v1-0',
        prompt: 'A person in the same pose',
        controlnet: {
          type: 'openpose',
          conditioning_scale: 1.0,
          control_image: 'base64controlimage'
        },
        width: 1024,
        height: 1024,
        num_images: 1
      });

      expect(result).toEqual(['data:image/png;base64,controlnetimage']);
      
      const requestBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      expect(requestBody.controlnet).toEqual({
        type: 'openpose',
        conditioning_scale: 1.0,
        control_image: 'base64controlimage'
      });
    });

    it('should throw error when API key is missing', async () => {
      delete process.env.FIREWORKS_API_KEY;

      await expect(generateImageWithFireworks({
        model: 'sdxl-turbo',
        prompt: 'Test prompt',
        num_images: 1
      })).rejects.toThrow('FIREWORKS_API_KEY is not set in environment variables');
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request')
      });

      await expect(generateImageWithFireworks({
        model: 'sdxl-turbo',
        prompt: 'Test prompt',
        num_images: 1
      })).rejects.toThrow('Fireworks API error: 400 - Bad Request');
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        images: []
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await expect(generateImageWithFireworks({
        model: 'sdxl-turbo',
        prompt: 'Test prompt',
        num_images: 1
      })).rejects.toThrow('Fireworks API returned no images');
    });
  });
});