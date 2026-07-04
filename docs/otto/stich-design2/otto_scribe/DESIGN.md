---
name: Otto Scribe
colors:
  surface: '#121317'
  surface-dim: '#121317'
  surface-bright: '#38393d'
  surface-container-lowest: '#0d0e12'
  surface-container-low: '#1a1b1f'
  surface-container: '#1e1f23'
  surface-container-high: '#292a2e'
  surface-container-highest: '#343539'
  on-surface: '#e3e2e7'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#e3e2e7'
  inverse-on-surface: '#2f3034'
  outline: '#918fa0'
  outline-variant: '#464554'
  surface-tint: '#c2c1ff'
  primary: '#c2c1ff'
  on-primary: '#1800a7'
  primary-container: '#5e5ce6'
  on-primary-container: '#f4f1ff'
  inverse-primary: '#4d4ad5'
  secondary: '#c8c6c8'
  on-secondary: '#303032'
  secondary-container: '#49494b'
  on-secondary-container: '#b9b8ba'
  tertiary: '#c8c6c8'
  on-tertiary: '#303032'
  tertiary-container: '#6f6e70'
  on-tertiary-container: '#f5f2f4'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c2c1ff'
  on-primary-fixed: '#0c006b'
  on-primary-fixed-variant: '#332dbc'
  secondary-fixed: '#e4e2e4'
  secondary-fixed-dim: '#c8c6c8'
  on-secondary-fixed: '#1b1b1d'
  on-secondary-fixed-variant: '#474648'
  tertiary-fixed: '#e4e2e4'
  tertiary-fixed-dim: '#c8c6c8'
  on-tertiary-fixed: '#1b1b1d'
  on-tertiary-fixed-variant: '#474649'
  background: '#121317'
  on-background: '#e3e2e7'
  surface-variant: '#343539'
typography:
  display:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  transcript-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.7'
    letterSpacing: -0.01em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  citation:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is built for the modern knowledge worker—the individual who treats information as an asset. The brand personality is **Precise, Academic, and Discreet**. It avoids the "loud" marketing aesthetics of typical SaaS products in favor of a **Corporate Modern** style with heavy **Minimalist** influences.

The UI is designed to stay out of the way, functioning as a "second brain" companion. It prioritizes focus through deep tones and intentional whitespace, ensuring that the user’s cognitive load is reserved for the content of their meetings rather than the interface itself. The emotional response should be one of quiet confidence and absolute reliability.

## Colors
This design system utilizes a **Dark** default mode to maintain discretion in professional settings. 

- **Primary (Indigo):** Used for active states, key focus points, and primary actions. It suggests intelligence and depth.
- **Secondary (Slate):** Used for surface levels and UI containers to provide subtle separation from the background.
- **Tertiary (Charcoal):** The foundational background color, providing a deep, non-distracting canvas.
- **Otto Accent (Forest Mint):** A specialized accent color specifically for transcription status, "active listening" indicators, and AI-generated insights.
- **Neutrals:** A range of grays used for metadata, timestamps, and secondary text to establish a clear hierarchy.

## Typography
The typography strategy leverages three distinct typefaces to separate UI navigation, content reading, and data processing.

- **Geist (Headlines):** Used for page titles and section headers. Its geometric precision reflects the app's technical accuracy.
- **Inter (Body):** Used for summaries and general UI elements. It ensures high readability for long-form summary text.
- **JetBrains Mono (Data/Transcripts):** Crucial for the "Second Brain" aesthetic. All raw transcripts, timestamps, and source citations use this font to signal that they are raw, "computed" data points.

For mobile viewports, `display` text scales down to `24px` to maintain a discreet profile.

## Layout & Spacing
The design system employs a **Fixed Grid** approach for desktop/laptop environments to keep the transcript "source" view stable and a **Fluid** approach for the mobile "Remote Control" view.

- **Desktop (12-column):** Used for the "Second Brain" dashboard where summaries (6 columns) sit alongside the raw transcript (6 columns).
- **Mobile (4-column):** Focused on "The Coach View." Large touch targets for marking "Key Moments" and a clear, single-column status for recording.
- **Spacing Rhythm:** Based on a 4px scale. Standard vertical rhythm for transcript blocks is 16px (stack-md) to ensure the monospace text has breathing room.

## Elevation & Depth
Depth is expressed through **Tonal Layers** rather than shadows. In the dark theme, higher elevation is signaled by lighter shades of charcoal.

- **Level 0 (Background):** `#1C1C1E` - The primary canvas.
- **Level 1 (Cards/Sidebar):** `#2C2C2E` - Used for meeting summary cards and navigation menus.
- **Level 2 (Modals/Overlays):** `#3A3A3C` - Reserved for active recording controls and source citation popovers.
- **Outlines:** A thin, 1px border of `#48484A` is used on all cards to maintain crispness without needing heavy shadows. This reinforces the "precise" brand personality.

## Shapes
This design system uses **Soft** roundedness (4px - 8px). This choice maintains a professional, "tool-like" feel that is more approachable than sharp corners but more serious than highly rounded "consumer" apps. 

- **Standard Elements:** 4px radius for inputs and small buttons.
- **Cards & Containers:** 8px radius for meeting cards and summary blocks.
- **Status Pills:** Fully rounded (pill-shaped) but small in scale to indicate background processes.

## Components
- **Meeting Summary Cards:** High-contrast containers using Level 1 elevation. They feature a `label-caps` category tag (e.g., "STRATEGY") and a brief `body-md` preview.
- **Transcript Timeline:** Uses `transcript-mono`. Speaker names are bolded, and timestamps appear in the left margin in a muted gray.
- **Action Buttons:** Primary buttons use a solid Primary Indigo fill. Secondary buttons use a "Ghost" style with the 1px outline defined in Elevation.
- **Remote Control (Mobile):** Large, tactile buttons for "Bookmark," "Action Item," and "Sensitive Topic." These utilize the `accent_otto` color to provide visual feedback during a recording.
- **Source Citations:** Small, interactive labels in `citation` style that appear at the end of summary paragraphs, linking directly to the timestamp in the raw transcript.
- **Status Indicators:** A pulsating Forest Mint dot for "Live Recording" and a subtle progress bar for "AI Processing."