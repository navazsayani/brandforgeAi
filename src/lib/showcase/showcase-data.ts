/**
 * Showcase Content Data Exports
 *
 * Centralized data source for showcase content used across the application
 */

import type { ShowcaseBrand, ShowcaseTestimonial } from './types';

// Showcase examples - pre-generated high-quality brand examples
// These are real AI-generated examples showcasing BrandForge AI capabilities

export const showcaseExamples: ShowcaseBrand[] = [
  {
    id: 'daily-grind-coffee',
    brandName: 'The Daily Grind',
    industry: 'Coffee Shop',
    description: 'Specialty coffee shop creating a productive haven for remote workers and coffee enthusiasts',
    logo: '/showcase/examples/daily-grind-coffee/logo.png',
    logoType: 'logomark',
    logoStyle: 'modern',
    logoShape: 'circle',
    posts: [
      {
        image: '/showcase/examples/daily-grind-coffee/posts/post-1-image.png',
        caption: 'Looking for the ideal space to fuel your productivity and satisfy your coffee cravings.',
        hashtags: '#SpecialtyCoffee #CoffeeShop #RemoteWorkLife #WorkFromCafe #CafeVibes #ArtisanCoffee',
        generationTime: '32 seconds',
        platformScreenshots: {
          instagram: '/showcase/examples/daily-grind-coffee/posts/post-1-instagram.png',
          facebook: '/showcase/examples/daily-grind-coffee/posts/post-1-facebook.png',
          linkedin: '/showcase/examples/daily-grind-coffee/posts/post-1-linkedin.png',
          twitter: '/showcase/examples/daily-grind-coffee/posts/post-1-twitter.png',
        },
        previewProps: {
          caption: 'Looking for the ideal space to fuel your productivity and satisfy your coffee cravings.',
          hashtags: '#SpecialtyCoffee #CoffeeShop #RemoteWorkLife #WorkFromCafe #CafeVibes #ArtisanCoffee',
          imageSrc: '/showcase/examples/daily-grind-coffee/posts/post-1-image.png',
          brandName: 'The Daily Grind',
          brandLogoUrl: '/showcase/examples/daily-grind-coffee/logo.png',
          selectedPlatform: 'all',
        },
      },
      {
        image: '/showcase/examples/daily-grind-coffee/posts/post-2-image.png',
        caption: 'Step into your new favorite workspace.',
        hashtags: '#SpecialtyCoffee #RemoteWorkLife #CoffeeCommunity #WorkFromCafe #CafeVibes #ArtisanCoffee',
        generationTime: '29 seconds',
        platformScreenshots: {
          instagram: '/showcase/examples/daily-grind-coffee/posts/post-2-instagram.png',
          facebook: '/showcase/examples/daily-grind-coffee/posts/post-2-facebook.png',
          linkedin: '/showcase/examples/daily-grind-coffee/posts/post-2-linkedin.png',
          twitter: '/showcase/examples/daily-grind-coffee/posts/post-2-twitter.png',
        },
        previewProps: {
          caption: 'Step into your new favorite workspace.',
          hashtags: '#SpecialtyCoffee #RemoteWorkLife #CoffeeCommunity #WorkFromCafe #CafeVibes #ArtisanCoffee',
          imageSrc: '/showcase/examples/daily-grind-coffee/posts/post-2-image.png',
          brandName: 'The Daily Grind',
          brandLogoUrl: '/showcase/examples/daily-grind-coffee/logo.png',
          selectedPlatform: 'all',
        },
      },
      {
        image: '/showcase/examples/daily-grind-coffee/posts/post-3-image.png',
        caption: 'Imagine a place where your focus flows as freely as our artisan coffee.',
        hashtags: '#SpecialtyCoffee #CoffeeShopLife #RemoteWorkLife #WorkFromCoffeeShop #CoffeeCommunity #ArtisanCoffee',
        generationTime: '30 seconds',
        platformScreenshots: {
          instagram: '/showcase/examples/daily-grind-coffee/posts/post-3-instagram.png',
          facebook: '/showcase/examples/daily-grind-coffee/posts/post-3-facebook.png',
          linkedin: '/showcase/examples/daily-grind-coffee/posts/post-3-linkedin.png',
          twitter: '/showcase/examples/daily-grind-coffee/posts/post-3-twitter.png',
        },
        previewProps: {
          caption: 'Imagine a place where your focus flows as freely as our artisan coffee.',
          hashtags: '#SpecialtyCoffee #CoffeeShopLife #RemoteWorkLife #WorkFromCoffeeShop #CoffeeCommunity #ArtisanCoffee',
          imageSrc: '/showcase/examples/daily-grind-coffee/posts/post-3-image.png',
          brandName: 'The Daily Grind',
          brandLogoUrl: '/showcase/examples/daily-grind-coffee/logo.png',
          selectedPlatform: 'all',
        },
      },
    ],
    testimonial: {
      quote: 'Created my first Instagram post in 40 seconds. The AI absolutely nailed my brand voice and the image quality is incredible!',
      author: 'Sarah Martinez',
      role: 'Coffee Shop Owner',
      location: 'Seattle, WA',
      avatar: '/showcase/testimonials/avatars/daily-grind-coffee.jpg',
    },
  },
  {
    id: 'zen-flow-yoga',
    brandName: 'Zen Flow Yoga',
    industry: 'Yoga Studio',
    description: 'Modern yoga studio offering mindful movement and meditation for busy professionals',
    logo: '/showcase/examples/zen-flow-yoga/logo.png',
    logoType: 'logomark',
    logoStyle: 'minimalist',
    logoShape: 'circle',
    posts: [
      {
        image: '/showcase/examples/zen-flow-yoga/posts/post-1-image.png',
        caption: 'Feeling the daily grind.',
        hashtags: '#YogaLife #MindfulMovement #StressRelief #WellnessJourney #WorkLifeBalance #MeditationPractice #YogaStudio',
        generationTime: '32 seconds',
        platformScreenshots: {
          instagram: '/showcase/examples/zen-flow-yoga/posts/post-1-instagram.png',
          facebook: '/showcase/examples/zen-flow-yoga/posts/post-1-facebook.png',
          linkedin: '/showcase/examples/zen-flow-yoga/posts/post-1-linkedin.png',
          twitter: '/showcase/examples/zen-flow-yoga/posts/post-1-twitter.png',
        },
        previewProps: {
          caption: 'Feeling the daily grind.',
          hashtags: '#YogaLife #MindfulMovement #StressRelief #WellnessJourney #WorkLifeBalance #MeditationPractice #YogaStudio',
          imageSrc: '/showcase/examples/zen-flow-yoga/posts/post-1-image.png',
          brandName: 'Zen Flow Yoga',
          brandLogoUrl: '/showcase/examples/zen-flow-yoga/logo.png',
          selectedPlatform: 'all',
        },
      },
      {
        image: '/showcase/examples/zen-flow-yoga/posts/post-2-image.png',
        caption: 'In the hustle of professional life, finding a moment of peace can feel like a luxury.',
        hashtags: '#YogaForProfessionals #MindfulMovement #StressRelief #WellnessJourney #YogaStudio #HolisticHealth #SelfCare',
        generationTime: '31 seconds',
        platformScreenshots: {
          instagram: '/showcase/examples/zen-flow-yoga/posts/post-2-instagram.png',
          facebook: '/showcase/examples/zen-flow-yoga/posts/post-2-facebook.png',
          linkedin: '/showcase/examples/zen-flow-yoga/posts/post-2-linkedin.png',
          twitter: '/showcase/examples/zen-flow-yoga/posts/post-2-twitter.png',
        },
        previewProps: {
          caption: 'In the hustle of professional life, finding a moment of peace can feel like a luxury.',
          hashtags: '#YogaForProfessionals #MindfulMovement #StressRelief #WellnessJourney #YogaStudio #HolisticHealth #SelfCare',
          imageSrc: '/showcase/examples/zen-flow-yoga/posts/post-2-image.png',
          brandName: 'Zen Flow Yoga',
          brandLogoUrl: '/showcase/examples/zen-flow-yoga/logo.png',
          selectedPlatform: 'all',
        },
      },
      {
        image: '/showcase/examples/zen-flow-yoga/posts/post-3-image.png',
        caption: 'In the hustle of daily life, finding a moment of calm can feel like a luxury.',
        hashtags: '#YogaForProfessionals #MindfulLiving #StressRelief #WellnessJourney #WorkLifeBalance #MeditationPractice #HolisticHealth',
        generationTime: '28 seconds',
        platformScreenshots: {
          instagram: '/showcase/examples/zen-flow-yoga/posts/post-3-instagram.png',
          facebook: '/showcase/examples/zen-flow-yoga/posts/post-3-facebook.png',
          linkedin: '/showcase/examples/zen-flow-yoga/posts/post-3-linkedin.png',
          twitter: '/showcase/examples/zen-flow-yoga/posts/post-3-twitter.png',
        },
        previewProps: {
          caption: 'In the hustle of daily life, finding a moment of calm can feel like a luxury.',
          hashtags: '#YogaForProfessionals #MindfulLiving #StressRelief #WellnessJourney #WorkLifeBalance #MeditationPractice #HolisticHealth',
          imageSrc: '/showcase/examples/zen-flow-yoga/posts/post-3-image.png',
          brandName: 'Zen Flow Yoga',
          brandLogoUrl: '/showcase/examples/zen-flow-yoga/logo.png',
          selectedPlatform: 'all',
        },
      },
    ],
    testimonial: {
      quote: 'The posts perfectly capture the peaceful, welcoming vibe of our studio. Our Instagram engagement has doubled since using BrandForge!',
      author: 'Maya Chen',
      role: 'Yoga Instructor & Studio Owner',
      location: 'Portland, OR',
      avatar: '/showcase/testimonials/avatars/zen-flow-yoga.jpg',
    },
  },
  {
    id: 'bloom-beauty',
    brandName: 'Bloom Beauty Bar',
    industry: 'Beauty Salon',
    description: 'Luxury beauty salon specializing in transformative hair styling and nail artistry',
    logo: '/showcase/examples/bloom-beauty/logo.png',
    logoType: 'logomark',
    logoStyle: 'elegant',
    logoShape: 'custom',
    posts: [
      {
        image: '/showcase/examples/bloom-beauty/posts/post-1-image.png',
        caption: 'Step into a world where beauty meets unparalleled luxury and every visit is a journey of transformation.',
        hashtags: '#LuxurySalon #BeautyPampering #HairTransformation #NailArtistry #PersonalizedBeauty #SalonExperience',
        generationTime: '32 seconds',
        platformScreenshots: {
          instagram: '/showcase/examples/bloom-beauty/posts/post-1-instagram.png',
          facebook: '/showcase/examples/bloom-beauty/posts/post-1-facebook.png',
          linkedin: '/showcase/examples/bloom-beauty/posts/post-1-linkedin.png',
          twitter: '/showcase/examples/bloom-beauty/posts/post-1-twitter.png',
        },
        previewProps: {
          caption: 'Step into a world where beauty meets unparalleled luxury and every visit is a journey of transformation.',
          hashtags: '#LuxurySalon #BeautyPampering #HairTransformation #NailArtistry #PersonalizedBeauty #SalonExperience',
          imageSrc: '/showcase/examples/bloom-beauty/posts/post-1-image.png',
          brandName: 'Bloom Beauty Bar',
          brandLogoUrl: '/showcase/examples/bloom-beauty/logo.png',
          selectedPlatform: 'all',
        },
      },
      {
        image: '/showcase/examples/bloom-beauty/posts/post-2-image.png',
        caption: 'Step into a realm where beauty meets bespoke artistry and every detail is designed for your ultimate indulgence.',
        hashtags: '#LuxuryBeauty #BeautySalon #HairStyling #NailArtistry #PersonalizedBeauty #PamperYourself',
        generationTime: '33 seconds',
        platformScreenshots: {
          instagram: '/showcase/examples/bloom-beauty/posts/post-2-instagram.png',
          facebook: '/showcase/examples/bloom-beauty/posts/post-2-facebook.png',
          linkedin: '/showcase/examples/bloom-beauty/posts/post-2-linkedin.png',
          twitter: '/showcase/examples/bloom-beauty/posts/post-2-twitter.png',
        },
        previewProps: {
          caption: 'Step into a realm where beauty meets bespoke artistry and every detail is designed for your ultimate indulgence.',
          hashtags: '#LuxuryBeauty #BeautySalon #HairStyling #NailArtistry #PersonalizedBeauty #PamperYourself',
          imageSrc: '/showcase/examples/bloom-beauty/posts/post-2-image.png',
          brandName: 'Bloom Beauty Bar',
          brandLogoUrl: '/showcase/examples/bloom-beauty/logo.png',
          selectedPlatform: 'all',
        },
      },
      {
        image: '/showcase/examples/bloom-beauty/posts/post-3-image.png',
        caption: 'Imagine stepping into a world where every detail is crafted for your ultimate beauty and relaxation.',
        hashtags: '#LuxuryBeauty #HairStyling #NailArtistry #BeautyTreatments #PamperYourself #SalonLife',
        generationTime: '29 seconds',
        platformScreenshots: {
          instagram: '/showcase/examples/bloom-beauty/posts/post-3-instagram.png',
          facebook: '/showcase/examples/bloom-beauty/posts/post-3-facebook.png',
          linkedin: '/showcase/examples/bloom-beauty/posts/post-3-linkedin.png',
          twitter: '/showcase/examples/bloom-beauty/posts/post-3-twitter.png',
        },
        previewProps: {
          caption: 'Imagine stepping into a world where every detail is crafted for your ultimate beauty and relaxation.',
          hashtags: '#LuxuryBeauty #HairStyling #NailArtistry #BeautyTreatments #PamperYourself #SalonLife',
          imageSrc: '/showcase/examples/bloom-beauty/posts/post-3-image.png',
          brandName: 'Bloom Beauty Bar',
          brandLogoUrl: '/showcase/examples/bloom-beauty/logo.png',
          selectedPlatform: 'all',
        },
      },
    ],
    testimonial: {
      quote: 'The images are so glamorous and professional! Clients keep asking where I get my social media content. Worth every penny!',
      author: 'Isabella Rodriguez',
      role: 'Beauty Salon Owner',
      location: 'Miami, FL',
      avatar: '/showcase/testimonials/avatars/bloom-beauty.jpg',
    },
  },
  {
    id: 'chic-boutique',
    brandName: 'Chic Boutique',
    industry: 'Fashion Boutique',
    description: 'Curated fashion boutique offering contemporary styles for modern women',
    logo: '/showcase/examples/chic-boutique/logo.png',
    logoType: 'logotype',
    logoStyle: 'modern',
    logoShape: 'custom',
    posts: [
      {
        image: '/showcase/examples/chic-boutique/posts/post-1-image.png',
        caption: 'Imagine a wardrobe that truly reflects you – unique, high-quality, and effortlessly chic.',
        hashtags: '#FashionBoutique #ContemporaryFashion #TimelessStyle #WomensFashion #CuratedStyle #PersonalizedShopping',
        generationTime: '28 seconds',
        platformScreenshots: {
          instagram: '/showcase/examples/chic-boutique/posts/post-1-instagram.png',
          facebook: '/showcase/examples/chic-boutique/posts/post-1-facebook.png',
          linkedin: '/showcase/examples/chic-boutique/posts/post-1-linkedin.png',
          twitter: '/showcase/examples/chic-boutique/posts/post-1-twitter.png',
        },
        previewProps: {
          caption: 'Imagine a wardrobe that truly reflects you – unique, high-quality, and effortlessly chic.',
          hashtags: '#FashionBoutique #ContemporaryFashion #TimelessStyle #WomensFashion #CuratedStyle #PersonalizedShopping',
          imageSrc: '/showcase/examples/chic-boutique/posts/post-1-image.png',
          brandName: 'Chic Boutique',
          brandLogoUrl: '/showcase/examples/chic-boutique/logo.png',
          selectedPlatform: 'all',
        },
      },
      {
        image: '/showcase/examples/chic-boutique/posts/post-2-image.png',
        caption: 'At our boutique, we believe true style is about more than just clothes – it\'s about the feeling they evoke, the story they tell, and the confidence they bring.',
        hashtags: '#CuratedFashion #BoutiqueStyle #ModernWoman #TimelessFashion #QualityApparel #PersonalStyle',
        generationTime: '30 seconds',
        platformScreenshots: {
          instagram: '/showcase/examples/chic-boutique/posts/post-2-instagram.png',
          facebook: '/showcase/examples/chic-boutique/posts/post-2-facebook.png',
          linkedin: '/showcase/examples/chic-boutique/posts/post-2-linkedin.png',
          twitter: '/showcase/examples/chic-boutique/posts/post-2-twitter.png',
        },
        previewProps: {
          caption: 'At our boutique, we believe true style is about more than just clothes – it\'s about the feeling they evoke, the story they tell, and the confidence they bring.',
          hashtags: '#CuratedFashion #BoutiqueStyle #ModernWoman #TimelessFashion #QualityApparel #PersonalStyle',
          imageSrc: '/showcase/examples/chic-boutique/posts/post-2-image.png',
          brandName: 'Chic Boutique',
          brandLogoUrl: '/showcase/examples/chic-boutique/logo.png',
          selectedPlatform: 'all',
        },
      },
      {
        image: '/showcase/examples/chic-boutique/posts/post-3-image.png',
        caption: 'At our curated fashion boutique, we believe in the power of a unique wardrobe.',
        hashtags: '#boutiquefashion #curatedstyle #womensfashion #contemporarystyle #timelesspieces #personalstyle',
        generationTime: '31 seconds',
        platformScreenshots: {
          instagram: '/showcase/examples/chic-boutique/posts/post-3-instagram.png',
          facebook: '/showcase/examples/chic-boutique/posts/post-3-facebook.png',
          linkedin: '/showcase/examples/chic-boutique/posts/post-3-linkedin.png',
          twitter: '/showcase/examples/chic-boutique/posts/post-3-twitter.png',
        },
        previewProps: {
          caption: 'At our curated fashion boutique, we believe in the power of a unique wardrobe.',
          hashtags: '#boutiquefashion #curatedstyle #womensfashion #contemporarystyle #timelesspieces #personalstyle',
          imageSrc: '/showcase/examples/chic-boutique/posts/post-3-image.png',
          brandName: 'Chic Boutique',
          brandLogoUrl: '/showcase/examples/chic-boutique/logo.png',
          selectedPlatform: 'all',
        },
      },
    ],
    testimonial: {
      quote: 'The fashion content looks like it came from a professional agency! My boutique\'s Instagram now rivals major brands. Absolutely love it!',
      author: 'Olivia Bennett',
      role: 'Fashion Boutique Owner',
      location: 'New York, NY',
      avatar: '/showcase/testimonials/avatars/chic-boutique.jpg',
    },
  },
  {
    id: 'glow-skincare',
    brandName: 'Glow Skincare',
    industry: 'Skincare Brand',
    description: 'Natural skincare brand creating clean, effective products for radiant skin',
    logo: '/showcase/examples/glow-skincare/logo.png',
    logoType: 'logomark',
    logoStyle: 'minimalist',
    logoShape: 'circle',
    posts: [
      {
        image: '/showcase/examples/glow-skincare/posts/post-1-image.png',
        caption: 'Discover the secret to truly radiant and healthy skin with our natural skincare line.',
        hashtags: '#NaturalSkincare #CleanBeauty #RadiantSkin #HealthySkin #SustainableBeauty',
        generationTime: '32 seconds',
        platformScreenshots: {
          instagram: '/showcase/examples/glow-skincare/posts/post-1-instagram.png',
          facebook: '/showcase/examples/glow-skincare/posts/post-1-facebook.png',
          linkedin: '/showcase/examples/glow-skincare/posts/post-1-linkedin.png',
          twitter: '/showcase/examples/glow-skincare/posts/post-1-twitter.png',
        },
        previewProps: {
          caption: 'Discover the secret to truly radiant and healthy skin with our natural skincare line.',
          hashtags: '#NaturalSkincare #CleanBeauty #RadiantSkin #HealthySkin #SustainableBeauty',
          imageSrc: '/showcase/examples/glow-skincare/posts/post-1-image.png',
          brandName: 'Glow Skincare',
          brandLogoUrl: '/showcase/examples/glow-skincare/logo.png',
          selectedPlatform: 'all',
        },
      },
      {
        image: '/showcase/examples/glow-skincare/posts/post-2-image.png',
        caption: 'Imagine skincare that feels as good as it looks on your skin.',
        hashtags: '#NaturalSkincare #CleanBeauty #HealthySkin #RadiantSkin #SustainableBeauty',
        generationTime: '32 seconds',
        platformScreenshots: {
          instagram: '/showcase/examples/glow-skincare/posts/post-2-instagram.png',
          facebook: '/showcase/examples/glow-skincare/posts/post-2-facebook.png',
          linkedin: '/showcase/examples/glow-skincare/posts/post-2-linkedin.png',
          twitter: '/showcase/examples/glow-skincare/posts/post-2-twitter.png',
        },
        previewProps: {
          caption: 'Imagine skincare that feels as good as it looks on your skin.',
          hashtags: '#NaturalSkincare #CleanBeauty #HealthySkin #RadiantSkin #SustainableBeauty',
          imageSrc: '/showcase/examples/glow-skincare/posts/post-2-image.png',
          brandName: 'Glow Skincare',
          brandLogoUrl: '/showcase/examples/glow-skincare/logo.png',
          selectedPlatform: 'all',
        },
      },
      {
        image: '/showcase/examples/glow-skincare/posts/post-3-image.png',
        caption: 'Unlock the secret to radiant, healthy skin with our natural skincare.',
        hashtags: '#NaturalSkincare #CleanBeauty #SustainableBeauty #DermatologistApproved #RadiantSkin',
        generationTime: '32 seconds',
        platformScreenshots: {
          instagram: '/showcase/examples/glow-skincare/posts/post-3-instagram.png',
          facebook: '/showcase/examples/glow-skincare/posts/post-3-facebook.png',
          linkedin: '/showcase/examples/glow-skincare/posts/post-3-linkedin.png',
          twitter: '/showcase/examples/glow-skincare/posts/post-3-twitter.png',
        },
        previewProps: {
          caption: 'Unlock the secret to radiant, healthy skin with our natural skincare.',
          hashtags: '#NaturalSkincare #CleanBeauty #SustainableBeauty #DermatologistApproved #RadiantSkin',
          imageSrc: '/showcase/examples/glow-skincare/posts/post-3-image.png',
          brandName: 'Glow Skincare',
          brandLogoUrl: '/showcase/examples/glow-skincare/logo.png',
          selectedPlatform: 'all',
        },
      },
    ],
    testimonial: {
      quote: 'The product photography is magazine-quality! Our skincare line looks so premium and professional. Sales have increased significantly!',
      author: 'Emma Williams',
      role: 'Skincare Brand Founder',
      location: 'Los Angeles, CA',
      avatar: '/showcase/testimonials/avatars/glow-skincare.jpg',
    },
  },
  {
    id: 'artisan-table',
    brandName: 'The Harvest Table',
    industry: 'Restaurant',
    description: 'Farm-to-table restaurant crafting seasonal dishes with locally-sourced ingredients',
    logo: '/showcase/examples/artisan-table/logo.png',
    logoType: 'logotype',
    logoStyle: 'classic',
    logoShape: 'custom',
    posts: [
      {
        image: '/showcase/examples/artisan-table/posts/post-1-image.png',
        caption: 'Farm-to-table dining that celebrates the season\'s finest ingredients.',
        hashtags: '#FarmToTable #LocalFood #SeasonalCuisine #FreshIngredients #CulinaryArt #FoodieLife',
        generationTime: '30 seconds',
        platformScreenshots: {
          instagram: '/showcase/examples/artisan-table/posts/post-1-instagram.png',
          facebook: '/showcase/examples/artisan-table/posts/post-1-facebook.png',
          linkedin: '/showcase/examples/artisan-table/posts/post-1-linkedin.png',
          twitter: '/showcase/examples/artisan-table/posts/post-1-twitter.png',
        },
        previewProps: {
          caption: 'Farm-to-table dining that celebrates the season\'s finest ingredients.',
          hashtags: '#FarmToTable #LocalFood #SeasonalCuisine #FreshIngredients #CulinaryArt #FoodieLife',
          imageSrc: '/showcase/examples/artisan-table/posts/post-1-image.png',
          brandName: 'The Harvest Table',
          brandLogoUrl: '/showcase/examples/artisan-table/logo.png',
          selectedPlatform: 'all',
        },
      },
      {
        image: '/showcase/examples/artisan-table/posts/post-2-image.png',
        caption: 'Experience the true taste of the season with us.',
        hashtags: '#FarmToTable #LocalIngredients #SeasonalMenu #CulinaryArt #FoodieAdventures #SupportLocal #DiningExperience',
        generationTime: '32 seconds',
        platformScreenshots: {
          instagram: '/showcase/examples/artisan-table/posts/post-2-instagram.png',
          facebook: '/showcase/examples/artisan-table/posts/post-2-facebook.png',
          linkedin: '/showcase/examples/artisan-table/posts/post-2-linkedin.png',
          twitter: '/showcase/examples/artisan-table/posts/post-2-twitter.png',
        },
        previewProps: {
          caption: 'Experience the true taste of the season with us.',
          hashtags: '#FarmToTable #LocalIngredients #SeasonalMenu #CulinaryArt #FoodieAdventures #SupportLocal #DiningExperience',
          imageSrc: '/showcase/examples/artisan-table/posts/post-2-image.png',
          brandName: 'The Harvest Table',
          brandLogoUrl: '/showcase/examples/artisan-table/logo.png',
          selectedPlatform: 'all',
        },
      },
      {
        image: '/showcase/examples/artisan-table/posts/post-3-image.png',
        caption: 'At our heart, we believe in the power of fresh, local ingredients to tell a story on every plate.',
        hashtags: '#FarmToTable #SeasonalEating #LocalProduce #FoodieAdventures #CulinaryJourney #RestaurantLife #GourmetFood',
        generationTime: '32 seconds',
        platformScreenshots: {
          instagram: '/showcase/examples/artisan-table/posts/post-3-instagram.png',
          facebook: '/showcase/examples/artisan-table/posts/post-3-facebook.png',
          linkedin: '/showcase/examples/artisan-table/posts/post-3-linkedin.png',
          twitter: '/showcase/examples/artisan-table/posts/post-3-twitter.png',
        },
        previewProps: {
          caption: 'At our heart, we believe in the power of fresh, local ingredients to tell a story on every plate.',
          hashtags: '#FarmToTable #SeasonalEating #LocalProduce #FoodieAdventures #CulinaryJourney #RestaurantLife #GourmetFood',
          imageSrc: '/showcase/examples/artisan-table/posts/post-3-image.png',
          brandName: 'The Harvest Table',
          brandLogoUrl: '/showcase/examples/artisan-table/logo.png',
          selectedPlatform: 'all',
        },
      },
    ],
    testimonial: {
      quote: 'The food photography is absolutely stunning. Our reservations increased 30% after consistently posting BrandForge content!',
      author: 'Chef Daniel Park',
      role: 'Restaurant Owner & Chef',
      location: 'San Francisco, CA',
      avatar: '/showcase/testimonials/avatars/artisan-table.jpg',
    },
  },
  {
    id: 'elevate-consulting',
    brandName: 'Elevate Consulting',
    industry: 'Business Consulting',
    description: 'Strategic business consulting helping startups and small businesses scale efficiently',
    logo: '/showcase/examples/elevate-consulting/logo.png',
    logoType: 'logotype',
    logoStyle: 'modern',
    logoShape: 'square',
    posts: [
      {
        image: '/showcase/examples/elevate-consulting/posts/post-1-image.png',
        caption: 'Helping businesses scale with data-driven insights and proven growth strategies.',
        hashtags: '#BusinessConsulting #StartupGrowth #ScaleYourBusiness #BusinessStrategy #Entrepreneurship #GrowthHacking',
        generationTime: '29 seconds',
        platformScreenshots: {
          instagram: '/showcase/examples/elevate-consulting/posts/post-1-instagram.png',
          facebook: '/showcase/examples/elevate-consulting/posts/post-1-facebook.png',
          linkedin: '/showcase/examples/elevate-consulting/posts/post-1-linkedin.png',
          twitter: '/showcase/examples/elevate-consulting/posts/post-1-twitter.png',
        },
        previewProps: {
          caption: 'Helping businesses scale with data-driven insights and proven growth strategies.',
          hashtags: '#BusinessConsulting #StartupGrowth #ScaleYourBusiness #BusinessStrategy #Entrepreneurship #GrowthHacking',
          imageSrc: '/showcase/examples/elevate-consulting/posts/post-1-image.png',
          brandName: 'Elevate Consulting',
          brandLogoUrl: '/showcase/examples/elevate-consulting/logo.png',
          selectedPlatform: 'all',
        },
      },
    ],
    testimonial: {
      quote: 'As a consultant, I needed content that looks professional yet approachable. BrandForge nails it every time. Saves me hours every week!',
      author: 'Michael Foster',
      role: 'Business Strategy Consultant',
      location: 'Austin, TX',
      avatar: '/showcase/testimonials/avatars/elevate-consulting.jpg',
    },
  },
  {
    id: 'fitlife-performance',
    brandName: 'FitLife Performance',
    industry: 'Fitness Coaching',
    description: 'High-performance fitness coaching delivering personalized training programs',
    logo: '/showcase/examples/fitlife-performance/logo.png',
    logoType: 'logomark',
    logoStyle: 'bold',
    logoShape: 'shield',
    posts: [
      {
        image: '/showcase/examples/fitlife-performance/posts/post-1-image.png',
        caption: 'Transform your fitness journey with personalized coaching and expert nutrition guidance.',
        hashtags: '#FitnessCoaching #PersonalTraining #FitnessTransformation #WorkoutMotivation #HealthyLifestyle #FitnessGoals',
        generationTime: '31 seconds',
        platformScreenshots: {
          instagram: '/showcase/examples/fitlife-performance/posts/post-1-instagram.png',
          facebook: '/showcase/examples/fitlife-performance/posts/post-1-facebook.png',
          linkedin: '/showcase/examples/fitlife-performance/posts/post-1-linkedin.png',
          twitter: '/showcase/examples/fitlife-performance/posts/post-1-twitter.png',
        },
        previewProps: {
          caption: 'Transform your fitness journey with personalized coaching and expert nutrition guidance.',
          hashtags: '#FitnessCoaching #PersonalTraining #FitnessTransformation #WorkoutMotivation #HealthyLifestyle #FitnessGoals',
          imageSrc: '/showcase/examples/fitlife-performance/posts/post-1-image.png',
          brandName: 'FitLife Performance',
          brandLogoUrl: '/showcase/examples/fitlife-performance/logo.png',
          selectedPlatform: 'all',
        },
      },
      {
        image: '/showcase/examples/fitlife-performance/posts/post-2-image.png',
        caption: 'Unlock your true potential with a fitness journey designed exclusively for you.',
        hashtags: '#FitnessCoaching #PersonalizedTraining #NutritionGuidance #HealthTransformation #SustainableLifestyle #WellnessJourney #HighPerformance',
        generationTime: '32 seconds',
        platformScreenshots: {
          instagram: '/showcase/examples/fitlife-performance/posts/post-2-instagram.png',
          facebook: '/showcase/examples/fitlife-performance/posts/post-2-facebook.png',
          linkedin: '/showcase/examples/fitlife-performance/posts/post-2-linkedin.png',
          twitter: '/showcase/examples/fitlife-performance/posts/post-2-twitter.png',
        },
        previewProps: {
          caption: 'Unlock your true potential with a fitness journey designed exclusively for you.',
          hashtags: '#FitnessCoaching #PersonalizedTraining #NutritionGuidance #HealthTransformation #SustainableLifestyle #WellnessJourney #HighPerformance',
          imageSrc: '/showcase/examples/fitlife-performance/posts/post-2-image.png',
          brandName: 'FitLife Performance',
          brandLogoUrl: '/showcase/examples/fitlife-performance/logo.png',
          selectedPlatform: 'all',
        },
      },
      {
        image: '/showcase/examples/fitlife-performance/posts/post-3-image.png',
        caption: 'Imagine a fitness journey where every step is tailored just for you.',
        hashtags: '#FitnessJourney #PersonalizedTraining #NutritionCoaching #LifestyleTransformation #HealthAndWellness #SustainableHealth #HighPerformance',
        generationTime: '32 seconds',
        platformScreenshots: {
          instagram: '/showcase/examples/fitlife-performance/posts/post-3-instagram.png',
          facebook: '/showcase/examples/fitlife-performance/posts/post-3-facebook.png',
          linkedin: '/showcase/examples/fitlife-performance/posts/post-3-linkedin.png',
          twitter: '/showcase/examples/fitlife-performance/posts/post-3-twitter.png',
        },
        previewProps: {
          caption: 'Imagine a fitness journey where every step is tailored just for you.',
          hashtags: '#FitnessJourney #PersonalizedTraining #NutritionCoaching #LifestyleTransformation #HealthAndWellness #SustainableHealth #HighPerformance',
          imageSrc: '/showcase/examples/fitlife-performance/posts/post-3-image.png',
          brandName: 'FitLife Performance',
          brandLogoUrl: '/showcase/examples/fitlife-performance/logo.png',
          selectedPlatform: 'all',
        },
      },
    ],
    testimonial: {
      quote: 'My clients love the motivational content! The transformation posts especially get tons of engagement. BrandForge is a game-changer!',
      author: 'Coach Ryan Thompson',
      role: 'Certified Fitness Coach',
      location: 'Denver, CO',
      avatar: '/showcase/testimonials/avatars/fitlife-performance.jpg',
    },
  },
];

