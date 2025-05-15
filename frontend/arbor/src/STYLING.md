# Arbor UI Styling Guide

This document outlines the styling system for the Arbor project, a DeFi protocol focused on delta-neutral arbitrage in the Solana perps ecosystem.

## Theme Overview

The Arbor UI is designed with a nature-inspired theme, reflecting its name and core philosophy. The design uses:

- **Earthy, organic color palette** with natural tones
- **Tree-inspired decorative elements** to reflect branching and connectivity
- **Clean, minimalist layouts** with ample whitespace
- **Subtle textures and patterns** reminiscent of natural systems

## Color Palette

### Base Colors
- **Background:** `#f5f0e6` (light) / `#2a2520` (dark)
- **Text:** `#2e2e2e` (light) / `#f5f0e6` (dark)

### Accent Colors
- **Primary:** `#8d6e63` - Earthy brown
- **Secondary:** `#a1887f` - Warm taupe
- **Highlight:** `#c8b6a6` - Soft beige

### Semantic Colors
- **Success/Positive:** Greens
- **Error/Negative:** Reds
- **Warning:** Ambers
- **Info:** Blues

## Typography

- **Font Family:** 'Inter', sans-serif
- **Base Font Size:** 16px
- **Headings:** Clean, with medium-large sizes for good readability
- **Gradient Text:** Used for emphasis, particularly in headings

## Component Overview

The UI system includes the following core components:

### Layout Components
- **ArborPanel** - Versatile container component
- **Card** - Standard content container
- **Modal** - Dialog popup
- **Tabs** - Content organization
- **LandingSection** - Homepage content sections

### Data Display Components
- **DataCard** - For displaying market stats and metrics
- **StrategyCard** - For displaying strategy information
- **FundingRateCard** - For displaying funding rate information
- **PositionCard** - For displaying position information
- **TreeNode** - Visualization for strategy composition
- **StatsGrid** - For displaying multiple metrics

### Typography Components
- **Heading** - Styled heading elements
- **Subheading** - Supporting text elements

### Interactive Components
- **Button** - Multiple variants including Arbor-specific styles
- **Input** - Form controls

## CSS Utility Classes

The system includes custom utility classes:

- **arbor-card** - Basic card styling
- **arbor-panel** - Panel with backdrop blur
- **arbor-gradient-text** - Text with primary-to-secondary gradient
- **arbor-grid-pattern** - Subtle background grid pattern
- **arbor-branch-divider** - Tree-branch inspired divider

## Best Practices

1. **Use the theme variables** for all colors to maintain consistency
2. **Respect the spacing system** using Tailwind's built-in spacing utilities
3. **Use the provided components** rather than creating new ones
4. **Follow accessibility guidelines** with proper contrast ratios
5. **Be consistent with text sizes** across similar components
6. **Use icons sparingly** and ensure they add meaningful context

## Examples

### Creating a basic panel
```jsx
<ArborPanel variant="default" border="accent" branchDecoration>
  <ArborPanelHeader>
    <ArborPanelTitle>Strategy Overview</ArborPanelTitle>
    <ArborPanelDescription>View your active strategies</ArborPanelDescription>
  </ArborPanelHeader>
  <ArborPanelContent>
    {/* Content here */}
  </ArborPanelContent>
</ArborPanel>
```

### Creating a fancy heading
```jsx
<Heading 
  size="h2" 
  variant="gradient" 
  decoration="branch"
>
  Delta-Neutral Strategies
</Heading>
<Subheading>
  Optimize your arbitrage opportunities across markets
</Subheading>
```

### Creating a button with Arbor styling
```jsx
<Button variant="arbor">Get Started</Button>
<Button variant="arbor-outline">Learn More</Button>
```