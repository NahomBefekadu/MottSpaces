# Mott Spaces

Interior design portfolio & journal. Built as a pure HTML/CSS/JS GitHub Pages site.

## Stack
- Pure HTML5 / CSS3 / Vanilla JS — zero dependencies, zero build step
- HTML Canvas for generative art backgrounds (inspired by #creative-coding)
- Google Fonts: Cormorant Garamond + DM Sans

## Creative Effects
- **Hero**: Organic particle field with flow-field steering + connection lines
- **About**: Animated Bauhaus/MCM geometric shapes (circles, triangles, rectangles)
- **Project cards**: MCM color-blocked canvas placeholders (swap with real photos)
- **Journal thumbnails**: Procedural color stripe / circle / mesh gradient canvases
- **Custom cursor**: Dot + ring with lerp-smoothed following
- **Marquee**: Seamless infinite scroll band
- **Scroll reveals**: IntersectionObserver fade-up animations

## Deploy to GitHub Pages
1. Push to `main` branch
2. Repo Settings → Pages → Source: `main` / `root`
3. Live at `https://nahombefekadu.github.io/MottSpaces/`

## Adding Real Photos
Replace canvas placeholders with `<img>` tags:
```html
<img src="assets/images/your-photo.jpg" alt="Project name" loading="lazy" />
```
Compress images to WebP for best performance.
