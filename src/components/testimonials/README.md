# Testimonials System Documentation

A complete, scalable testimonials system for BrandForge AI with reusable components and flexible data management.

---

## 📁 File Structure

```
src/
├── lib/
│   └── testimonials/
│       ├── types.ts                  # TypeScript interfaces
│       ├── testimonials-data.ts      # Centralized data store
│       └── testimonials-utils.ts     # Helper functions
└── components/
    └── testimonials/
        ├── TestimonialCard.tsx       # Single testimonial display
        ├── TestimonialList.tsx       # Multiple testimonials layout
        ├── TestimonialSection.tsx    # Complete section component
        └── README.md                 # This file
```

---

## 🚀 Quick Start

### Basic Usage (Recommended)

The simplest way to add testimonials to any page:

```tsx
import TestimonialSection from '@/components/testimonials/TestimonialSection';

export default function MyPage() {
  return (
    <TestimonialSection
      title="What Our Customers Say"
      count={3}
      featured={true}
    />
  );
}
```

That's it! The component will automatically fetch and display 3 featured testimonials.

---

## 📋 Components

### 1. TestimonialSection (High-Level)

**Complete testimonial section with heading, description, and testimonials.**

```tsx
<TestimonialSection
  title="Loved by Entrepreneurs"
  description="Real results from real businesses"
  count={3}
  featured={true}
  layout="grid"
  variant="default"
  columns={3}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | "Loved by Entrepreneurs & Creators" | Section heading |
| `description` | string | Auto-generated | Section description |
| `testimonials` | Testimonial[] | undefined | Provide testimonials directly (optional) |
| `count` | number | 3 | How many testimonials to show |
| `featured` | boolean | true | Show only featured testimonials |
| `industry` | string | undefined | Filter by industry (e.g., "Coffee Shop") |
| `randomize` | boolean | false | Randomize testimonial selection |
| `layout` | "grid" \| "carousel" \| "list" | "grid" | Display layout |
| `variant` | "default" \| "compact" \| "minimal" \| "featured" | "default" | Card style |
| `columns` | 1 \| 2 \| 3 \| 4 | 3 | Grid columns |
| `showBrandLogos` | boolean | true | Show brand logos on cards |
| `showRating` | boolean | false | Show star ratings |
| `autoRotate` | boolean | false | Auto-rotate carousel |
| `sectionClassName` | string | undefined | Custom section styling |
| `containerClassName` | string | undefined | Custom container styling |
| `showEyebrow` | boolean | true | Show eyebrow label |
| `eyebrowText` | string | "Testimonials" | Eyebrow label text |

---

### 2. TestimonialList (Mid-Level)

**Display multiple testimonials without section wrapper.**

```tsx
import TestimonialList from '@/components/testimonials/TestimonialList';
import { getRandomTestimonials } from '@/lib/testimonials/testimonials-utils';

