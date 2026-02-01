# Gate 0: Indexability

- Check site:metalparts.nyc and https://metalparts.nyc/sitemap.xml
- Check for noindex and robots rules
- Confirm preferred canonical domain and HTTPS consistency
- Verify Google Search Console is set up and a sitemap is submitted

### CRITICAL RULE: DO NOT refactor or change any existing styling, layout, or components unless explicitly requested for a specific task.# Center and Make Hero Section Responsive

## Problem

The hero section content is left-aligned within the container. While `section-container` is properly centered with `mx-auto`, the inner content `div` with `max-w-4xl` is not centered - it just sits on the left side of the container.

## Solution

Center the content and improve mobile responsiveness by:

1. **Center the content wrapper** - Add `mx-auto` to the `max-w-4xl` div so it centers within the container
2. **Center text on mobile** - Add `text-center` on mobile that switches to `text-left` on larger screens (or keep centered throughout for a modern look)
3. **Center the buttons and trust line** - Add `justify-center` on mobile for the flex containers
4. **Center the micro tags** - Add `justify-center` on mobile

## Technical Changes

**File: `src/components/sections/HeroSection.tsx`**

| Line | Current                                                  | Change To                                                                                |
| ---- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 22   | `<div className="max-w-4xl">`                            | `<div className="max-w-4xl mx-auto text-center lg:text-left">`                           |
| 24   | `<div className="flex flex-wrap gap-3 mb-6...">`         | `<div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-6...">`         |
| 53   | `<div className="flex flex-wrap gap-4 mb-10">`           | `<div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-10">`           |
| 71   | `<div className="flex flex-wrap items-center gap-6...">` | `<div className="flex flex-wrap justify-center lg:justify-start items-center gap-6...">` |

This will:

- Center all content horizontally in the viewport
- Keep it centered on mobile/tablet
- Optionally left-align on large screens (or stay centered - your preference)
- Make buttons and trust badges stack nicely on mobile
