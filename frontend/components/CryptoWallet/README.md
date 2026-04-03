# Crypto Wallet UI Component

A modern, MetaMask-inspired crypto wallet interface built with React, TypeScript, and Tailwind CSS.

## Features

### ✨ Core Functionality
- **Dashboard**: Portfolio overview with total value and 24h changes
- **Token Management**: Searchable list of crypto assets with balances
- **Send/Receive**: Intuitive interfaces for crypto transfers
- **Transaction History**: Detailed transaction logs with status tracking
- **Dark/Light Mode**: Seamless theme switching

### 🎨 Design Features
- **Modern Web3 Aesthetics**: Gradients, glass morphism, rounded cards
- **Mobile-First Design**: Fully responsive layout
- **Smooth Animations**: Hover effects, transitions, micro-interactions
- **Accessibility**: Focus states, semantic HTML, keyboard navigation

### 📱 Responsive Design
- **Mobile**: Optimized for touch interactions with slide-out navigation
- **Tablet**: Adaptive layouts for medium screens
- **Desktop**: Full-featured interface with enhanced UX

## Components

### WalletLayout.tsx
Main component containing all wallet functionality:
- Tab navigation (Dashboard, Tokens, Send, Receive, History)
- Portfolio overview with real-time value display
- Token management with search/filter
- Send/receive forms with validation
- Transaction history with detailed views
- Theme toggle (dark/light mode)

### WalletStyles.css
Custom CSS for:
- Gradient effects and animations
- Glass morphism styling
- Button hover states
- Mobile menu transitions
- Custom scrollbars
- Loading shimmer effects

## Usage

```tsx
import CryptoWallet from '@/components/CryptoWallet/WalletLayout'

export default function WalletPage() {
  return <CryptoWallet />
}
```

## Access Routes

- **Main Wallet**: `/wallet`
- **Development**: `http://localhost:3033/wallet`

## Tech Stack

- **React 18**: Component framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **CSS Animations**: Custom transitions and effects

## Design System

### Colors
- **Primary**: Blue to Purple gradient (#667eea → #764ba2)
- **Success**: Green variants for positive actions
- **Warning**: Yellow for pending states
- **Error**: Red for failed transactions

### Typography
- **Headings**: Bold, gradient text effects
- **Body**: Clean, readable font hierarchy
- **Monospace**: Wallet addresses and transaction hashes

### Interactions
- **Hover**: Subtle lift and shadow effects
- **Focus**: Clear ring indicators
- **Transitions**: Smooth 0.3s easing
- **Loading**: Shimmer and pulse animations

## Mobile Features

- **Hamburger Menu**: Slide-out navigation for small screens
- **Touch-Friendly**: Larger tap targets and gestures
- **Responsive Grid**: Adaptive card layouts
- **Optimized Forms**: Mobile-friendly input handling

## Accessibility

- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Logical tab order
- **Color Contrast**: WCAG compliant colors

## Performance

- **Lazy Loading**: Component-level code splitting
- **Optimized Animations**: GPU-accelerated transforms
- **Efficient State**: Minimal re-renders
- **CSS Optimization**: Minimal bundle impact

## Customization

### Theming
Update CSS variables in `WalletStyles.css`:
```css
:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --card-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

### Colors
Modify gradient stops and color schemes:
- Primary gradients for branding
- Status colors for transactions
- Background gradients for depth

### Animations
Adjust timing and easing:
- Transition durations
- Hover effect speeds
- Loading animation patterns

## Browser Support

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile Safari**: Optimized
- **Chrome Mobile**: Optimized

## Future Enhancements

- **Web3 Integration**: Connect to real wallets
- **Real-time Updates**: Live price feeds
- **Advanced Charts**: Portfolio analytics
- **Multi-Chain Support**: Various blockchain networks
- **DeFi Integration**: Yield farming and staking
- **NFT Gallery**: Digital collectibles display
