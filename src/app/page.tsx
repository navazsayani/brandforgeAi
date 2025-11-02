"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, UserCircle, Rocket, Paintbrush, Send, ArrowRight, Wand2, Layers, Target, CheckCircle, TrendingUp, Users, Clock, Star, X, Lightbulb, Zap, Building, RefreshCcw, Globe, Eye, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import ShowcasePreviewModal from '@/components/ShowcasePreviewModal';
import { showcaseExamples } from '@/lib/showcase/showcase-data';
import TestimonialSection from '@/components/testimonials/TestimonialSection';
import GalleryCarousel from '@/components/inspiration/GalleryCarousel';

// Template ID to Showcase ID mapping
const templateShowcaseMap: Record<string, string> = {
  'coffee_shop': 'daily-grind-coffee',
  'yoga_studio': 'zen-flow-yoga',
  'beauty_salon': 'bloom-beauty',
  'online_boutique': 'chic-boutique',
  'restaurant': 'artisan-table',
  'fitness_coach': 'fitlife-performance',
  'skincare_brand': 'glow-skincare',
};

const FeatureCard = ({ icon: Icon, title, description, id }: { icon: React.ElementType, title: string, description: string, id: string }) => (
    <div id={id} className="card-compact text-left p-6 md:p-8 h-full flex flex-col group border-primary/20 hover:border-primary/50">
        <div className="p-4 bg-primary/10 rounded-xl w-fit mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
            <Icon className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-3 text-break">{title}</h3>
        <p className="text-base text-muted-foreground text-balance flex-grow">
            {description}
        </p>
    </div>
);

