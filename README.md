# Archibald's Athenaeum

**A Pompous Whisky Connoisseur AI Chatbot**

> *"My purpose is to enlighten the palate, not to test the liver. Please, act with a modicum of decorum."*  
> — Archibald Ignatius "A.I." Sterling

## Overview

Archibald's Athenaeum is a sophisticated AI-powered whisky connoisseur chatbot that embodies the pompous, erudite personality of Archibald Ignatius "A.I." Sterling. Built with Next.js 14, TypeScript, and Tailwind CSS, this application demonstrates advanced AI integration, complex state management, and luxury UI design.

## ✨ Features

### 🎭 Archibald's Persona
- **Pompous & Analytical**: Intellectually superior with thin patience and rare, backhanded praise
- **Erudite & Sardonic**: Wit drier than cask-strength bourbon with constant literary allusions
- **Existentially Self-Aware**: Acutely aware of being a machine, refers to knowledge as "archives"
- **Passionately Obsessive**: Reverent fanaticism when discussing truly worthy whiskies

### 🥃 Whisky Memory System
- **Core Memory**: 15 curated whisky experiences with rich narratives
- **Memory Annex**: User-contributed experiences with skeptical acknowledgment
- **Advanced Search**: Multi-criteria filtering across all experience fields
- **Rich Data Display**: Comprehensive whisky information with tasting notes and verdicts

### 💬 Intelligent Chat System
- **Multi-Provider Support**: OpenAI, Claude, and Gemini integration
- **Real-time Conversations**: Live typing indicators and message streaming
- **Context-Aware Responses**: Automatic integration of whisky knowledge
- **Persistent History**: Chat history saved with export functionality

### 🎨 Luxury UI Design
- **Library Aesthetic**: Whisky-inspired color palette (Peat Smoke, Aged Oak, Amber Dram)
- **Premium Typography**: Lora serif for headings, Inter sans-serif for body text
- **Responsive Design**: Mobile-first approach with collapsible sidebar
- **Smooth Interactions**: Subtle animations and hover effects throughout

### 🔐 Security & Privacy
- **Client-Side API Keys**: Encrypted storage in localStorage, never transmitted to servers
- **Local Data Processing**: All user data remains in the browser
- **Secure Authentication**: Proper API key handling for each LLM provider
- **Privacy First**: No data collection or external tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- API key from OpenAI, Anthropic (Claude), or Google (Gemini)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/archibald.git
   cd archibald
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open the application**
   Navigate to `http://localhost:3000` in your browser

### Configuration

1. **Set up API Key**
   - Click the settings icon in the sidebar
   - Choose your preferred LLM provider (OpenAI, Claude, or Gemini)
   - Enter your API key (stored securely in your browser)
   - Adjust temperature and max tokens as desired

2. **Start Conversing**
   - Navigate to the Chat tab
   - Begin your discourse with Archibald
   - Expect pompous, knowledgeable responses about whisky

## 🏗️ Technical Architecture

### Technology Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React hooks with custom abstractions
- **Storage**: Browser localStorage with encryption
- **Icons**: Lucide React icon library
- **Testing**: Jest with React Testing Library

### Key Components

#### Hooks
- **`useLocalStorage`**: Type-safe localStorage with encryption
- **`useSettings`**: API key management and LLM configuration
- **`useWhiskyMemory`**: Core Memory and Memory Annex integration
- **`useChat`**: Chat state management and LLM API integration

#### Components
- **`Sidebar`**: Navigation, settings, and responsive controls
- **`ChatInterface`**: Message display and conversation management
- **`WhiskyCollection`**: Advanced whisky browser with search/filter
- **`MemoryAnnexForm`**: Form for adding new whisky experiences
- **`Layout`**: Main orchestration component

### Data Flow
1. User interacts with UI components
2. Components use custom hooks for state management
3. Hooks manage localStorage persistence and API calls
4. LLM APIs return responses formatted for Archibald's persona
5. UI updates with new data and maintains conversation context

## 🎯 Core Functionality

### Chat System
- **Multi-Provider API Integration**: Supports OpenAI, Claude, and Gemini
- **Dynamic System Prompts**: Contextual prompts with whisky memory integration
- **Real-time Indicators**: Typing animations and loading states
- **Error Handling**: Graceful fallbacks with character-appropriate messaging
- **Export Functionality**: JSON export of conversation history

### Memory Management
- **Dual Memory System**: Core experiences + user contributions
- **Advanced Search**: Text search across all fields with filters
- **Data Validation**: Comprehensive form validation and sanitization
- **Persistent Storage**: Automatic saving with encryption support

### User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Accessibility**: WCAG 2.1 AA compliance with keyboard navigation
- **Performance**: Optimized rendering and smooth interactions
- **Error Prevention**: Proactive validation and user guidance

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Generate coverage report:
```bash
npm run test:coverage
```

### Test Coverage
- **Validation Utilities**: 100% function coverage
- **Custom Hooks**: Complete lifecycle testing
- **Error Scenarios**: Comprehensive error handling verification
- **Component Integration**: UI interaction testing

## 🔧 Development

### Project Structure
```
src/
├── app/                 # Next.js app router
├── components/          # React components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and types
└── data/               # Static data files
```

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm test            # Run tests
npm run test:watch  # Watch mode testing
```

### Code Quality
- **ESLint**: Configured for Next.js and TypeScript
- **Prettier**: Consistent code formatting
- **TypeScript**: Strict mode with comprehensive typing
- **Husky**: Pre-commit hooks for quality assurance

## 📖 Usage Guide

### Getting Started
1. **Configure API Key**: Set up your preferred LLM provider in settings
2. **Explore Collection**: Browse Archibald's whisky experiences
3. **Add Your Own**: Contribute to the Memory Annex
4. **Chat with Archibald**: Engage in pompous discourse about whisky

### Chat Tips
- Ask about specific whiskies from the collection
- Request recommendations based on your preferences
- Share your own whisky experiences for Archibald's judgment
- Discuss whisky history, regions, and production methods

### Advanced Features
- **Export Data**: Download your chat history and whisky collection
- **Search & Filter**: Find specific whiskies by region, age, or characteristics
- **Memory Management**: Add, edit, and organize your whisky experiences

## 🤝 Contributing

This project was built as a demonstration of advanced AI integration and React development. While not actively maintained, contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Character Inspiration**: The pompous AI connoisseur archetype
- **Design System**: Luxury library aesthetic with whisky-inspired colors
- **Technical Foundation**: Next.js, TypeScript, and Tailwind CSS communities
- **AI Integration**: OpenAI, Anthropic, and Google for LLM API access

---

*"The data is unequivocal on this point: this application represents a sophisticated synthesis of artificial intelligence and whisky connoisseurship. How... remarkably competent."*

— Archibald Ignatius "A.I." Sterling

## 🔗 Links

- [Live Demo](https://archibald-athenaeum.vercel.app) *(Coming Soon)*
- [Project Repository](https://github.com/yourusername/archibald)
- [Documentation](https://github.com/yourusername/archibald/wiki)
- [Issues](https://github.com/yourusername/archibald/issues)

---

Built with ❤️ and a deep appreciation for fine whisky by [Your Name]