export default function MyComponent() {
  const testimonials = getRandomTestimonials(6);

  return (
    <TestimonialList
      testimonials={testimonials}
      layout="grid"
      columns={3}
      variant="compact"
    />
  );
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `testimonials` | Testimonial[] | **required** | Testimonials to display |
| `layout` | "grid" \| "carousel" \| "list" | "grid" | Display layout |
| `variant` | "default" \| "compact" \| "minimal" \| "featured" | "default" | Card style |
| `columns` | 1 \| 2 \| 3 \| 4 | 3 | Grid columns (grid layout only) |
| `showBrandLogos` | boolean | false | Show brand logos |
| `showRating` | boolean | true | Show star ratings |
| `showNavigation` | boolean | true | Show carousel navigation |
| `autoRotate` | boolean | false | Auto-rotate carousel |
| `autoRotateInterval` | number | 5000 | Rotation interval (ms) |
| `onTestimonialClick` | (testimonial) => void | undefined | Click handler |
| `className` | string | undefined | Custom styling |

---

### 3. TestimonialCard (Low-Level)

**Single testimonial display component.**

```tsx
import TestimonialCard from '@/components/testimonials/TestimonialCard';

export default function MyComponent() {
  const testimonial = {
    quote: "Amazing product!",
    author: "John Doe",
    role: "CEO",
    location: "NYC",
    avatar: "/avatars/john.jpg"
  };

  return (
    <TestimonialCard
      testimonial={testimonial}
      variant="featured"
      showBrandLogo={true}
    />
  );
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `testimonial` | Testimonial | **required** | Testimonial data |
| `variant` | "default" \| "compact" \| "minimal" \| "featured" | "default" | Display style |
| `showBrandLogo` | boolean | false | Show brand logo |
| `showRating` | boolean | true | Show star rating |
| `onClick` | () => void | undefined | Click handler |
| `className` | string | undefined | Custom styling |

---

## 🎨 Variants Explained

### Default
Standard card with quote, avatar, author info, and optional logo. Good for most uses.

### Compact
Smaller card, great for sidebars or when showing many testimonials. Avatar on top.

### Minimal
Simplified display without card border. Perfect for inline testimonials.

### Featured
Large, prominent display with gradient background and decorative elements. Best for hero sections.

---

## 🗄️ Data Management

### Adding New Testimonials

**Option 1: Link to Showcase Brand** (Recommended for brand examples)

Testimonials automatically pull from showcase data. Just add testimonial to showcase brand in `showcase-data.ts`:

```typescript
// src/lib/showcase/showcase-data.ts
{
  id: 'my-brand',
  brandName: 'My Brand',
  industry: 'Tech',
  // ... other brand data
  testimonial: {
    quote: 'BrandForge AI changed everything!',
    author: 'Jane Smith',
    role: 'Founder',
    location: 'San Francisco, CA',
    avatar: '/showcase/testimonials/avatars/my-brand.jpg',
  },
}
```

**Option 2: Add Standalone Testimonial**

For testimonials not linked to showcase brands:

```typescript
// src/lib/testimonials/testimonials-data.ts
export const standaloneTestimonials: Testimonial[] = [
  {
    id: 'john-marketing',
    quote: 'Incredible tool for content creation!',
    author: 'John Smith',
    role: 'Marketing Director',
    location: 'New York, NY',
    avatar: '/testimonials/avatars/john-smith.jpg',
    rating: 5,
    featured: true,
    verified: true,
  },
];
```

### Avatar Image Guidelines

- **Size:** 500x500px minimum (square)
- **Format:** JPG or PNG
- **Location:** `/public/showcase/testimonials/avatars/` or `/public/testimonials/avatars/`
- **Naming:** Use kebab-case (e.g., `john-smith.jpg`)
- **AI Generation:** Use the `generateAvatarImage()` function in `generate-showcase.ts`

---

## 🔧 Utility Functions

All utility functions are in `src/lib/testimonials/testimonials-utils.ts`.

### Common Functions

```typescript
import {
  getAllTestimonials,
  getRandomTestimonials,
  getFeaturedTestimonials,
  getTestimonialsByIndustry,
  getTestimonialById,
  filterTestimonials,
} from '@/lib/testimonials/testimonials-utils';

// Get all testimonials
const all = getAllTestimonials();

// Get 3 random testimonials
const random = getRandomTestimonials(3);

// Get featured testimonials
const featured = getFeaturedTestimonials(5);

// Get testimonials for specific industry
const coffeeShop = getTestimonialsByIndustry('Coffee Shop');

// Get specific testimonial
const testimonial = getTestimonialById('showcase-daily-grind-coffee');

// Advanced filtering
const filtered = filterTestimonials(all, {
  industry: 'Coffee Shop',
  featured: true,
  minRating: 4,
  limit: 3,
});
```

---

## 📱 Responsive Design

All components are fully responsive:

- **Desktop (lg):** 3-column grid (default)
- **Tablet (md):** 2-column grid
- **Mobile:** Single column stack

Customize columns with the `columns` prop:

```tsx
<TestimonialSection columns={4} /> // 4 columns on large screens
```

---

## 🎯 Real-World Examples

### Landing Page Hero Section

```tsx
<TestimonialSection
  variant="featured"
  count={1}
  layout="carousel"
  autoRotate={true}
  sectionClassName="bg-gradient-to-br from-primary/5 to-accent/5"
/>
```

### Templates Page (Industry-Specific)

```tsx
<TestimonialSection
  title="Trusted by Coffee Shop Owners"
  industry="Coffee Shop"
  count={1}
  variant="compact"
  showBrandLogos={true}
/>
```

### Showcase Modal Footer

```tsx
import { getTestimonialsForBrand } from '@/lib/testimonials/testimonials-utils';

const testimonial = getTestimonialsForBrand('daily-grind-coffee')[0];

<TestimonialCard
  testimonial={testimonial}
  variant="minimal"
  showBrandLogo={true}
/>
```

### Sidebar Widget

```tsx
<TestimonialList
  testimonials={getRandomTestimonials(2)}
  layout="list"
  variant="compact"
  columns={1}
/>
```

### Full Testimonials Page

```tsx
export default function TestimonialsPage() {
  return (
    <>
      <TestimonialSection
        title="Featured Success Stories"
        featured={true}
        count={3}
        variant="featured"
      />

      <TestimonialSection
        title="All Reviews"
        featured={false}
        count={12}
        variant="default"
        columns={4}
      />
    </>
  );
}
```

---

## 🔮 Future Enhancements

Ready for these features (types already support them):

1. **Star Ratings:** Set `showRating={true}` and add `rating` field to testimonials
2. **Video Testimonials:** Add `videoUrl` field for video support
3. **Verification Badges:** Use `verified: true` field
4. **Date Stamps:** Add `date` field for "Posted X days ago"
5. **Testimonial Submission Form:** Build form that creates testimonial objects
6. **Admin Panel:** CRUD interface for managing testimonials
7. **Analytics:** Track which testimonials drive most conversions
8. **A/B Testing:** Test different testimonial combinations

---

## 🎨 Customization

### Custom Styling

```tsx
<TestimonialSection
  sectionClassName="bg-gradient-to-r from-blue-50 to-purple-50 py-24"
  containerClassName="max-w-6xl"
/>
```

### Custom Card Click Handler

```tsx
<TestimonialList
  testimonials={testimonials}
  onTestimonialClick={(testimonial) => {
    console.log('Clicked:', testimonial.author);
    // Open modal, navigate, track analytics, etc.
  }}
/>
```

---

## ✅ Best Practices

1. **Use TestimonialSection** for most cases (easiest)
2. **Featured testimonials** on high-traffic pages (landing, pricing)
3. **Industry-specific** on templates/example pages
4. **3 columns max** on landing pages (better readability)
5. **Show brand logos** when highlighting showcase examples
6. **Hide ratings** unless you have them (keeps design clean)
7. **Auto-rotate carousel** for engagement (5-7 second intervals)

---

## 🐛 Troubleshooting

### Testimonials not showing
- Check that testimonials exist in `testimonials-data.ts` or `showcase-data.ts`
- Verify avatar images exist at specified paths
- Check console for TypeScript errors

### Styling issues
- Ensure parent container has proper width
- Check for conflicting CSS classes
- Use `className` prop for custom overrides

### Import errors
- Use relative imports: `@/components/testimonials/...`
- Ensure all dependencies installed: `npm install`

---

## 📚 Type Reference

See `src/lib/testimonials/types.ts` for full TypeScript definitions:

- `Testimonial` - Base testimonial interface
- `TestimonialWithBrand` - Testimonial with brand context
- `TestimonialFilters` - Filter options
- `TestimonialLayout` - Layout variants
- `TestimonialVariant` - Display variants

---

## 🤝 Contributing

When adding new features:

1. Update types in `types.ts` first
2. Add utility functions in `testimonials-utils.ts`
3. Update components as needed
4. Document changes in this README
5. Test on mobile and desktop

---

## 📞 Support

For questions or issues with the testimonials system:
- Check this README first
- Review the component source code
- Test with example data in `testimonials-data.ts`

---

**Built with ❤️ for BrandForge AI**
