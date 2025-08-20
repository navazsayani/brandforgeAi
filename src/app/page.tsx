
"use client";

import React, { useEffect, useState } from 'react';
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
import { Loader2, UserCircle, Rocket, Paintbrush, Send, ArrowRight, Wand2, Layers, Target, CheckCircle, TrendingUp, Users, Clock, Star, X, Lightbulb, Zap, Building, RefreshCcw } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';


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
  selectedStage
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedStage: string | null;
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

  const stageConfigs = {
    new: {
      title: "Tell us about your new brand idea",
      icon: Rocket,
      color: "text-blue-500",
      fields: [
        { key: 'businessIdea', label: 'What\'s your business idea?', type: 'textarea', placeholder: 'e.g., Organic skincare products for sensitive skin...' },
        { key: 'industry', label: 'Industry', type: 'select', options: ['Fashion & Apparel', 'Beauty & Cosmetics', 'Food & Beverage', 'Health & Wellness', 'Technology', 'Other'] },
        { key: 'targetAudience', label: 'Who is your target audience?', type: 'input', placeholder: 'e.g., Working women aged 25-40...' },
        { key: 'challenge', label: 'Biggest branding challenge?', type: 'select', options: ['Creating a logo', 'Choosing colors', 'Writing brand messaging', 'All of the above'] }
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
        { icon: Send, title: 'Streamline Your Publishing Workflow', description: 'Manage, schedule, and track all your content from one central dashboard to save hours each week' }
      ]
    },
    established: {
      title: "Let's optimize your marketing ROI",
      icon: Target,
      color: "text-purple-500",
      fields: [
        { key: 'businessSize', label: 'Business size', type: 'select', options: ['Solo entrepreneur', 'Small team (2-10)', 'Medium business (10-50)', 'Large business (50+)'] },
        { key: 'marketingChannels', label: 'Current marketing channels', type: 'select', options: ['Social media only', 'Email + Social', 'Paid ads + Social', 'Multi-channel'] },
        { key: 'adSpend', label: 'Monthly ad spend', type: 'select', options: ['₹0-10,000', '₹10,000-50,000', '₹50,000-2,00,000', '₹2,00,000+'] },
        { key: 'goal', label: 'Primary conversion goal', type: 'select', options: ['Brand awareness', 'Lead generation', 'Direct sales', 'App downloads'] }
      ],
      recommendations: [
        { icon: Target, title: 'Optimize Your Ad Performance', description: 'Transform your best content into high-converting campaigns with automated A/B testing across Google and Meta platforms' },
        { icon: TrendingUp, title: 'Maximize Content ROI', description: 'Turn your existing materials into conversion-focused blog posts and social content that drives measurable results' },
        { icon: Building, title: 'Advanced Campaign Management', description: 'Deploy and track sophisticated marketing campaigns with detailed performance analytics and optimization insights' }
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-xl">
            <div className={`p-2 rounded-lg bg-primary/10`}>
              <currentConfig.icon className={`h-6 w-6 ${currentConfig.color}`} />
            </div>
            <span>{currentConfig.title}</span>
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

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={generateRecommendations}
                disabled={isGenerating || Object.keys(formData).length < 2}
                className="btn-gradient-primary"
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
                <div key={index} className="flex items-start space-x-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <rec.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
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

            <div className="flex justify-center space-x-3 pt-4">
              <Button variant="outline" onClick={onClose}>
                Maybe Later
              </Button>
              <Button onClick={handleGetStarted} className="btn-gradient-primary btn-lg-enhanced">
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
    { id: 'new', label: 'Just getting started', description: 'I have an idea but need to build my brand identity' },
    { id: 'growing', label: 'Scaling my presence', description: 'I have a brand but struggle with consistent content' },
    { id: 'established', label: 'Optimizing for growth', description: 'I need better ROI from my marketing efforts' }
  ];
  
  return (
    <div className="bg-gradient-to-br from-secondary/20 to-accent/10 rounded-2xl p-8 border border-border/30">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2">Which stage are you in?</h3>
        <p className="text-muted-foreground">Get personalized recommendations for your brand journey</p>
      </div>
      
      <div className="space-y-3">
        {stages.map((stage) => (
          <button
            key={stage.id}
            onClick={() => {
              setSelectedStage(stage.id);
              onStageSelect(stage.id);
            }}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
              selectedStage === stage.id
                ? 'border-primary bg-primary/10 shadow-md'
                : 'border-border/30 hover:border-primary/40 hover:bg-primary/5'
            }`}
          >
            <div className="font-medium mb-1">{stage.label}</div>
            <div className="text-sm text-muted-foreground">{stage.description}</div>
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

const HowItWorksStep = ({ number, title, description }: { number: string, title: string, description: string }) => (
    <div className="relative flex flex-col items-center text-center group">
         <div className="absolute top-6 left-1/2 w-full border-t-2 border-dashed border-border/70 -translate-x-full group-first:hidden hidden md:block"></div>
        <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground text-2xl font-bold border-4 border-background shadow-lg">
            {number}
        </div>
        <h3 className="mt-6 text-xl font-bold">{title}</h3>
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

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const brandStories = [
    {
      stage: "Stage 1",
      title: "The Spark: From Idea to Identity",
      icon: Rocket,
      characterStory: "Priya had this amazing idea for organic skincare but felt completely lost when it came to branding. She'd tried designing logos herself and even hired a few freelancers, but nothing felt right. After using **BrandForge AI's brand identity generator**, she got her first logo, but it needed tweaks. Instead of starting over, she used the **AI Refinement Studio** to perfect it with simple instructions like 'make the leaves more delicate' and 'soften the green tone.' Three refinements later, she had the perfect logo that her customers immediately connected with.",
      beforeAfter: {
        before: "Struggling with inconsistent visuals, spending ₹15,000+ on different designers, feeling frustrated with the branding process",
        after: "Perfect **brand identity** achieved through **AI generation and refinement**, saving both time and money"
      },
      metrics: "First month sales increased by 67% with new brand identity"
    },
    {
      stage: "Stage 2",
      title: "The Scale: From Presence to Power",
      icon: Layers,
      characterStory: "Arjun's handcrafted furniture business was doing well, but he was burning out trying to keep up with social media. Between running the workshop and managing orders, creating content felt impossible. Now he spends just 30 minutes every Sunday using **BrandForge AI's Content Studio** to generate a week's worth of posts. What surprised him most? The AI started noticing his most engaging posts featured close-up wood grain details and warm lighting. Now every generated image automatically includes these elements, and his followers actually engage more because the **AI-learned content** feels authentically 'Arjun'.",
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
      characterStory: "Kavya's digital marketing agency had great case studies and blog content, but their ad campaigns weren't converting well. They were spending hours manually creating ad variations and still seeing mediocre results. After implementing **BrandForge AI's Campaign Manager**, they started turning their best content into targeted ads that actually worked. The **campaign optimization tools** transformed their approach, and their client retention improved significantly.",
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
        <section className="pt-32 pb-20 text-center animate-fade-in">
          <div className="container-responsive">
            <div className="max-w-4xl mx-auto">
                <p className="text-5xl md:text-6xl font-extrabold text-gradient-brand mb-4 text-balance">
                    BrandForge AI
                </p>
                 <p className="text-lg md:text-xl text-primary font-semibold mb-6">
                    Your Complete AI Branding & Marketing Suite
                 </p>
                <h1 className="text-4xl md:text-5xl font-bold text-balance">
                    Forge a Stronger Brand, Faster Than Ever
                </h1>
                <p className="max-w-2xl mx-auto mt-6 text-lg md:text-xl text-muted-foreground text-balance">
                    Stop juggling tools. From logo ideas to deployed ad campaigns, BrandForge AI is your all-in-one platform to build, create, and grow your brand with the power of AI.
                </p>
                
                <HeroCarousel />

                {/* Smart Learning Callout */}
                <div className="mt-8 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-primary/10">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className="p-1.5 bg-primary/15 rounded-lg">
                      <Lightbulb className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-primary">Smart Learning AI</span>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Our AI learns from your feedback to create better content over time.{' '}
                    <Link href="/features#smart-learning" className="text-primary hover:underline">
                      See how it works →
                    </Link>
                  </p>
                </div>

                <div className="mt-8 flex justify-center gap-4">
                    <Button size="lg" className="btn-gradient-primary btn-lg-enhanced focus-enhanced" asChild>
                        <Link href={user ? "/dashboard" : "/signup"}>
                            {user ? "Go to Dashboard" : "Get Started for Free"}
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </div>
          </div>
        </section>

        {/* Enhanced Brand Journey Section */}
        <section className="section-spacing bg-gradient-to-br from-secondary/20 via-background to-accent/10 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 left-10 w-32 h-32 bg-primary rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-accent rounded-full blur-3xl"></div>
          </div>
          
          <div className="container-responsive relative z-10">
            {/* Enhanced Header */}
            <div className="text-center max-w-4xl mx-auto mb-16">
              <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full text-sm font-medium text-primary mb-6">
                <Users className="w-4 h-4" />
                <span>Join 500+ entrepreneurs building stronger brands</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-balance mb-6">
                Every Brand Has a Story. <span className="text-gradient-brand">What's Yours?</span>
              </h2>
              
              <p className="text-lg md:text-xl text-muted-foreground text-balance leading-relaxed">
                Whether you're just starting your journey, scaling your success, or optimizing for growth,
                BrandForge AI meets you exactly where you are—and takes you where you want to go.
              </p>
            </div>

            {/* Interactive Brand Stories */}
            <div className="relative mb-16">
              {/* Journey Progress Line */}
              <div className="absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 hidden lg:block z-0"></div>
              
              {/* Story Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 relative z-10">
                {/* Connection Lines - positioned at grid level to avoid scaling with cards */}
                <div className="absolute top-20 left-[calc(33.333%-2rem)] w-16 lg:w-20 xl:w-24 h-1 bg-primary/50 hidden lg:block z-0" />
                <div className="absolute top-20 left-[calc(66.666%-2rem)] w-16 lg:w-20 xl:w-24 h-1 bg-primary/50 hidden lg:block z-0" />
                
                {brandStories.map((story, index) => (
                  <BrandStoryCard
                    key={index}
                    {...story}
                    index={index}
                    isActive={activeStoryCard === index}
                    onHover={setActiveStoryCard}
                  />
                ))}
              </div>
            </div>

            {/* Stage Assessment */}
            <div className="max-w-2xl mx-auto mb-16">
              <StageAssessment onStageSelect={handleStageAssessment} selectedStage={selectedAssessmentStage} />
            </div>

            {/* Smart Recommendation Modal */}
            <SmartRecommendationModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              selectedStage={modalStage}
            />

            {/* Social Proof & CTA */}
            <div className="text-center">
              <div className="flex justify-center items-center space-x-6 mb-8 flex-wrap gap-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Average setup: 20 minutes</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <span>Average engagement boost: 85%</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Star className="w-4 h-4 text-primary" />
                  <span>4.9/5 user rating</span>
                </div>
              </div>
              
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Ready to write your brand's next chapter?
              </p>
              
              <div className="flex justify-center">
                <Button size="lg" variant="outline" className="btn-lg-enhanced">
                  <Link href="/features" className="flex items-center">
                    Explore Features
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-12 sm:py-16">
            <div className="container-responsive">
                <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-balance">Get Results in 3 Simple Steps</h2>
                    <p className="mt-4 text-lg text-muted-foreground text-balance">
                        Our intuitive workflow makes powerful AI accessible to everyone.
                    </p>
                </div>
                <div className="relative grid md:grid-cols-3 gap-12 md:gap-8 mt-16">
                    <HowItWorksStep number="1" title="Define" description="Create your brand profile by providing your URL, description, and keywords. AI helps fill in the gaps." />
                    <HowItWorksStep number="2" title="Generate & Refine" description="Use the Content Studio to instantly create images and text. Perfect your visuals with the AI Refinement tool using simple commands." />
                    <HowItWorksStep number="3" title="Deploy" description="Review all your creations in the Deployment Hub and get them ready for launch." />
                </div>
            </div>
        </section>

        {/* Smart Learning Explanation Section */}
        <section className="py-12 sm:py-16 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="container-responsive">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center space-x-2 bg-primary/10 px-3 py-1.5 rounded-full text-sm font-medium text-primary mb-6">
                <Lightbulb className="w-4 h-4" />
                <span>Smart Learning AI</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-balance">
                AI That <span className="text-gradient-brand">Learns Your Style</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground text-balance">
                Unlike generic AI tools, BrandForge AI learns from your feedback to create increasingly personalized content that matches your proven successful patterns.
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
                  <strong className="text-primary">Expected improvement:</strong> +0.8 stars average rating after 20 pieces of content
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
                    
                    <div className="mt-8">
                        <Button size="lg" variant="outline" asChild>
                            <Link href="/features#ai-refinement-studio">Explore AI Refinement Studio</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>

        {/* Final CTA Section */}
        <section className="section-spacing bg-gradient-to-tr from-primary/90 to-accent/90 text-primary-foreground">
             <div className="container-responsive text-center">
                 <h2 className="text-3xl md:text-4xl font-bold text-balance">Ready to Forge Your Brand's Future?</h2>
                 <p className="max-w-2xl mx-auto mt-4 text-lg text-primary-foreground/80 text-balance">
                     Join hundreds of creators and businesses building stronger brands with less effort.
                 </p>
                 <div className="mt-8">
                     <Button 
                        size="lg" 
                        variant="secondary"
                        className="btn-lg-enhanced focus-enhanced bg-background/90 text-foreground hover:bg-background"
                        asChild
                     >
                        <Link href="/signup">Start Your Free Trial Today <ArrowRight className="ml-2 h-5 w-5" /></Link>
                     </Button>
                 </div>
             </div>
        </section>
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
                    <Link href="/terms-of-service">Terms of Service</Link>
                </Button>
                 <Button variant="link" asChild className="text-muted-foreground">
                    <Link href="/privacy-policy">Privacy Policy</Link>
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