export const showcaseTestimonials: ShowcaseTestimonial[] = [];

// ===== HELPER FUNCTIONS =====

/**
 * Get a specific showcase example by ID
 */
export function getShowcaseById(id: string): ShowcaseBrand | undefined {
  return showcaseExamples.find(example => example.id === id);
}

/**
 * Get random showcase examples
 */
export function getRandomShowcases(count: number = 3): ShowcaseBrand[] {
  const shuffled = [...showcaseExamples].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Get showcase examples by industry
 */
export function getShowcasesByIndustry(industry: string): ShowcaseBrand[] {
  return showcaseExamples.filter(example => example.industry === industry);
}

/**
 * Get all testimonials
 */
export function getAllTestimonials(): ShowcaseTestimonial[] {
  return showcaseTestimonials;
}

/**
 * Get random testimonials
 */
export function getRandomTestimonials(count: number = 2): ShowcaseTestimonial[] {
  const shuffled = [...showcaseTestimonials].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Load showcase data from generated JSON files
 * Call this after generation is complete
 */
export async function loadShowcaseData(): Promise<void> {
  // This would dynamically load all brand info.json files
  // and populate showcaseExamples and showcaseTestimonials arrays

  // For server-side usage (Node.js)
  if (typeof window === 'undefined') {
    const fs = await import('fs/promises');
    const path = await import('path');

    const showcaseDir = path.join(process.cwd(), 'public/showcase/examples');

    try {
      const brandDirs = await fs.readdir(showcaseDir);

      for (const brandDir of brandDirs) {
        const infoPath = path.join(showcaseDir, brandDir, 'info.json');

        try {
          const infoContent = await fs.readFile(infoPath, 'utf-8');
          const brandInfo = JSON.parse(infoContent);

          // Load post data
          const posts = [];
          for (let i = 1; i <= 3; i++) {
            const postDataPath = path.join(showcaseDir, brandDir, 'posts', `post-${i}-data.json`);
            try {
              const postContent = await fs.readFile(postDataPath, 'utf-8');
              posts.push(JSON.parse(postContent));
            } catch (err) {
              // Post might not exist yet
            }
          }

          const brand: ShowcaseBrand = {
            id: brandInfo.id,
            brandName: brandInfo.brandName,
            industry: brandInfo.industry,
            description: brandInfo.description,
            logo: brandInfo.logo,
            posts,
            testimonial: brandInfo.testimonial,
          };

          showcaseExamples.push(brand);

          if (brand.testimonial) {
            showcaseTestimonials.push({
              ...brand.testimonial,
              avatar: `/showcase/testimonials/avatars/${brand.id}.jpg`,
            });
          }
        } catch (err) {
          console.warn(`Could not load brand info for ${brandDir}:`, err);
        }
      }
    } catch (err) {
      console.warn('Could not load showcase data:', err);
    }
  }
}
