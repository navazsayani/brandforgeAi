'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface FireworksImageControlsProps {
  onQualityModeChange: (mode: 'fast' | 'balanced' | 'premium') => void;
  onAdvancedSettingsChange: (settings: {
    fireworksImg2ImgStrength?: number;
    fireworksGuidanceScale?: number;
    fireworksNumInferenceSteps?: number;
    fireworksControlNet?: {
      type: 'canny' | 'depth' | 'openpose' | 'scribble' | 'seg';
      conditioning_scale: number;
    };
  }) => void;
  showAdvancedControls?: boolean;
  qualityMode?: 'fast' | 'balanced' | 'premium';
}

export function FireworksImageControls({
  onQualityModeChange,
  onAdvancedSettingsChange,
  showAdvancedControls = false,
  qualityMode = 'balanced'
}: FireworksImageControlsProps) {
  const [img2imgStrength, setImg2imgStrength] = useState([0.8]);
  const [guidanceScale, setGuidanceScale] = useState([7.5]);
  const [inferenceSteps, setInferenceSteps] = useState([20]);
  const [controlNetType, setControlNetType] = useState<'canny' | 'depth' | 'openpose' | 'scribble' | 'seg'>('canny');
  const [controlNetScale, setControlNetScale] = useState([1.0]);

  const handleQualityChange = (value: string) => {
    const mode = value as 'fast' | 'balanced' | 'premium';
    onQualityModeChange(mode);
  };

  const handleAdvancedChange = () => {
    onAdvancedSettingsChange({
      fireworksImg2ImgStrength: img2imgStrength[0],
      fireworksGuidanceScale: guidanceScale[0],
      fireworksNumInferenceSteps: inferenceSteps[0],
      fireworksControlNet: {
        type: controlNetType,
        conditioning_scale: controlNetScale[0]
      }
    });
  };

  const getQualityDescription = (mode: string) => {
    switch (mode) {
      case 'fast':
        return 'Ultra-fast generation (2-3 seconds) - Perfect for rapid iteration and previews';
      case 'balanced':
        return 'Standard quality (5-8 seconds) - Great for most marketing needs';
      case 'premium':
        return 'Maximum quality (8-12 seconds) - Best for final campaign assets';
      default:
        return '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Enhanced Image Generation
          <Badge variant="secondary">Fireworks AI</Badge>
        </CardTitle>
        <CardDescription>
          Advanced controls for SDXL Turbo and SDXL 3 models with img2img and ControlNet support
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quality Mode Selector */}
        <div className="space-y-2">
          <Label htmlFor="quality-mode">Image Quality</Label>
          <Select value={qualityMode} onValueChange={handleQualityChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select quality mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fast">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Fast Preview</span>
                  <span className="text-xs text-muted-foreground">SDXL Turbo • 2-3 seconds</span>
                </div>
              </SelectItem>
              <SelectItem value="balanced">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Standard Quality</span>
                  <span className="text-xs text-muted-foreground">Current models • 5-8 seconds</span>
                </div>
              </SelectItem>
              <SelectItem value="premium">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Premium Quality</span>
                  <span className="text-xs text-muted-foreground">SDXL 3 • 8-12 seconds</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {getQualityDescription(qualityMode)}
          </p>
        </div>

        {/* Advanced Controls */}
        {showAdvancedControls && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Advanced Controls</h4>
              
              {/* img2img Strength */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="img2img-strength">img2img Strength</Label>
                  <span className="text-xs text-muted-foreground">{img2imgStrength[0]}</span>
                </div>
                <Slider
                  id="img2img-strength"
                  min={0}
                  max={1}
                  step={0.1}
                  value={img2imgStrength}
                  onValueChange={(value) => {
                    setImg2imgStrength(value);
                    handleAdvancedChange();
                  }}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  How much to transform the input image (0 = no change, 1 = complete transformation)
                </p>
              </div>

              {/* Guidance Scale */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="guidance-scale">Guidance Scale</Label>
                  <span className="text-xs text-muted-foreground">{guidanceScale[0]}</span>
                </div>
                <Slider
                  id="guidance-scale"
                  min={1}
                  max={20}
                  step={0.5}
                  value={guidanceScale}
                  onValueChange={(value) => {
                    setGuidanceScale(value);
                    handleAdvancedChange();
                  }}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  How closely to follow the prompt (higher = more adherence)
                </p>
              </div>

              {/* Inference Steps */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="inference-steps">Inference Steps</Label>
                  <span className="text-xs text-muted-foreground">{inferenceSteps[0]}</span>
                </div>
                <Slider
                  id="inference-steps"
                  min={4}
                  max={50}
                  step={1}
                  value={inferenceSteps}
                  onValueChange={(value) => {
                    setInferenceSteps(value);
                    handleAdvancedChange();
                  }}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Number of generation steps (more = higher quality, slower)
                </p>
              </div>

              {/* ControlNet Type */}
              <div className="space-y-2">
                <Label htmlFor="controlnet-type">ControlNet Type</Label>
                <Select value={controlNetType} onValueChange={(value: any) => {
                  setControlNetType(value);
                  handleAdvancedChange();
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="canny">Canny (Edge Detection)</SelectItem>
                    <SelectItem value="depth">Depth (3D Structure)</SelectItem>
                    <SelectItem value="openpose">OpenPose (Human Poses)</SelectItem>
                    <SelectItem value="scribble">Scribble (Sketch Control)</SelectItem>
                    <SelectItem value="seg">Segmentation (Object Masks)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ControlNet Scale */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="controlnet-scale">ControlNet Strength</Label>
                  <span className="text-xs text-muted-foreground">{controlNetScale[0]}</span>
                </div>
                <Slider
                  id="controlnet-scale"
                  min={0}
                  max={2}
                  step={0.1}
                  value={controlNetScale}
                  onValueChange={(value) => {
                    setControlNetScale(value);
                    handleAdvancedChange();
                  }}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  How strongly to apply ControlNet guidance
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}