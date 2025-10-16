# Hero Slideshow Images

## How to Update Slideshow Photos

This folder contains the background slideshow images for the landing page hero section.

### Quick Start

1. **Add your photos** to this folder with these names:
   - `1.jpg`
   - `2.jpg`
   - `3.jpg`
   - `4.jpg`
   - `5.jpg`

2. **Supported formats**: JPG, PNG, WebP
3. **Recommended size**: 1920x1080 or larger for best quality
4. **That's it!** The slideshow will automatically use your new images

### Adding More/Fewer Images

If you want more or fewer than 5 images:

1. Add/remove image files in this folder (name them `1.jpg`, `2.jpg`, etc.)
2. Update the `SLIDESHOW_IMAGES` array in `app/(marketing)/components/Hero.tsx`:

```tsx
const SLIDESHOW_IMAGES = [
  '/hero-slideshow/1.jpg',
  '/hero-slideshow/2.jpg',
  '/hero-slideshow/3.jpg',
  // Add or remove as needed
];
```

### Tips

- **High quality**: Use your best, most impressive roofing project photos
- **Variety**: Mix different angles, weather conditions, roof types
- **Composition**: Images will be darkened with an overlay for text readability
- **Timing**: Slideshow auto-advances every 5 seconds (configurable in Hero.tsx)

### Current Setup

- **Transition**: 1 second smooth fade
- **Duration**: 5 seconds per image
- **Overlay**: Dark gradient for text contrast
- **Format**: Responsive, full-width background
