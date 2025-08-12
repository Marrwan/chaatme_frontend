# ChaatMe Frontend

A modern, responsive dating application built with Next.js, React, and Tailwind CSS. Features WhatsApp-style messaging and audio/video calling capabilities.

## Features

- 🔐 **Authentication**: Secure login/register with JWT
- 💬 **Real-time Messaging**: WhatsApp-style chat interface
- 📞 **Audio/Video Calling**: WebRTC-powered calling system
- 📱 **Responsive Design**: Works on desktop and mobile
- 🎨 **Modern UI**: Beautiful, intuitive interface
- ⚡ **Fast Performance**: Optimized with Next.js
- 🔒 **Secure**: HTTPS, secure headers, and best practices

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **UI Components**: Radix UI
- **Real-time**: Socket.IO Client
- **Calls**: WebRTC
- **Icons**: Lucide React

## Quick Start

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

1. **Clone and install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Setup**
   ```bash
   # Create .env.local file
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

   App runs on `http://localhost:3000`

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | No | http://localhost:3001/api |
| `NEXT_PUBLIC_SOCKET_URL` | WebSocket URL | No | http://localhost:3001 |

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and configurations
│   ├── services/        # API and external services
│   └── styles/          # Global styles
├── public/              # Static assets
├── .env.example         # Environment variables template
├── package.json
└── README.md
```

## Key Components

### Messaging System
- **ChatWindow**: Main chat interface with WhatsApp-style design
- **MessageBubble**: Individual message component with proper alignment
- **UserList**: List of users for conversations

### Calling System
- **WhatsAppCallInterface**: Audio/video call interface
- **CallModal**: Modal for incoming/outgoing calls
- **GroupCallInterface**: Multi-party calling support

### Authentication
- **AuthProvider**: Context for user authentication
- **Protected Routes**: Route protection middleware

## Production Deployment

### Netlify Deployment

This project is configured for deployment on Netlify:

1. **Connect Repository**: Link your GitHub repository to Netlify
2. **Build Settings**: 
   - Build command: `npm run build`
   - Publish directory: `.next`
3. **Environment Variables**: Set in Netlify dashboard
4. **Deploy**: Netlify will automatically deploy on push to main branch

### Environment Variables for Production

Set these in your Netlify dashboard:

- `NEXT_PUBLIC_API_URL=https://chaatme-backend.onrender.com/api`
- `NEXT_PUBLIC_SOCKET_URL=https://chaatme-backend.onrender.com`

### Build Configuration

The project includes:
- **Next.js Config**: Optimized for production
- **Netlify Config**: Proper redirects and headers
- **Security Headers**: XSS protection, frame options, etc.
- **Image Optimization**: Next.js image optimization

## Features in Detail

### WhatsApp-Style Messaging
- ✅ Sender messages on RIGHT with green bubbles
- ✅ Receiver messages on LEFT with neutral bubbles
- ✅ Timestamps positioned correctly
- ✅ Message status indicators (sent, delivered, read)
- ✅ Real-time updates via WebSocket
- ✅ Typing indicators
- ✅ Message delivery status tracking

### Professional Audio/Video Calling
- ✅ Call initiation with ringing until answered/declined
- ✅ Video calls with main view + small overlay
- ✅ Audio calls with proper controls
- ✅ Network change handling and reconnection
- ✅ Call end functionality
- ✅ Professional UI matching WhatsApp standards

### User Experience
- ✅ Responsive design for all devices
- ✅ Modern, clean interface
- ✅ Fast loading times
- ✅ Accessibility features
- ✅ Error handling and user feedback

## Contributing

1. Follow the coding standards
2. Write tests for new features
3. Update documentation
4. Ensure all tests pass before committing

## License

MIT License - see LICENSE file for details