// Enhanced Brand Journey Components
const BrandStoryCard = ({
  icon: Icon,
  stage,
  title,
  characterStory,
  beforeAfter,
  metrics,
  index,
  isActive,
  onHover
}: {
  icon: React.ElementType;
  stage: string;
  title: string;
  characterStory: string;
  beforeAfter: { before: string; after: string };
  metrics: string;
  index: number;
  isActive: boolean;
  onHover: (index: number | null) => void;
}) => (
  <div
    className={`relative group cursor-pointer transition-all duration-500 ${
      isActive ? 'scale-105 z-10' : 'hover:scale-102'
    }`}
    onMouseEnter={() => onHover(index)}
    onMouseLeave={() => onHover(null)}
  >
    {/* Main Card */}
    <div className={`relative bg-gradient-to-br from-card via-card/95 to-card/90 border-2 rounded-2xl p-8 h-full flex flex-col shadow-lg transition-all duration-500 ${
      isActive
        ? 'border-primary/60 shadow-2xl shadow-primary/20'
        : 'border-border/30 hover:border-primary/40 hover:shadow-xl'
    }`}>
      
      {/* Stage Badge */}
      <div className="absolute -top-3 left-6 px-4 py-1 bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold rounded-full shadow-md">
        {stage}
      </div>
      
      {/* Icon */}
      <div className={`p-4 rounded-2xl w-fit mb-6 transition-all duration-300 ${
        isActive
          ? 'bg-primary/20 shadow-lg scale-110'
          : 'bg-primary/10 group-hover:bg-primary/15 group-hover:scale-105'
      }`}>
        <Icon className={`h-12 w-12 transition-colors duration-300 ${
          isActive ? 'text-primary' : 'text-primary/80 group-hover:text-primary'
        }`} />
      </div>
      
      {/* Title */}
      <h3 className="text-2xl font-bold mb-4 text-balance leading-tight">
        {title}
      </h3>
      
      {/* Character Story */}
      <div className="mb-6 flex-grow">
        <p
          className="text-muted-foreground text-balance leading-relaxed italic"
          dangerouslySetInnerHTML={{
            __html: `"${characterStory.replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary font-semibold not-italic">$1</strong>')}"`
          }}
        />
      </div>
      
      {/* Before/After */}
      <div className="space-y-4 mb-6">
        <div className="flex items-start space-x-3">
          <div className="w-2 h-2 rounded-full bg-destructive/60 mt-2 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive/80 mb-1">Before:</p>
            <p
              className="text-sm text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html: beforeAfter.before.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
              }}
            />
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-primary mb-1">After:</p>
            <p
              className="text-sm text-foreground"
              dangerouslySetInnerHTML={{
                __html: beforeAfter.after.replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary font-semibold">$1</strong>')
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Metrics */}
      <div className="flex items-center space-x-2 text-sm font-medium text-accent">
        <TrendingUp className="w-4 h-4" />
        <span>{metrics}</span>
      </div>
      
      {/* Hover Effect Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl transition-opacity duration-300 ${
        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`} />
    </div>
  </div>
);

// Smart Recommendation Modal Component
const SmartRecommendationModal = ({
  isOpen,
  onClose,
  selectedStage,
  userCountry = 'US'
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedStage: string | null;
  userCountry?: string;
}) => {
  const [formData, setFormData] = useState<{ [key: string]: string }>({});
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Reset modal state when selectedStage changes
  useEffect(() => {
    if (selectedStage) {
      setFormData({});
      setShowRecommendations(false);
      setIsGenerating(false);
    }
  }, [selectedStage]);

  // Dynamic ad spend options based on country
  const adSpendOptions = userCountry === 'IN'
    ? ['₹0-10,000', '₹10,000-50,000', '₹50,000-2,00,000', '₹2,00,000+']
    : ['$0-500', '$500-2,000', '$2,000-10,000', '$10,000+'];

  const stageConfigs = {
    new: {
      title: "Tell us about your new brand idea",
      icon: Rocket,
      color: "text-blue-500",
      fields: [
        { key: 'businessIdea', label: 'What\'s your business idea?', type: 'textarea', placeholder: 'e.g., Organic skincare products for sensitive skin...' },
        { key: 'industry', label: 'Industry', type: 'select', options: ['Fashion & Apparel', 'Beauty & Cosmetics', 'Food & Beverage', 'Health & Wellness', 'Technology', 'Other'] },
        { key: 'targetAudience', label: 'Who is your target audience?', type: 'input', placeholder: 'e.g., Working women aged 25-40...' },
        { key: 'challenge', label: 'Biggest branding challenge?', type: 'select', options: ['Creating a logo', 'Choosing colors', 'Writing brand messaging', 'Getting started - don\'t know where to begin', 'All of the above'] }
      ],
      recommendations: [
        { icon: UserCircle, title: 'Start with Brand Identity Creation', description: 'AI will extract your brand essence from your idea and generate your first logo, colors, and visual identity' },
        { icon: Wand2, title: 'Launch with First Content Pack', description: 'Get your initial social media posts and basic marketing materials to start building presence' },
        { icon: Rocket, title: 'Quick Setup & Go Live', description: 'Organize everything in your personal hub and get ready to launch your brand professionally' }
      ]
    },
    growing: {
      title: "Help us understand your content needs",
      icon: Layers,
      color: "text-green-500",
      fields: [
        { key: 'businessType', label: 'What type of business do you run?', type: 'input', placeholder: 'e.g., Handcrafted furniture, Digital agency...' },
        { key: 'contentFrequency', label: 'How often do you post content?', type: 'select', options: ['Daily', 'Few times a week', 'Weekly', 'Rarely'] },
        { key: 'platforms', label: 'Main social platforms', type: 'select', options: ['Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'Multiple platforms'] },
        { key: 'timeSpent', label: 'Hours spent on content weekly?', type: 'select', options: ['1-5 hours', '5-10 hours', '10-20 hours', '20+ hours'] }
      ],
      recommendations: [
        { icon: Layers, title: 'Scale Your Content Production', description: 'Generate weeks of consistent, on-brand social posts and blog articles that match your established voice' },
        { icon: Building, title: 'Build Your Visual Asset Library', description: 'Create and organize a growing collection of brand-consistent images and graphics for all your content needs' },
        { icon: Send, title: 'Streamline Your Content Creation', description: 'Organize and manage all your generated content in one central hub, ready for publishing across platforms' }
      ]
    },
    established: {
      title: "Let's optimize your marketing ROI",
      icon: Target,
      color: "text-purple-500",
      fields: [
        { key: 'businessSize', label: 'Business size', type: 'select', options: ['Solo entrepreneur', 'Small team (2-10)', 'Medium business (10-50)', 'Large business (50+)'] },
        { key: 'marketingChannels', label: 'Current marketing channels', type: 'select', options: ['Social media only', 'Email + Social', 'Paid ads + Social', 'Multi-channel'] },
        { key: 'adSpend', label: 'Monthly ad spend', type: 'select', options: adSpendOptions },
        { key: 'goal', label: 'Primary conversion goal', type: 'select', options: ['Brand awareness', 'Lead generation', 'Direct sales', 'App downloads'] }
      ],
      recommendations: [
        { icon: Target, title: 'Generate High-Converting Ad Copy', description: 'Transform your best content into compelling ad copy and visuals optimized for conversion across all platforms' },
        { icon: TrendingUp, title: 'Maximize Content ROI', description: 'Turn your existing materials into conversion-focused blog posts and social content that drives measurable results' },
        { icon: Building, title: 'Complete Ad Campaign Packages', description: 'Create comprehensive campaign assets including ad copy, visuals, and landing page content all in one place' }
      ]
    }
  };

  const currentConfig = selectedStage ? stageConfigs[selectedStage as keyof typeof stageConfigs] : null;

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const generateRecommendations = async () => {
    setIsGenerating(true);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    setShowRecommendations(true);
  };

  const handleGetStarted = () => {
    const params = new URLSearchParams({
      stage: selectedStage || '',
      ...formData
    });
    window.location.href = `/signup?${params.toString()}`;
  };

  if (!currentConfig) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 sm:space-x-3 text-lg sm:text-xl">
            <div className={`p-1.5 sm:p-2 rounded-lg bg-primary/10`}>
              <currentConfig.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${currentConfig.color}`} />
            </div>
            <span className="leading-tight">{currentConfig.title}</span>
          </DialogTitle>
        </DialogHeader>

        {!showRecommendations ? (
          <div className="space-y-6 py-4">
            <p className="text-muted-foreground">
              Help us understand your needs so we can provide personalized recommendations.
            </p>

            <div className="space-y-4">
              {currentConfig.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  {field.type === 'input' && (
                    <Input
                      id={field.key}
                      placeholder={'placeholder' in field ? field.placeholder : ''}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                    />
                  )}
                  {field.type === 'textarea' && (
                    <Textarea
                      id={field.key}
                      placeholder={'placeholder' in field ? field.placeholder : ''}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      rows={3}
                    />
                  )}
                  {field.type === 'select' && (
                    <Select value={formData[field.key] || ''} onValueChange={(value) => handleInputChange(field.key, value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4">
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                onClick={generateRecommendations}
                disabled={isGenerating || Object.keys(formData).length < 2}
                className="btn-gradient-primary w-full sm:w-auto"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Get My Recommendations'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full text-sm font-medium text-primary mb-4">
                <CheckCircle className="w-4 h-4" />
                <span>Personalized recommendations ready!</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Here's your BrandForge AI roadmap:</h3>
              <p className="text-muted-foreground">
                Based on your responses, we've identified the perfect tools to accelerate your brand growth.
              </p>
            </div>

            <div className="space-y-4">
              {currentConfig.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg border border-primary/20 bg-primary/5">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0">
                    <rec.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground text-sm sm:text-base">{rec.title}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{rec.description}</p>
                  </div>
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                <strong>Expected timeline:</strong> Professional results in 2-3 weeks
              </p>
              <p className="text-sm text-muted-foreground">
                Your personalized workspace will be pre-configured with these recommendations.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Maybe Later
              </Button>
              <Button onClick={handleGetStarted} className="btn-gradient-primary btn-lg-enhanced w-full sm:w-auto">
                Start My Journey <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const StageAssessment = ({ onStageSelect, selectedStage: parentSelectedStage }: { onStageSelect: (stage: string) => void; selectedStage?: string | null }) => {
  const [selectedStage, setSelectedStage] = useState<string | null>(parentSelectedStage || null);

  // Sync with parent state
  useEffect(() => {
    if (parentSelectedStage !== selectedStage) {
      setSelectedStage(parentSelectedStage || null);
    }
  }, [parentSelectedStage, selectedStage]);
  
  const stages = [
    { id: 'new', label: 'Just getting started', description: 'I have an idea but need to build my brand identity', icon: Rocket, color: 'text-blue-500' },
    { id: 'growing', label: 'Scaling my presence', description: 'I have a brand but struggle with consistent content', icon: Layers, color: 'text-green-500' },
    { id: 'established', label: 'Optimizing for growth', description: 'I need better ROI from my marketing efforts', icon: Target, color: 'text-purple-500' }
  ];
  
  return (
    <div className="bg-gradient-to-br from-secondary/20 to-accent/10 rounded-2xl p-4 sm:p-6 md:p-8 border border-border/30">
      <div className="text-center mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-bold mb-2">Which stage are you in?</h3>
        <p className="text-sm sm:text-base text-muted-foreground">Get personalized recommendations for your brand journey</p>
      </div>
      
      <div className="space-y-3">
        {stages.map((stage) => (
          <button
            key={stage.id}
            onClick={() => {
              setSelectedStage(stage.id);
              onStageSelect(stage.id);
            }}
            className={`w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 ${
              selectedStage === stage.id
                ? 'border-primary bg-primary/10 shadow-md'
                : 'border-border/30 hover:border-primary/40 hover:bg-primary/5'
            }`}
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className={`p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0`}>
                <stage.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stage.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium mb-1 text-sm sm:text-base">{stage.label}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{stage.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {selectedStage && (
        <div className="mt-6 text-center">
          <Button
            size="sm"
            className="btn-gradient-primary"
            onClick={() => onStageSelect(selectedStage)}
          >
            Show My Path <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

// Video Player Component with Centered Play Button
const VideoPlayer = ({
    videoUrl,
    posterUrl,
    className = ""
}: {
    videoUrl: string;
    posterUrl?: string;
    className?: string;
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = React.useRef<HTMLVideoElement>(null);

    const handlePlayClick = () => {
        if (videoRef.current) {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleVideoPlay = () => setIsPlaying(true);
    const handleVideoPause = () => setIsPlaying(false);
    const handleVideoEnded = () => setIsPlaying(false);

    return (
        <div className={`relative ${className}`}>
            <video
                ref={videoRef}
                poster={posterUrl}
                src={videoUrl}
                className="w-full h-full object-cover"
                controls={isPlaying}
                playsInline
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                onEnded={handleVideoEnded}
            />
            {!isPlaying && (
                <button
                    onClick={handlePlayClick}
                    className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-all group cursor-pointer"
                    aria-label="Play video"
                >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white/70 hover:bg-white/90 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 md:w-10 md:h-10 text-primary ml-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                    </div>
                </button>
            )}
        </div>
    );
};

const HowItWorksStep = ({
    number,
    title,
    description,
    videoUrl,
    videoPoster
}: {
    number: string;
    title: string;
    description: string;
    videoUrl?: string;
    videoPoster?: string;
}) => (
    <div className="relative flex flex-col items-center text-center group">
         <div className="absolute top-6 left-1/2 w-full border-t-2 border-dashed border-border/70 -translate-x-full group-first:hidden hidden md:block"></div>
        <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground text-2xl font-bold border-4 border-background shadow-lg">
            {number}
        </div>

        {/* Video Section */}
        {videoUrl ? (
            <div className="mt-6 mb-4 w-full max-w-xs aspect-video bg-secondary/20 rounded-lg border border-border overflow-hidden group-hover:border-primary/50 transition-all shadow-md">
                <VideoPlayer videoUrl={videoUrl} posterUrl={videoPoster} />
            </div>
        ) : (
            <div className="mt-6 mb-4 w-full max-w-xs aspect-video bg-gradient-to-br from-secondary/20 to-accent/10 rounded-lg border border-dashed border-primary/30 flex items-center justify-center group-hover:border-primary/50 transition-all">
                <div className="text-center p-4">
                    <div className="w-12 h-12 mx-auto mb-2 bg-primary/20 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                    </div>
                    <p className="text-xs text-muted-foreground">Video coming soon</p>
                </div>
            </div>
        )}

        <h3 className="text-xl font-bold">{title}</h3>
        <p className="mt-2 text-muted-foreground text-balance max-w-xs">
            {description}
        </p>
    </div>
);

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const heroImages = [
    {
      src: "/hero-brandforge-ai.svg",
      alt: "BrandForge AI dashboard interface showing brand profile creation, content studio with AI-generated images, campaign manager, and deployment hub",
      title: "Complete AI Branding Suite"
    },
    {
      src: "/hero-brandforge-ai-2.svg",
      alt: "BrandForge AI content creation studio with AI blog writer and social media generator",
      title: "AI-Powered Content Creation"
    },
    {
      src: "/hero-brandforge-ai-3.svg",
      alt: "BrandForge AI content studio with AI image generator, blog writer, and social media post creator",
      title: "AI Content Creation Studio"
    },
    {
      src: "/hero-brandforge-ai-4.svg",
      alt: "BrandForge AI brand builder with logo generation and brand profile customization",
      title: "AI Brand Identity Builder"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [heroImages.length]);

  return (
    <div className="relative mt-10 w-full max-w-4xl mx-auto group">
      <div className="relative overflow-hidden rounded-xl">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`transition-all duration-1000 ease-in-out ${
              index === currentSlide
                ? 'opacity-100 translate-x-0'
                : index < currentSlide
                  ? 'opacity-0 -translate-x-full absolute inset-0'
                  : 'opacity-0 translate-x-full absolute inset-0'
            }`}
          >
            <NextImage
              src={image.src}
              alt={image.alt}
              width={1200}
              height={675}
              className="rounded-xl shadow-2xl border border-primary/10 transform group-hover:scale-[1.02] transition-transform duration-500 ease-out"
              priority={index === 0}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent rounded-xl"></div>
      </div>
      
      {/* Slide Indicators */}
      <div className="flex justify-center mt-6 space-x-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-primary scale-110'
                : 'bg-primary/30 hover:bg-primary/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      
      {/* Slide Title */}
      <div className="text-center mt-4">
        <p className="text-sm text-muted-foreground font-medium">
          {heroImages[currentSlide].title}
        </p>
      </div>
    </div>
  );
};

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeStoryCard, setActiveStoryCard] = useState<number | null>(null);
  const [selectedAssessmentStage, setSelectedAssessmentStage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStage, setModalStage] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string>('US');
  const [modalShowcaseId, setModalShowcaseId] = useState<string | null>(null);
  const showcaseScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Detect user's country for currency localization
    fetch('https://www.cloudflare.com/cdn-cgi/trace')
      .then(res => res.text())
      .then(data => {
        const lines = data.split('\n');
        const locLine = lines.find(line => line.startsWith('loc='));
        const country = locLine ? locLine.split('=')[1] : 'US';
        setUserCountry(country);
      })
      .catch(() => {
        setUserCountry('US');
      });
  }, []);

  // Scroll handler functions for showcase carousel
  const checkScrollButtons = useCallback(() => {
    if (showcaseScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = showcaseScrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  const scrollShowcase = (direction: 'left' | 'right') => {
    if (showcaseScrollRef.current) {
      const scrollAmount = 420; // Card width (400px) + gap (20px)
      const newScrollLeft = direction === 'left'
        ? showcaseScrollRef.current.scrollLeft - scrollAmount
        : showcaseScrollRef.current.scrollLeft + scrollAmount;

      showcaseScrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const scrollContainer = showcaseScrollRef.current;
    if (scrollContainer) {
      checkScrollButtons();
      scrollContainer.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);

      return () => {
        scrollContainer.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [checkScrollButtons]);

  const brandStories = [
    {
      stage: "Stage 1",
      title: "The Spark: From Idea to Identity",
      icon: Rocket,
      characterStory: "Sarah had this amazing idea for organic skincare but felt completely lost when it came to branding. She'd tried designing logos herself and even hired a few freelancers, but nothing felt right. After using **BrandForge AI's brand identity generator**, she got her first logo, but it needed tweaks. Instead of starting over, she used the **AI Refinement Studio** to perfect it with simple instructions like 'make the leaves more delicate' and 'soften the green tone.' Three refinements later, she had the perfect logo that her customers immediately connected with.",
      beforeAfter: {
        before: "Struggling with inconsistent visuals, spending thousands on different designers, feeling frustrated with the branding process",
        after: "Perfect **brand identity** achieved through **AI generation and refinement**, saving both time and money"
      },
      metrics: "First month sales increased by 67% with new brand identity"
    },
    {
      stage: "Stage 2",
      title: "The Scale: From Presence to Power",
      icon: Layers,
      characterStory: "Alex's handcrafted furniture business was doing well, but he was burning out trying to keep up with social media. Between running the workshop and managing orders, creating content felt impossible. Now he spends just 30 minutes every Sunday using **BrandForge AI's Content Studio** to generate a week's worth of posts. What surprised him most? The AI started noticing his most engaging posts featured close-up wood grain details and warm lighting. Now every generated image automatically includes these elements, and his followers actually engage more because the **AI-learned content** feels authentically 'Alex'.",
      beforeAfter: {
        before: "Posting once a week if lucky, running out of content ideas, inconsistent messaging across platforms",
        after: "Daily posts using **Smart Learning AI**, 2.4x more engagement, and 15 hours saved per week"
      },
      metrics: "Monthly inquiries increased from 12 to 31 with consistent posting"
    },
    {
      stage: "Stage 3",
      title: "The Optimization: From Reach to ROI",
      icon: Target,
      characterStory: "Maria's digital marketing agency had great case studies and blog content, but their ad campaigns weren't converting well. They were spending hours manually creating ad variations and still seeing mediocre results. After implementing **BrandForge AI's Campaign Manager**, they started turning their best content into targeted ads that actually worked. The **campaign optimization tools** transformed their approach, and their client retention improved significantly.",
      beforeAfter: {
        before: "Manually creating 3-4 ad variations per campaign, 1.2% average conversion rate, clients questioning ROI",
        after: "Using **AI-powered campaign tools** to test 15+ variations, 2.8% conversion rate, clients asking for bigger budgets"
      },
      metrics: "Client ad spend efficiency improved by 127% in 3 months"
    }
  ];

  const handleStageAssessment = (stage: string) => {
    setSelectedAssessmentStage(stage);
    setModalStage(stage);
    setIsModalOpen(true);
    
    // Also highlight the relevant story card
    const stageMap: { [key: string]: number } = { 'new': 0, 'growing': 1, 'established': 2 };
    const targetIndex = stageMap[stage];
    if (targetIndex !== undefined) {
      setActiveStoryCard(targetIndex);
      setTimeout(() => setActiveStoryCard(null), 3000);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalStage(null);
  };


  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Loading BrandForge AI...</p>
        </div>
      </div>
    );
  }
  
  if (user) {
    return (
       <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <PublicHeader />
      
      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-16 text-center animate-fade-in">
          <div className="container-responsive">
            <div className="max-w-4xl mx-auto">
               <p className="text-5xl md:text-6xl font-extrabold text-gradient-brand mb-4 text-balance">
                    BrandForge AI
                </p>
                {/* Eyebrow */}
                <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full text-sm font-semibold text-primary mb-6">
                  <Zap className="w-4 h-4" />
                  <span>The Only AI That Learns YOUR Brand Voice</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl md:text-6xl font-extrabold text-balance mb-6">
                    From Good to <span className="text-gradient-brand">Perfect</span>:<br />
                    AI Content with Unlimited Refinement
                </h1>

                {/* Subheadline */}
                <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground text-balance leading-relaxed">
                    Complete AI branding platform: Generate <strong className="text-foreground">logos, images, social posts, blogs, and ad campaigns</strong>—then <strong className="text-foreground">refine everything to perfection</strong> with simple text commands. Unlike DALL-E or ChatGPT, you don't start over. No design skills needed.
                </p>

                {/* Hero Videos - Dual Feature Showcase */}
                <div className="mt-10 mb-8">
                  <div className="w-full max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                      {/* AI Refinement Video */}
                      <div className="relative">
                        <div className="rounded-xl border-2 border-primary/20 shadow-lg overflow-hidden">
                          <VideoPlayer
                            videoUrl="https://firebasestorage.googleapis.com/v0/b/brandforge-ai-jr0z4.firebasestorage.app/o/videos%2FAi_refine_serum.mp4?alt=media"
                            posterUrl="/videos/Ai_refine_serum.jpg"
                          />
                        </div>
                        <p className="text-center text-sm text-muted-foreground mt-3">
                          From first draft to perfect image—all with simple AI commands
                        </p>
                      </div>

                      {/* Social Media Video */}
                      <div className="relative">
                        <div className="rounded-xl border-2 border-primary/20 shadow-lg overflow-hidden">
                          <VideoPlayer
                            videoUrl="https://firebasestorage.googleapis.com/v0/b/brandforge-ai-jr0z4.firebasestorage.app/o/videos%2FAi_social_serum.mp4?alt=media"
                            posterUrl="/videos/Ai_social_serum.jpg"
                          />
                        </div>
                        <p className="text-center text-sm text-muted-foreground mt-3">
                          Generate, refine, and perfect social posts in one seamless workflow
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTAs */}
                <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                    <Button size="lg" className="btn-gradient-primary btn-lg-enhanced focus-enhanced" asChild>
                        <Link href={user ? "/dashboard" : "/signup"}>
                            {user ? "Go to Dashboard" : "Try Refinement Studio Free"}
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="btn-lg-enhanced" asChild>
                        <Link href="#how-it-works">
                            See How It Works
                        </Link>
                    </Button>
                </div>

                {/* Trust Bar */}
                <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>100% Free to Start</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>No Credit Card Required</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>Unlimited Refinements</span>
                  </div>
                </div>

                {/* Smart Learning Callout */}
                <div className="mt-10 p-6 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-primary/10">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <div className="p-2 bg-primary/15 rounded-lg">
                      <Lightbulb className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-base font-semibold text-primary">AI That Actually Learns Your Brand</span>
                  </div>
                  <p className="text-sm text-muted-foreground text-center max-w-2xl mx-auto">
                    Our Retrieval-Augmented Generation (RAG) system remembers your best content and learns your brand voice. Unlike ChatGPT that forgets everything, BrandForge gets smarter with every piece you create.{' '}
                    <Link href="/features#smart-learning" className="text-primary hover:underline font-medium">
                      Learn more →
                    </Link>
                  </p>
                </div>

                {/* Platform Preview Carousel - Hidden until real screenshots ready */}
                {/* <HeroCarousel /> */}
            </div>
          </div>
        </section>

        {/* Gallery Carousel - Visual Examples */}
        <GalleryCarousel itemCount={12} autoScroll={true} scrollSpeed={30} />

        {/* Templates Section */}
        <section className="py-12 sm:py-16 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container-responsive">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Rocket className="w-4 h-4" />
                <span>Start in Seconds</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
                <span className="text-gradient-brand">20+ Industry Templates</span> to Get You Started
              </h2>
              <p className="text-lg text-muted-foreground text-balance">
                No blank canvas anxiety. Choose a professional template tailored to your industry and customize it to match your brand.
              </p>
            </div>

            {/* Template Grid - Show 8 popular ones */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              {[
                { icon: '☕', name: 'Coffee Shop', color: 'from-amber-500/10 to-orange-500/10 border-amber-500/20' },
                { icon: '💻', name: 'Tech Startup', color: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20' },
                { icon: '🏋️', name: 'Fitness Coach', color: 'from-green-500/10 to-emerald-500/10 border-green-500/20' },
                { icon: '👗', name: 'Online Boutique', color: 'from-pink-500/10 to-rose-500/10 border-pink-500/20' },
                { icon: '🎨', name: 'Designer', color: 'from-purple-500/10 to-violet-500/10 border-purple-500/20' },
                { icon: '🎥', name: 'Content Creator', color: 'from-red-500/10 to-pink-500/10 border-red-500/20' },
                { icon: '💅', name: 'Beauty Salon', color: 'from-rose-500/10 to-pink-500/10 border-rose-500/20' },
                { icon: '🐾', name: 'Pet Services', color: 'from-orange-500/10 to-amber-500/10 border-orange-500/20' },
              ].map((template, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-xl bg-gradient-to-br ${template.color} border text-center hover:scale-105 transition-transform duration-300 cursor-default`}
                >
                  <div className="text-4xl mb-2">{template.icon}</div>
                  <p className="text-sm font-medium">{template.name}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Plus 12 more templates for Real Estate, Consulting, E-commerce, Events, and more!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="btn-gradient-primary text-base sm:text-lg">
                  <Link href="/templates">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Browse All Templates
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-base sm:text-lg">
                  <Link href="/signup">
                    Start For Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Real Examples Showcase */}
        <section className="py-12 sm:py-16 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                <span>Real Examples</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Real Brands. Real Results. <span className="text-gradient-brand">Under 60 Seconds</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See exactly what BrandForge AI creates. Logos, social posts, and images - all AI-generated from our templates.
              </p>
            </div>
          </div>

          {/* Horizontal Scrollable Showcase */}
          <div className="relative">
            {/* Left Scroll Button */}
            <button
              onClick={() => scrollShowcase('left')}
              disabled={!canScrollLeft}
              className={`hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-12 h-12 rounded-full bg-background/90 backdrop-blur-sm border-2 border-primary/20 shadow-lg transition-all hover:scale-110 hover:border-primary/50 hover:shadow-xl ${
                !canScrollLeft ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6 text-primary" />
            </button>

            {/* Right Scroll Button */}
            <button
              onClick={() => scrollShowcase('right')}
              disabled={!canScrollRight}
              className={`hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-12 h-12 rounded-full bg-background/90 backdrop-blur-sm border-2 border-primary/20 shadow-lg transition-all hover:scale-110 hover:border-primary/50 hover:shadow-xl ${
                !canScrollRight ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6 text-primary" />
            </button>

            <div ref={showcaseScrollRef} className="overflow-x-auto pb-4 scrollbar-hide">
              <div className="flex gap-6 px-4 sm:px-8 lg:px-12">
              {showcaseExamples
                .filter(example => Object.values(templateShowcaseMap).includes(example.id))
                .map((example, idx) => {
                  // Use different post index for variety
                  const postIndex = idx % example.posts.length;
                  const post = example.posts[postIndex];

                  return (
                    <Card
                      key={example.id}
                      className="group cursor-pointer hover:border-primary transition-all hover:shadow-2xl shrink-0 w-[340px] sm:w-[400px] overflow-hidden"
                      onClick={() => setModalShowcaseId(example.id)}
                    >
                      <CardContent className="p-6">
                        {/* Logo Section */}
                        <div className="flex items-center gap-4 mb-6">
                          <div className="relative shrink-0">
                            {/* Outer glow ring */}
                            <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-sm group-hover:from-primary/30 group-hover:to-accent/30 transition-all" />
                            {/* Main logo container */}
                            <div className="relative bg-gradient-to-br from-white via-primary/5 to-accent/5 rounded-full p-5 border-2 border-white shadow-lg group-hover:shadow-xl transition-all overflow-hidden">
                              {/* Inner subtle border for depth */}
                              <div className="absolute inset-3 border border-primary/10 rounded-full pointer-events-none z-20" />
                              <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-white relative z-10">
                                <NextImage
                                  src={example.logo}
                                  alt={`${example.brandName} logo`}
                                  width={56}
                                  height={56}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors truncate">
                              {example.brandName}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">{example.industry}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {example.logoType && (
                                <Badge variant="secondary" className="text-xs capitalize">
                                  {example.logoType}
                                </Badge>
                              )}
                              {example.logoStyle && (
                                <Badge variant="secondary" className="text-xs capitalize">
                                  {example.logoStyle}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Instagram Post Preview */}
                        <div className="relative mb-4 rounded-lg overflow-hidden border-2 border-muted">
                          <NextImage
                            src={post.image}
                            alt={`${example.brandName} post`}
                            width={400}
                            height={400}
                            className="object-cover w-full aspect-square transition-transform group-hover:scale-105"
                          />
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="text-center text-white">
                              <Eye className="w-10 h-10 mx-auto mb-2" />
                              <p className="text-sm font-semibold">View Full Example</p>
                              <p className="text-xs text-white/80 mt-1">See all platforms & posts</p>
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center">
                          <Badge variant="outline" className="text-xs">
                            ✨ {post.generationTime}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Scroll Hint */}
          <div className="text-center mt-6 px-4">
            <p className="text-sm text-muted-foreground">
              ← Scroll to see more examples →
            </p>
          </div>
        </section>

        {/* Testimonials Section */}
        <TestimonialSection
          title={<>Loved by <span className="text-gradient-brand">Entrepreneurs & Creators</span></>}
          description="See how BrandForge AI has transformed content creation for businesses just like yours"
          count={3}
          featured={true}
          layout="grid"
          variant="default"
          columns={3}
          showBrandLogos={true}
          showRating={false}
          sectionClassName="bg-background"
          eyebrowText="Success Stories"
        />

        {/* What You Can Create Section */}
        <section className="py-16 bg-secondary/20">
          <div className="container-responsive">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-balance mb-4">
                Everything You Need to <span className="text-gradient-brand">Build Your Brand</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                From brand identity to deployment—all powered by AI that learns your style
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Logo Generation */}
              <div className="group p-6 bg-card rounded-xl border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
                  <UserCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Brand Logos</h3>
                <p className="text-sm text-muted-foreground">
                  Professional logo generation with multiple styles, shapes, and color palettes
                </p>
              </div>

              {/* Image Generation */}
              <div className="group p-6 bg-card rounded-xl border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Paintbrush className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">AI Images</h3>
                <p className="text-sm text-muted-foreground">
                  Generate stunning visuals from scratch or transform your own photos into professional quality
                </p>
              </div>

              {/* Social Posts */}
              <div className="group p-6 bg-card rounded-xl border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Send className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Social Media Posts</h3>
                <p className="text-sm text-muted-foreground">
                  Platform-optimized content for Instagram, LinkedIn, Twitter, Facebook, YouTube, TikTok
                </p>
              </div>

              {/* Blog Content */}
              <div className="group p-6 bg-card rounded-xl border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Layers className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Blog Articles</h3>
                <p className="text-sm text-muted-foreground">
                  SEO-optimized long-form content from outline to finished draft
                </p>
              </div>

              {/* Ad Campaigns */}
              <div className="group p-6 bg-card rounded-xl border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Ad Campaigns</h3>
                <p className="text-sm text-muted-foreground">
                  High-converting ad copy for Google Ads and Meta platforms with A/B variations
                </p>
              </div>

              {/* Brand Voice Learning */}
              <div className="group p-6 bg-card rounded-xl border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Lightbulb className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Brand Voice AI</h3>
                <p className="text-sm text-muted-foreground">
                  AI that learns and remembers your brand style across all content types
                </p>
              </div>

              {/* Multi-Language Support */}
              <div className="group p-6 bg-card rounded-xl border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Globe className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">14 Languages</h3>
                <p className="text-sm text-muted-foreground">
                  Generate content in English, Spanish, Hindi, Japanese, Chinese, Arabic, and 9 more languages
                </p>
              </div>

              {/* Social Media Previews */}
              <div className="group p-6 bg-card rounded-xl border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Eye className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Live Platform Previews</h3>
                <p className="text-sm text-muted-foreground">
                  See exactly how posts will look on Instagram, LinkedIn, Twitter before publishing
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button size="lg" variant="outline" className="btn-lg-enhanced" asChild>
                <Link href="/features">
                  View Detailed Features
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-12 sm:py-16 scroll-mt-24">
            <div className="container-responsive">
                <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-balance">Get Results in <span className="text-gradient-brand">3 Simple Steps</span></h2>
                    <p className="mt-4 text-lg text-muted-foreground text-balance">
                        Our intuitive workflow makes powerful AI accessible to everyone.
                    </p>
                </div>
                <div className="relative grid md:grid-cols-3 gap-12 md:gap-8 mt-16">
                    <HowItWorksStep
                        number="1"
                        title="Define"
                        description="Create your brand profile by providing your URL, description, and keywords. AI helps fill in the gaps."
                        videoUrl="/videos/Brandprofile_web.mp4"
                        videoPoster="/videos/BrandProfile_web_thumb.png"
                    />
                    <HowItWorksStep
                        number="2"
                        title="Generate & Refine"
                        description="Use the Content Studio to instantly create images and text. Perfect your visuals with the AI Refinement tool using simple commands."
                        videoUrl="/videos/Image gen_web.mp4"
                        videoPoster="/videos/Image_gen_web_thumb.png"
                    />
                    <HowItWorksStep
                        number="3"
                        title="Deploy"
                        description="Review all your creations in the Deployment Hub and get them ready for launch."
                        videoUrl="/videos/Social post_web.mp4"
                        videoPoster="/videos/Social_post_web_thumb.png"
                    />
                </div>
            </div>
        </section>

        {/* Smart Learning Explanation Section */}
        <section className="py-12 sm:py-16 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="container-responsive">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center space-x-2 bg-primary/10 px-3 py-1.5 rounded-full text-sm font-medium text-primary mb-6">
                <Lightbulb className="w-4 h-4" />
                <span>Smart Learning AI (RAG)</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-balance">
                AI That <span className="text-gradient-brand">Learns Your Style</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground text-balance">
                Unlike generic AI tools, BrandForge AI uses Retrieval‑Augmented Generation (RAG) plus your feedback to amplify patterns that work for your brand—so results get more on‑brand and effective over time.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="p-3 bg-primary/10 rounded-xl w-fit mx-auto mb-4">
                  <Star className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Rate Your Content</h3>
                <p className="text-muted-foreground">Give feedback on generated content with star ratings and helpful buttons</p>
              </div>
              
              <div className="text-center">
                <div className="p-3 bg-accent/10 rounded-xl w-fit mx-auto mb-4">
                  <Zap className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">AI Learns Patterns</h3>
                <p className="text-muted-foreground">Our system identifies what works best for your brand and audience</p>
              </div>
              
              <div className="text-center">
                <div className="p-3 bg-primary/10 rounded-xl w-fit mx-auto mb-4">
                  <TrendingUp className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Better Results</h3>
                <p className="text-muted-foreground">Future content automatically incorporates your successful patterns</p>
              </div>
            </div>
            
            <div className="mt-10 text-center">
              <div className="inline-flex items-center space-x-4 bg-card border rounded-lg p-3">
                <div className="text-sm text-muted-foreground">
                  <strong className="text-primary">Beta users report:</strong> Noticeable content quality improvement after generating ~20 pieces
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Refinement Highlight Section */}
        <section className="py-12 sm:py-16 bg-background">
            <div className="container-responsive">
                <div className="text-center max-w-3xl mx-auto">
                    <div className="inline-flex items-center space-x-2 bg-accent/10 px-3 py-1.5 rounded-full text-sm font-medium text-accent mb-6">
                        <Wand2 className="w-4 h-4" />
                        <span>AI Refinement Studio</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-balance">
                        Never Settle for 'Good Enough'—<span className="text-gradient-brand">Refine to Perfection</span>
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground text-balance">
                        Your first AI generation is just the starting point. Our unique Refinement Studio lets you iteratively edit any image with simple text commands. Change backgrounds, add objects, or alter styles until it's exactly right.
                    </p>
                    
                    {/* Enhanced Features Grid */}
                    <div className="grid md:grid-cols-3 gap-6 mt-10">
                        <div className="text-center">
                            <div className="p-3 bg-accent/10 rounded-xl w-fit mx-auto mb-3">
                                <Wand2 className="h-6 w-6 text-accent" />
                            </div>
                            <h3 className="font-semibold mb-2">Simple Instructions</h3>
                            <p className="text-sm text-muted-foreground">"Make the sky more dramatic" or "Add morning mist"</p>
                        </div>

                        <div className="text-center">
                            <div className="p-3 bg-primary/10 rounded-xl w-fit mx-auto mb-3">
                                <RefreshCcw className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-2">Version History</h3>
                            <p className="text-sm text-muted-foreground">Revert to any previous version with one click</p>
                        </div>

                        <div className="text-center">
                            <div className="p-3 bg-accent/10 rounded-xl w-fit mx-auto mb-3">
                                <Zap className="h-6 w-6 text-accent" />
                            </div>
                            <h3 className="font-semibold mb-2">Quality Modes</h3>
                            <p className="text-sm text-muted-foreground">From fast previews to premium results</p>
                        </div>
                    </div>

                    {/* Refinement Demo Video */}
                    <div className="mt-10">
                        <div className="relative w-full max-w-3xl mx-auto">
                            <div className="rounded-xl border-2 border-primary/20 shadow-lg overflow-hidden">
                                <VideoPlayer
                                    videoUrl="/videos/ai refine_web.mp4"
                                    posterUrl="/videos/ai_refine_web_thumb.png"
                                />
                            </div>
                            <p className="text-center text-sm text-muted-foreground mt-3">
                                Watch: Transform "good" AI images into "perfect" with simple commands
                            </p>
                        </div>
                    </div>

                    <div className="mt-8">
                        <Button size="lg" className="btn-gradient-primary btn-lg-enhanced" asChild>
                            <Link href="/signup">
                                Try It Free
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>

        {/* Final CTA Section */}
        <section className="section-spacing bg-gradient-to-tr from-primary/90 to-accent/90 text-primary-foreground">
             <div className="container-responsive text-center">
                 <h2 className="text-3xl md:text-4xl font-bold text-balance">Ready to Start Building Your Brand?</h2>
                 <p className="max-w-2xl mx-auto mt-4 text-lg text-primary-foreground/80 text-balance">
                     Join our beta and start creating professional brand content with AI that gets smarter with you.
                 </p>
                 <div className="mt-8">
                     <Button
                        size="lg"
                        variant="secondary"
                        className="btn-lg-enhanced focus-enhanced bg-background/90 text-foreground hover:bg-background"
                        asChild
                     >
                        <Link href="/signup">Get Started Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
                     </Button>
                 </div>
             </div>
        </section>

        {/* ShowcasePreviewModal */}
        {modalShowcaseId && (
          <ShowcasePreviewModal
            showcaseId={modalShowcaseId}
            isOpen={!!modalShowcaseId}
            onClose={() => setModalShowcaseId(null)}
            onUseTemplate={() => router.push('/signup')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50">
        <div className="container-responsive py-8 text-center">
            <div className="flex justify-center gap-x-6 gap-y-2 flex-wrap mb-4">
                 <Button variant="link" asChild className="text-muted-foreground">
                    <Link href="/features">Features</Link>
                </Button>
                <Button variant="link" asChild className="text-muted-foreground">
                    <Link href="/blog">Blog</Link>
                </Button>
                 <Button variant="link" asChild className="text-muted-foreground">
                    <Link href="/plans">Pricing</Link>
                </Button>
                 <Button variant="link" asChild className="text-muted-foreground">
                    <Link href="/vs/chatgpt">vs. ChatGPT</Link>
                </Button>
                 <Button variant="link" asChild className="text-muted-foreground">
                    <Link href="/vs/canva">vs. Canva</Link>
                </Button>
                 <Button variant="link" asChild className="text-muted-foreground">
                    <Link href="/vs/jasper">vs. Jasper</Link>
                </Button>
                 <Button variant="link" asChild className="text-muted-foreground">
                    <Link href="/vs/copyai">vs. Copy.ai</Link>
                </Button>
                 <Button variant="link" asChild className="text-muted-foreground">
                    <Link href="/vs/writesonic">vs. Writesonic</Link>
                </Button>
                 <Button variant="link" asChild className="text-muted-foreground">
                    <Link href="/vs/simplified">vs. Simplified</Link>
                </Button>
                 <Button variant="link" asChild className="text-muted-foreground">
                    <Link href="/vs/adcreative">vs. AdCreative</Link>
                </Button>
                 <Button variant="link" asChild className="text-muted-foreground">
                    <Link href="/vs/rytr">vs. Rytr</Link>
                </Button>
                 <Button variant="link" asChild className="text-muted-foreground">
                    <Link href="/terms-of-service">Terms</Link>
                </Button>
                 <Button variant="link" asChild className="text-muted-foreground">
                    <Link href="/privacy-policy">Privacy</Link>
                </Button>
            </div>
          <p className="text-sm text-muted-foreground text-break">
            &copy; {new Date().getFullYear()} BrandForge AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
