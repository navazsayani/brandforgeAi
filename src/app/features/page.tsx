"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserCircle, Paintbrush, Send, Rocket, ArrowRight, CheckCircle, Wand2, Lightbulb, Zap, X, Sparkles, Camera, Layers, Target, TrendingUp, Users, Clock, Star, Building, RefreshCcw, Globe } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';


const FeatureDetailCard = ({ id, icon: Icon, title, description, benefits }: { id: string; icon: React.ElementType; title: string; description: string; benefits: { text: string; icon: React.ElementType, highlighted?: boolean }[] }) => (
    <Card id={id} className="card-enhanced w-full scroll-mt-24">
        <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-center sm:text-left">
                <div className="p-4 bg-primary/10 rounded-xl w-fit mx-auto sm:mx-0">
                    <Icon className="h-10 w-10 text-primary" />
                </div>
                <div>
                    <CardTitle className="text-2xl sm:text-3xl font-bold">{title}</CardTitle>
                    <CardDescription className="text-base sm:text-lg mt-1">{description}</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <ul className="space-y-3 mt-4">
                {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start p-3 rounded-lg transition-colors">
                        <benefit.icon className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${benefit.highlighted ? 'text-primary' : 'text-green-500'}`} />
                        <span className={`text-muted-foreground ${benefit.highlighted ? 'font-semibold text-primary' : ''}`}>{benefit.text}</span>
                    </li>
                ))}
            </ul>
        </CardContent>
    </Card>
);

// Brand Story Card Component
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
                    <Wand2 className="w-4 h-4 mr-2 animate-spin" />
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

export default function FeaturesPage() {
  const router = useRouter();
  const [activeStoryCard, setActiveStoryCard] = useState<number | null>(null);
  const [selectedAssessmentStage, setSelectedAssessmentStage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStage, setModalStage] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string>('US');

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

  return (
    <div className="bg-background text-foreground">
        <PublicHeader />

      <main className="pt-24">
         {/* Hero Section */}
        <section className="py-20 text-center animate-fade-in">
          <div className="container-responsive">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-5xl md:text-6xl font-extrabold text-balance">
                    One Platform. <span className="text-gradient-brand">Limitless Creativity.</span>
                </h1>
                <p className="max-w-2xl mx-auto mt-6 text-lg md:text-xl text-muted-foreground text-balance">
                    Discover how BrandForge AI combines multiple tools into a single, seamless workflow to accelerate your brand building and marketing efforts from start to finish.
                </p>
                <div className="mt-12">
                    <Button size="lg" className="btn-gradient-primary btn-lg-enhanced focus-enhanced" asChild>
                        <Link href="/signup">
                            Start Forging Your Brand
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </div>
          </div>
        </section>

        {/* Features Details */}
        <section className="section-spacing bg-secondary/30">
            <div className="container-responsive">
                <div className="grid grid-cols-1 gap-12">
                     <FeatureDetailCard 
                        id="brand-identity"
                        icon={UserCircle}
                        title="AI Brand Identity Suite"
                        description="Build a strong foundation for your brand in minutes."
                        benefits={[
                            { text: "Auto-fill brand descriptions and keywords by simply providing your website URL.", icon: CheckCircle },
                            { text: "Get AI-powered suggestions to enhance and refine your brand's core message.", icon: CheckCircle },
                            { text: "Generate a unique, professional logo that matches your brand's style and industry.", icon: CheckCircle },
                            { text: "Store all your core brand assets in one place to ensure consistency across all generated content.", icon: CheckCircle }
                        ]}
                     />
                     <FeatureDetailCard
                        id="content-studio"
                        icon={Paintbrush}
                        title="Unified Content Studio"
                        description="Your central hub for all AI-powered content creation."
                        benefits={[
                            { text: "Generate stunning, commercially-licensed images for marketing, social media, and blogs.", icon: CheckCircle },
                            { text: "Transform your own photos into professional marketing images with AI Photoshoot mode.", icon: Sparkles, highlighted: true },
                            { text: "Refine any generated or uploaded image with simple text instructions to get the perfect shot.", icon: Wand2, highlighted: true },
                            { text: "Create engaging, platform-aware social media posts for Instagram, X, and more.", icon: CheckCircle },
                            { text: "Produce long-form, SEO-optimized blog articles, from outline to finished draft.", icon: CheckCircle },
                            { text: "Use AI to populate entire content forms from a single sentence, kickstarting your creative process.", icon: CheckCircle }
                        ]}
                     />
                     <FeatureDetailCard
                        id="ai-refinement-studio"
                        icon={Wand2}
                        title="AI Refinement Studio"
                        description="Perfect your visuals with iterative AI-powered editing."
                        benefits={[
                            { text: "Transform any image with simple text instructions like 'change the background to a sunset'", icon: CheckCircle },
                            { text: "Iterative refinement lets you make multiple adjustments until it's exactly right", icon: Wand2, highlighted: true },
                            { text: "Version history keeps track of every change so you can revert to any previous version", icon: CheckCircle },
                            { text: "Quality modes from fast preview to premium results based on your needs", icon: CheckCircle },
                            { text: "AI prompt enhancement makes your instructions more effective automatically", icon: CheckCircle }
                        ]}
                     />
                     <FeatureDetailCard
                        id="ai-photoshoot"
                        icon={Camera}
                        title="AI Photoshoot Transformation"
                        description="Turn your raw photos into professional marketing assets while preserving your subjects."
                        benefits={[
                            { text: "Upload your own team photos, product shots, or behind-the-scenes images", icon: CheckCircle },
                            { text: "AI preserves your exact subjects (people, products, brand elements) while transforming everything else", icon: Sparkles, highlighted: true },
                            { text: "Professional studio lighting, branded backgrounds, and magazine-quality color grading", icon: Camera, highlighted: true },
                            { text: "Perfect for team introductions, product showcases, lifestyle scenes, and more", icon: CheckCircle },
                            { text: "Choose between 'Use as Inspiration' or 'Professional Photoshoot Transform' modes", icon: CheckCircle },
                            { text: "Works seamlessly with content templates that suggest optimal image modes", icon: CheckCircle }
                        ]}
                     />
                     <FeatureDetailCard
                        id="smart-learning"
                        icon={Lightbulb}
                        title="Smart Learning AI System"
                        description="AI that gets smarter with every piece of content you create."
                        benefits={[
                            { text: "AI learns from your feedback to understand your brand voice and style preferences", icon: CheckCircle },
                            { text: "Automatically improves future content based on your highest-rated posts and campaigns", icon: Zap, highlighted: true },
                            { text: "Transparent insights show exactly what the AI learned from your successful content", icon: CheckCircle },
                            { text: "Continuous improvement without any manual training or setup required", icon: CheckCircle },
                            { text: "Built-in cost monitoring and rate limiting ensure efficient learning", icon: CheckCircle }
                        ]}
                     />
                      <FeatureDetailCard
                         id="campaign-manager"
                         icon={Send}
                         title="Ad Campaign Manager"
                         description="Craft high-performing ad creatives with AI precision."
                         benefits={[
                             { text: "Turn existing content like blog snippets or social posts into compelling ad copy.", icon: CheckCircle },
                             { text: "Generate multiple headline and body text variations for effective A/B testing.", icon: CheckCircle },
                             { text: "Receive AI-driven guidance on how to best use your creatives on Google and Meta platforms.", icon: CheckCircle },
                             { text: "Align ad campaigns with specific goals, from brand awareness to sales conversion.", icon: CheckCircle }
                         ]}
                      />
                     <FeatureDetailCard 
                        id="deployment-hub"
                        icon={Rocket}
                        title="Deployment & Management Hub"
                        description="Organize, manage, and deploy your content pipeline."
                        benefits={[
                            { text: "View all your generated social posts, blog articles, and ad campaigns in one place.", icon: CheckCircle },
                            { text: "Manage the status of each piece of content: draft, scheduled, or deployed.", icon: CheckCircle },
                            { text: "Simulate deployment to popular platforms to visualize your content calendar.", icon: CheckCircle },
                            { text: "Edit and refine any generated content before it goes live.", icon: CheckCircle }
                        ]}
                     />
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
                <span>Join Our Beta - Building the Future of AI Branding</span>
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
              userCountry={userCountry}
            />

            {/* Social Proof & CTA */}
            <div className="text-center">
              <div className="flex justify-center items-center space-x-6 mb-8 flex-wrap gap-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Quick setup: ~2 minutes</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Zap className="w-4 h-4 text-accent" />
                  <span>Unlimited AI refinements</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Star className="w-4 h-4 text-primary" />
                  <span>Early beta access</span>
                </div>
              </div>

              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Ready to write your brand's next chapter?
              </p>

              <div className="flex justify-center">
                <Button size="lg" className="btn-gradient-primary btn-lg-enhanced" asChild>
                  <Link href="/signup" className="flex items-center">
                    Start Building Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Why Refinement Beats One-Shot AI Section */}
        <section className="py-20 bg-gradient-to-br from-accent/10 to-primary/10">
            <div className="container-responsive">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Why <span className="text-gradient-brand">Refinement</span> Beats One-Shot AI
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            The difference between "good enough" and "perfect" is iteration. Here's why our refinement approach wins.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Traditional AI */}
                        <Card className="border-destructive/30">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center text-destructive">
                                    <X className="w-6 h-6 mr-2" />
                                    Traditional AI (One-Shot)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                <div>
                                    <p className="font-semibold text-foreground mb-2">The Problem:</p>
                                    <ol className="list-decimal pl-5 space-y-2">
                                        <li>Generate image with prompt</li>
                                        <li>❌ Not quite right? Start completely over</li>
                                        <li>Write a new, better prompt from scratch</li>
                                        <li>Generate again, hope it's better</li>
                                        <li>Repeat 5-10 times until frustrated</li>
                                    </ol>
                                </div>
                                <div className="border-t border-border pt-4">
                                    <p className="font-semibold text-destructive">Result: Wasted time, credits, and patience</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* BrandForge AI */}
                        <Card className="border-primary">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center text-primary">
                                    <CheckCircle className="w-6 h-6 mr-2" />
                                    BrandForge AI (Refinement)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div>
                                    <p className="font-semibold text-foreground mb-2">The Solution:</p>
                                    <ol className="list-decimal pl-5 space-y-2 text-foreground">
                                        <li>Generate initial image</li>
                                        <li>✅ "Make the sky darker" → Refine</li>
                                        <li>✅ "Add mountains in background" → Refine</li>
                                        <li>✅ "Change lighting to golden hour" → Refine</li>
                                        <li>Perfect! Done in minutes.</li>
                                    </ol>
                                </div>
                                <div className="border-t border-border pt-4">
                                    <p className="font-semibold text-primary">Result: Perfect images, faster, with less frustration</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="mt-12 text-center">
                        <Card className="inline-block bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                            <CardContent className="p-6">
                                <p className="text-lg font-semibold mb-2">
                                    <Zap className="inline w-5 h-5 text-primary mr-2" />
                                    The BrandForge Advantage
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Early beta users typically refine 3-5 times per image to achieve their perfect result—<strong className="text-primary">without starting over</strong>.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="mt-8 text-center">
                        <Button size="lg" className="btn-gradient-primary btn-lg-enhanced" asChild>
                            <Link href="/signup">
                                Try Refinement Studio Free
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
      </main>

       {/* Footer */}
      <footer className="border-t bg-card/50">
        <div className="container-responsive py-8 text-center">
            <div className="flex justify-center gap-x-6 gap-y-2 flex-wrap mb-4">
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
