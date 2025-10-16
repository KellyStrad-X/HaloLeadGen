# How to Update Hero Slideshow Photos

## Super Simple Method

1. **Select your 5 best roofing project photos** from your demo campaign or any other source
2. **Rename them** to:
   - `1.jpg`
   - `2.jpg`
   - `3.jpg`
   - `4.jpg`
   - `5.jpg`

3. **Drop them in this folder**: `/public/hero-slideshow/`
4. **Refresh your browser** - the slideshow will automatically use your new photos!

## That's it!

The slideshow will:
- Auto-rotate through your 5 photos every 5 seconds
- Smoothly fade between images (1 second transitions)
- Apply a dark overlay so the text remains readable
- Display full-width across the hero section

## Want More or Fewer Photos?

If you want to use 3 photos, 7 photos, or any other number:

1. Add your photos to this folder: `1.jpg`, `2.jpg`, `3.jpg`, etc.
2. Edit `app/(marketing)/components/Hero.tsx`
3. Update the `SLIDESHOW_IMAGES` array (lines 11-17) to match your photos

Example for 3 photos:
```tsx
const SLIDESHOW_IMAGES = [
  '/hero-slideshow/1.jpg',
  '/hero-slideshow/2.jpg',
  '/hero-slideshow/3.jpg',
];
```

## Recommended Photo Specs

- **Format**: JPG, PNG, or WebP
- **Size**: 1920x1080 or larger
- **Quality**: High-quality iPhone photos work perfectly!
- **Content**: Your most impressive roofing projects
