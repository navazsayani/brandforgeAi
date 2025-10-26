# Testimonials Quick Reference Card

## 🚀 Quick Start: Add New Testimonial in 5 Minutes

### 1. Add Brand Config
**File:** `src/lib/showcase/generate-showcase.ts`

```typescript
{
  id: 'brand-slug',
  brandName: 'Brand Name',
  industry: 'Industry',
  description: '...',
  targetKeywords: '...',
  imageStyleNotes: '...',
  logoStyle: 'modern',
  logoType: 'logomark',
  logoShape: 'circle',

  testimonial: {
    quote: 'Specific results and benefits quote',
    author: 'Full Name',
    role: 'Job Title',
    location: 'City, State',
  },
}
```

### 2. Generate
```bash
npx tsx src/lib/showcase/generate-showcase.ts
```
⏱️ Takes 3-5 minutes, creates avatar automatically at:
`/public/showcase/testimonials/avatars/{brand-id}.jpg`

### 3. Update Data
**File:** `src/lib/showcase/showcase-data.ts`

Add brand to `showcaseExamples` array with:
```typescript
testimonial: {
  quote: '...',
  author: '...',
  role: '...',
  location: '...',
  avatar: '/showcase/testimonials/avatars/{brand-id}.jpg',  // Auto-generated!
}
```

### 4. Done! ✅
Testimonial now appears:
- ✅ Landing page
- ✅ All utility functions
- ✅ Industry filters
- ✅ Brand queries

---

## 📖 Use Testimonials Anywhere

### Simple (Recommended)
```tsx
import TestimonialSection from '@/components/testimonials/TestimonialSection';

<TestimonialSection count={3} featured={true} />
```

### By Industry
```tsx
<TestimonialSection industry="Coffee Shop" count={1} />
```

### Custom
```tsx
import { TestimonialList } from '@/components/testimonials';
import { getRandomTestimonials } from '@/lib/testimonials';

const testimonials = getRandomTestimonials(6);
<TestimonialList testimonials={testimonials} layout="grid" columns={3} />
```

---

## 🔧 Utility Functions

```typescript
import {
  getAllTestimonials,           // Get all
  getRandomTestimonials,         // Get random N
  getFeaturedTestimonials,       // Get featured
  getTestimonialsByIndustry,     // Filter by industry
  getTestimonialsForBrand,       // Get for specific brand
  filterTestimonials,            // Advanced filtering
} from '@/lib/testimonials';
```

---

## 🎨 Display Options

### Variants
- `default` - Standard card
- `compact` - Smaller, sidebar-friendly
- `minimal` - No card border, inline
- `featured` - Large, prominent, gradient

### Layouts
- `grid` - Responsive grid (1-4 columns)
- `carousel` - Single item with navigation
- `list` - Vertical stack
- `masonry` - Pinterest-style (future)

---

## 📁 Key Files

### Data & Logic
- `src/lib/testimonials/testimonials-data.ts` - Data store
- `src/lib/testimonials/testimonials-utils.ts` - 14 utility functions
- `src/lib/testimonials/types.ts` - TypeScript types

### Components
- `src/components/testimonials/TestimonialCard.tsx` - Single display
- `src/components/testimonials/TestimonialList.tsx` - Multiple display
- `src/components/testimonials/TestimonialSection.tsx` - Complete section

### Generation
- `src/lib/showcase/generate-showcase.ts` - Brand + testimonial generator
- `src/lib/showcase/showcase-data.ts` - Live data (update manually)

### Documentation
- `src/components/testimonials/README.md` - Full component docs
- `TESTIMONIAL_GENERATION_GUIDE.md` - Complete generation guide
- `TESTIMONIALS_IMPLEMENTATION.md` - System overview

---

## ✅ Verification Checklist

After adding new brand:
- [ ] Avatar exists: `/public/showcase/testimonials/avatars/{id}.jpg`
- [ ] Added to `showcase-data.ts`
- [ ] Avatar path correct in testimonial object
- [ ] `getAllTestimonials()` includes it
- [ ] Displays on landing page

---

## 🐛 Quick Troubleshooting

**Avatar not generating?**
→ Check name and role in testimonial config

**Not appearing in UI?**
→ Added to `showcase-data.ts`? Server restarted?

**Broken image?**
→ Check path: `/showcase/testimonials/avatars/{brand-id}.jpg`

---

## 📚 Full Documentation

1. **Complete generation guide:** `TESTIMONIAL_GENERATION_GUIDE.md`
2. **Component usage:** `src/components/testimonials/README.md`
3. **System overview:** `TESTIMONIALS_IMPLEMENTATION.md`

---

**That's it!** Simple, scalable, reusable. 🎉
