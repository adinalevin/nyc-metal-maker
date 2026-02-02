
# Update Favicon

## Summary
Replace the current favicon with the uploaded Metal Parts logo image.

## Steps

1. **Copy the uploaded image to the public folder**
   - Copy `user-uploads://Metal_Parts.png` to `public/favicon.png`

2. **Update index.html**
   - Add a `<link rel="icon">` tag pointing to the new favicon
   - The PNG format will work in all modern browsers

## Technical Details
```html
<!-- Add to <head> section of index.html -->
<link rel="icon" href="/favicon.png" type="image/png">
```

This is a simple one-file change plus copying the uploaded image. The existing `public/favicon.ico` can remain (as a fallback) or be removed - it won't conflict since we're explicitly specifying the PNG favicon.
