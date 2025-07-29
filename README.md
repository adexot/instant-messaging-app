# Instant Messaging App

A modern, real-time messaging application built with React, TypeScript, and Instant DB. Features include real-time messaging, typing indicators, user presence, offline support, and full accessibility compliance.

## ✨ Features

- **Real-time Messaging**: Instant message delivery using Instant DB
- **User Presence**: See who's online and typing in real-time
- **Offline Support**: Queue messages when offline, sync when reconnected
- **Responsive Design**: Mobile-first design that works on all devices
- **Accessibility**: Full WCAG compliance with screen reader support
- **Performance**: Virtual scrolling for large message histories
- **Modern UI**: Clean interface built with shadcn/ui and Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- An Instant DB app ID

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd instant-messaging
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Add your Instant DB app ID to `.env`:
```env
VITE_INSTANT_APP_ID=your-instant-db-app-id-here
```

5. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## 🚀 Live Demo

A live demo is automatically deployed to GitHub Pages: [View Demo](https://yourusername.github.io/instant-messaging-app/)

*Note: Replace `yourusername` with your actual GitHub username*

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:github` - Build for GitHub Pages deployment
- `npm run build:analyze` - Build and analyze bundle size
- `npm run preview` - Preview production build
- `npm run preview:github` - Preview GitHub Pages build locally
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Lint code
- `npm run lint:fix` - Lint and fix issues
- `npm run type-check` - Check TypeScript types
- `npm run clean` - Clean build artifacts

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Real-time Database**: Instant DB
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library

### Key Components

- **App**: Main application container with error boundaries
- **AliasEntry**: User registration with alias validation
- **MessageList**: Virtual scrolling message display
- **MessageInput**: Message composition with typing indicators
- **OnlineUsersList**: Real-time user presence
- **ConnectionStatus**: Network status monitoring

### State Management

- React Context for global state
- Custom hooks for feature-specific logic
- Instant DB for real-time data synchronization

## 🎯 Configuration

The app supports multiple environments with different configurations:

- **Development**: Optimized for debugging with smaller page sizes
- **Production**: Performance-optimized with larger page sizes
- **Test**: Fast execution with minimal features

Configuration is managed in `src/config/environment.ts` with feature flags for:

- Virtual scrolling threshold
- Typing indicators
- Offline support
- Animations
- Performance settings

## 🧪 Testing

The app includes comprehensive testing:

- **Unit Tests**: Component and hook testing
- **Integration Tests**: Real-time functionality testing
- **Accessibility Tests**: WCAG compliance verification

Run tests with:
```bash
npm run test:run
```

## 📱 Mobile Support

- Touch-friendly interface with 44px minimum touch targets
- Mobile keyboard handling and viewport adjustments
- Responsive design with mobile-first approach
- iOS safe area support
- Android back button handling

## ♿ Accessibility

- WCAG 2.1 AA compliance
- Screen reader support with ARIA labels
- Keyboard navigation for all features
- High contrast mode support
- Focus management for dynamic content
- Live regions for real-time updates

## 🔧 Performance Optimizations

- Virtual scrolling for large message lists
- Message pagination and lazy loading
- Component memoization with React.memo
- Efficient re-rendering with useMemo/useCallback
- Bundle splitting for optimal caching
- Debounced typing indicators

## 🚀 CI/CD Pipeline

The project includes automated GitHub Actions workflows:

- **Continuous Integration**: Runs tests, type checking, and linting on every push
- **Continuous Deployment**: Automatically deploys to GitHub Pages on main branch updates
- **Quality Gates**: Deployment only proceeds if all tests pass

### Workflow Features:
- Node.js 18 environment
- Dependency caching for faster builds
- Comprehensive testing pipeline
- Automatic artifact generation
- Zero-downtime deployments

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 🐛 Troubleshooting

### Common Issues

**App won't connect to Instant DB**
- Verify your `VITE_INSTANT_APP_ID` is set correctly in `.env`
- Check network connectivity
- Ensure Instant DB service is running

**Messages not appearing**
- Check browser console for errors
- Verify WebSocket connection in Network tab
- Try refreshing the page

**Performance issues**
- Enable virtual scrolling in settings
- Clear browser cache
- Check for memory leaks in DevTools

For more help, check the [Issues](https://github.com/your-repo/issues) page.
