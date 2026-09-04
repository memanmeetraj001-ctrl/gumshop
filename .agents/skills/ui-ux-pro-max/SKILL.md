---
name: ui-ux-pro-max
description: Comprehensive UI/UX Design Intelligence layer with 50+ UI styles, 90+ color palettes, typographic hierarchies, responsive layout standards, and conversion-focused UX patterns for React, Tailwind CSS, and SaaS applications.
---

# UI/UX Pro Max Design Intelligence Skill

Expert design system, visual polish, color harmonies, and conversion-focused UX rules for modern web applications and SaaS platforms.

---

## 🎨 Core Design Philosophies for SaaS & Storefronts

1. **Obsidian Dark & Bento Grid Aesthetics**:
   - Use high-contrast dark backgrounds (`#07080B`, `#0D0F17`) with subtle card surfaces (`#121520`, `#161926`).
   - Use thin luminous borders: `border border-white/10` or `border border-indigo-500/20`.
   - Use ambient glow gradients: `bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent`.

2. **Typography & Hierarchy**:
   - Primary Headings: Bold / Black uppercase tracking (`tracking-tight`, `font-black`, `font-heading`).
   - Body & Supporting Text: High-legibility sans-serif with proper contrast (`text-gray-200`, `text-gray-400`).
   - Monospace accents for numbers, badges, and technical IDs: `font-mono text-xs font-bold`.

3. **High-Converting UX Patterns**:
   - **Interactive States**: Smooth hover micro-transitions (`transition-all duration-200 hover:scale-[1.02] hover:border-white/20`).
   - **Progressive Disclosure**: Keep critical CTA buttons prominent; reveal secondary metadata on click or hover.
   - **Pill Badges**: Highlight discounts, statuses, and features (`bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`).
   - **Accessible Touch Targets**: Minimum 44×44px hit areas on mobile viewports.

---

## 🪜 Quick Reference Checklist

| Priority | Category | Domain | Key Checks | Anti-Patterns to Avoid |
|:---:|---|:---:|---|---|
| **1** | **Accessibility & Contrast** | `ux` | Text contrast ≥ 4.5:1, keyboard focus rings, alt text for images | Gray-on-gray low contrast, unlabeled icon buttons |
| **2** | **Touch & Interaction** | `ux` | 44×44px hit targets, clear loading states on buttons | Hover-only critical interactions, 0ms instant jarring state jumps |
| **3** | **Visual Hierarchy** | `style` | Distinct primary CTAs, clear card grouping, Bento layouts | Visual clutter, equal visual weight on primary & secondary buttons |
| **4** | **Color & Palette** | `color` | 60-30-10 rule (60% dark surface, 30% structural white/gray, 10% vivid accent) | Raw random hex colors, clash of saturated colors |
| **5** | **Responsive & Layout** | `ux` | Mobile-first flex/grid layouts, no horizontal scroll | Fixed px widths on mobile, overlapping modal buttons |

---

## 🛠️ Color Palette Reference for GumShop SaaS

- **Primary Canvas**: `#07080B` (Deep Space Dark)
- **Card / Surface**: `#10131E` / `#141724` (Obsidian Tint)
- **Primary Accent**: `#6366F1` / `#8B5CF6` (Electric Indigo / Purple)
- **Success / Live**: `#10B981` (Emerald Glow)
- **Warning / Sale**: `#F59E0B` (Amber Flame) / `#EF4444` (Crimson Tag)
- **Muted Text**: `#9CA3AF` / `#6B7280`
- **Border**: `rgba(255, 255, 255, 0.08)` to `rgba(255, 255, 255, 0.15)`
