# TextBuilder.ai Clone - Implementation Plan

This document outlines the complete implementation plan for building a TextBuilder.ai clone, organized by folders and components. Each section includes detailed instructions for implementation.

## Technology Stack

### Frontend
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS
- **State Management**: React Context API + React Query
- **HTTP Client**: Axios

### Backend
- **Framework**: Node.js + Express
- **Database**: MongoDB with Mongoose
- **Queue System**: Bull/BullMQ with Redis
- **Authentication**: JWT
- **File Storage**: AWS S3
- **AI Integrations**: OpenAI API, Claude API, Meta's LLaMA, etc.
- **Image Generation**: FLUX, ReCraft, etc. APIs

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Deployment**: AWS or similar cloud provider
- **CI/CD**: GitHub Actions

## Development Roadmap

We'll develop the system in the following segments:

1. **Project Setup & Infrastructure**
   - Set up frontend and backend repositories
   - Configure Docker and development environment
   - Set up database connections and schemas

2. **Authentication System**
   - User registration, login, account management
   - JWT authentication
   - Credits system foundations

3. **Core Backend Components**
   - API routes and controllers
   - Database models and services
   - Queue system for background processing

4. **AI Model Integrations**
   - OpenAI API integration
   - Claude API integration
   - Other AI model integrations
   - Image generation API integrations

5. **Content Generation System**
   - Article generation pipeline
   - Content formatting and processing
   - SEO optimization services

6. **Core Frontend Components**
   - Layout and navigation
   - Dashboard components
   - Form components and configuration UIs

7. **Content Generation UIs**
   - AI Writer UI
   - Auto Writer UI
   - Long-form Writer UI

8. **WordPress Integration**
   - WordPress API integration
   - Content publishing system
   - Scheduling system

9. **Payment & Credits**
   - Payment processing
   - Credits management
   - Subscription/lifetime access handling

10. **Deployment & Testing**
    - Deployment configuration
    - End-to-end testing
    - Performance optimization

## Segment-by-Segment Implementation Plan

### Segment 1: Project Setup & Infrastructure

#### 1.1. Basic Project Structure

```
/textbuilder-clone
  /frontend      # Next.js application
  /backend       # Node.js/Express API
  /infrastructure  # Docker + deployment configs
  README.md      # Project documentation
```

#### 1.2. Frontend Setup (Next.js)

1. Create a new Next.js project:
```bash
npx create-next-app@latest frontend
cd frontend
```

2. Install required dependencies:
```bash
npm install @headlessui/react axios react-query jwt-decode tailwindcss postcss autoprefixer react-hook-form react-icons react-markdown daisyui
```

3. Configure Tailwind CSS:
```bash
npx tailwindcss init -p
```

4. Update `tailwind.config.js` with required configurations.

5. Create basic folder structure:
```
/frontend
  /src
    /components    # UI components
    /contexts      # React context providers
    /hooks         # Custom React hooks
    /pages         # Next.js pages
    /public        # Static assets
    /styles        # CSS/styling
    /utils         # Helper utilities
```

#### 1.3. Backend Setup (Node.js/Express)

1. Create a new Node.js project:
```bash
mkdir -p backend
cd backend
npm init -y
```

2. Install required dependencies:
```bash
npm install express mongoose bcryptjs jsonwebtoken dotenv cors helmet morgan winston express-validator bullmq redis axios nodemailer aws-sdk multer 
```

3. Install development dependencies:
```bash
npm install -D nodemon typescript ts-node @types/express @types/node
```

4. Create TypeScript configuration:
```bash
npx tsc --init
```

5. Create basic folder structure:
```
/backend
  /src
    /config         # Configuration files
    /controllers    # Request handlers
    /middleware     # Express middleware
    /models         # Mongoose models
    /routes         # Express routes
    /services       # Business logic services 
    /utils          # Helper functions
    /workers        # Background job workers
    app.ts          # Express application setup
    server.ts       # Server entry point
```

#### 1.4. Docker Configuration

1. Create a Docker Compose file:
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "4000:4000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - MONGO_URI=mongodb://mongo:27017/textbuilder
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  mongo-data:
  redis-data:
```

2. Create frontend Dockerfile.dev:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

3. Create backend Dockerfile.dev:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]
```

### Segment 2: Authentication System

#### 2.1. Backend Authentication

1. Create User Model (`backend/src/models/User.js`):
   - Define schema for users with fields for email, password, name, etc.
   - Include credits, roles, and subscription details

2. Create Authentication Controller (`backend/src/controllers/auth.js`):
   - Implement registration, login, and password reset
   - Handle session management with JWT

3. Create Authentication Routes (`backend/src/routes/auth.js`):
   - Define API endpoints for auth operations
   - Implement input validation with express-validator

4. Create JWT Middleware (`backend/src/middleware/auth.js`):
   - Protect routes that require authentication
   - Verify and decode JWT tokens

5. Implement Credits System (`backend/src/models/Credits.js`):
   - Define schema for tracking user credits
   - Create service for managing credit allocation and usage

#### 2.2. Frontend Authentication

1. Create Authentication Context (`frontend/src/contexts/AuthContext.js`):
   - Manage user authentication state
   - Handle login, logout, and token storage

2. Create Login and Registration Pages:
   - Implement forms with validation
   - Handle authentication API calls

3. Create Protected Route Component:
   - Redirect unauthenticated users
   - Handle role-based access control

4. Create Account Settings Page:
   - Allow users to update profile information
   - Display credit information and usage

### Segment 3: Core Backend Components

#### 3.1. Database Models

1. Article Model (`backend/src/models/Article.js`):
   - Schema for storing generated articles
   - Include fields for content, metadata, status

2. Job Model (`backend/src/models/Job.js`):
   - Schema for tracking generation jobs
   - Include fields for status, progress, etc.

3. Subscription Model (`backend/src/models/Subscription.js`):
   - Schema for tracking user subscriptions/payments
   - Handle lifetime access vs. recurring billing

#### 3.2. API Routes

1. Article Routes (`backend/src/routes/articles.js`):
   - CRUD operations for articles
   - Endpoints for listing, retrieving, and managing articles

2. Generation Routes (`backend/src/routes/generation.js`):
   - Endpoints for starting generation jobs
   - Status tracking and management

3. Settings Routes (`backend/src/routes/settings.js`):
   - User preference management
   - Integration settings (WordPress, etc.)

#### 3.3. Queue System

1. Queue Configuration (`backend/src/config/queue.js`):
   - Set up Bull/BullMQ with Redis
   - Configure queue options and retries

2. Job Processors (`backend/src/workers/articleGenerator.js`):
   - Process article generation jobs
   - Handle failures and retries

3. Queue Management API (`backend/src/controllers/queue.js`):
   - Endpoints for monitoring queue status
   - Job management (pause, resume, delete)

### Segment 4: AI Model Integrations

#### 4.1. OpenAI Integration

1. OpenAI Service (`backend/src/services/ai/openai.js`):
   - Wrapper for OpenAI API
   - Handle prompt engineering and response parsing

2. GPT-4 Specific Logic:
   - Optimize prompts for GPT-4
   - Handle token limits and chunking

#### 4.2. Claude Integration

1. Claude Service (`backend/src/services/ai/claude.js`):
   - Wrapper for Anthropic's Claude API
   - Handle prompt engineering and response parsing

#### 4.3. Other AI Models

1. LLaMA Integration (`backend/src/services/ai/llama.js`):
   - Interface with Meta's LLaMA models
   - Handle model-specific requirements

2. Abstract Factory (`backend/src/services/ai/factory.js`):
   - Factory pattern for selecting AI models
   - Unified interface for all AI providers

#### 4.4. Image Generation

1. Image Generation Service (`backend/src/services/images/generator.js`):
   - Interface with various image generation APIs
   - Handle prompt creation and image processing

2. FLUX Integration (`backend/src/services/images/flux.js`):
   - Wrapper for FLUX API
   - Handle style parameters and options

3. Image Storage Service (`backend/src/services/images/storage.js`):
   - Save generated images to S3 or similar storage
   - Handle image optimization and formats

### Segment 5: Content Generation System

#### 5.1. Content Pipeline

1. Content Generator Service (`backend/src/services/generator/contentGenerator.js`):
   - Orchestrate the generation process
   - Handle different content types and formats

2. SEO Optimizer (`backend/src/services/generator/seoOptimizer.js`):
   - Add SEO elements to content
   - Optimize headings, metadata, etc.

3. Content Formatter (`backend/src/services/generator/formatter.js`):
   - Apply formatting to generated content
   - Handle bold, italic, headers, etc.

#### 5.2. External Integrations

1. External Links Service (`backend/src/services/generator/externalLinks.js`):
   - Find and add relevant external links
   - Handle link placement and context

2. Image Integration Service (`backend/src/services/generator/imageIntegration.js`):
   - Add images to content at specified positions
   - Handle image captions and alt text

#### 5.3. Content Types

1. Article Generator (`backend/src/services/generator/articleGenerator.js`):
   - Generate complete blog articles
   - Handle different article styles and formats

2. Listicle Generator (`backend/src/services/generator/listicleGenerator.js`):
   - Generate "Top X" style content
   - Handle product information and comparisons

3. Product Review Generator (`backend/src/services/generator/reviewGenerator.js`):
   - Generate product reviews
   - Include pros/cons and ratings

### Segment 6: Core Frontend Components

#### 6.1. Layout and Navigation

1. Main Layout (`frontend/src/components/layouts/MainLayout.js`):
   - Page structure with sidebar and header
   - Responsive design elements

2. Sidebar Component (`frontend/src/components/common/Sidebar.js`):
   - Navigation links to different sections
   - Active state management

3. Header Component (`frontend/src/components/common/Header.js`):
   - User information and logout
   - Responsive menu toggle

#### 6.2. Dashboard Components

1. Dashboard Page (`frontend/src/pages/dashboard.js`):
   - Overview of user activity and stats
   - Quick access to main features

2. Stats Cards (`frontend/src/components/dashboard/StatsCard.js`):
   - Display key metrics and credits
   - Visual representations of data

3. Recent Articles List (`frontend/src/components/dashboard/RecentArticles.js`):
   - Show recently generated content
   - Quick actions for articles

#### 6.3. Settings Components

1. Settings Page (`frontend/src/pages/settings.js`):
   - User settings and preferences
   - Integration configurations

2. WordPress Settings (`frontend/src/components/settings/WordPressSettings.js`):
   - Configure WordPress integration
   - Manage site connections

3. AI Model Preferences (`frontend/src/components/settings/AISettings.js`):
   - Set default AI models
   - Configure generation preferences

### Segment 7: Content Generation UIs

#### 7.1. AI Writer UI

1. AI Writer Page (`frontend/src/pages/ai-writer.js`):
   - Interface for single article generation
   - AI model selection

2. AI Model Selector (`frontend/src/components/aiwriter/ModelSelector.js`):
   - UI for choosing AI models (GPT-4, Claude, etc.)
   - Display model descriptions and capabilities

3. Generation Form (`frontend/src/components/aiwriter/GenerationForm.js`):
   - Input fields for article parameters
   - Configuration options (tone, style, etc.)

#### 7.2. Auto Writer UI

1. Auto Writer Page (`frontend/src/pages/auto-writer.js`):
   - Interface for bulk article generation
   - Title management and configuration

2. Title Ideas Generator (`frontend/src/components/autowriter/TitleGenerator.js`):
   - Generate and manage article titles
   - Selection and organization UI

3. Bulk Configuration Form (`frontend/src/components/autowriter/BulkConfig.js`):
   - Settings applied to all generated articles
   - Scheduling and publication options

#### 7.3. Long-form Writer UI

1. Long-form Writer Page (`frontend/src/pages/long-form-writer.js`):
   - Rich text editor for long-form content
   - AI-assisted writing tools

2. Rich Text Editor (`frontend/src/components/longform/Editor.js`):
   - WYSIWYG editor with formatting tools
   - Integration with AI suggestions

3. AI Assistant Panel (`frontend/src/components/longform/AIAssistant.js`):
   - Interface for getting AI suggestions
   - Content expansion and refinement tools

### Segment 8: WordPress Integration

#### 8.1. Backend Integration

1. WordPress API Service (`backend/src/services/wordpress/api.js`):
   - Connect to WordPress REST API
   - Handle authentication and requests

2. Content Publisher (`backend/src/services/wordpress/publisher.js`):
   - Format content for WordPress
   - Handle media and categories

3. Schedule Manager (`backend/src/services/wordpress/scheduler.js`):
   - Manage publication scheduling
   - Handle queued publications

#### 8.2. Frontend Integration

1. WordPress Connection UI (`frontend/src/components/settings/WordPressConnection.js`):
   - Interface for connecting WordPress sites
   - Credential management

2. Publication Options (`frontend/src/components/common/PublicationOptions.js`):
   - UI for selecting publication targets
   - Scheduling interface

3. Publication Status Tracker (`frontend/src/components/common/PublicationStatus.js`):
   - Display publication status
   - Error handling and retries

### Segment 9: Payment & Credits

#### 9.1. Payment Processing

1. Payment Service (`backend/src/services/payment/processor.js`):
   - Interface with payment gateway
   - Handle transactions and webhooks

2. Payment Controller (`backend/src/controllers/payment.js`):
   - Endpoints for payment operations
   - Handle success/failure responses

3. Subscription Manager (`backend/src/services/payment/subscription.js`):
   - Manage recurring payments
   - Handle lifetime access

#### 9.2. Credits System

1. Credits Service (`backend/src/services/credits/manager.js`):
   - Manage credit allocation and usage
   - Track credit transactions

2. Usage Tracking (`backend/src/services/credits/usage.js`):
   - Monitor credit usage by feature
   - Generate usage reports

3. Credits UI (`frontend/src/components/common/CreditsDisplay.js`):
   - Display credit balance and usage
   - Purchase additional credits

### Segment 10: Deployment & Testing

#### 10.1. Testing Setup

1. Backend Tests (`backend/tests`):
   - Unit tests for services and utilities
   - Integration tests for API endpoints

2. Frontend Tests (`frontend/src/tests`):
   - Component tests with React Testing Library
   - End-to-end tests with Cypress

#### 10.2. Production Deployment

1. Production Docker Configuration:
   - Optimized Docker Compose for production
   - Environment configuration

2. CI/CD Pipeline:
   - GitHub Actions configuration
   - Automated testing and deployment

3. Monitoring Setup:
   - Application monitoring
   - Error tracking and logging

## Implementation Instructions

### How to Continue Development Between Sessions

1. **Track Progress**: At the end of each session, note which segment and subsection you completed.

2. **Incremental Building**: Each segment builds on the previous ones, so complete them in order.

3. **Verification Steps**: After completing each segment, verify it works before moving to the next.

4. **Documentation**: Maintain notes on implementation details and any customizations made.

### Testing Each Segment

1. Each segment should be tested independently before integration.

2. Use the following testing checklist for each segment:
   - Unit tests pass
   - Integration with previous segments works
   - UI components render correctly
   - API endpoints respond appropriately
   - Error handling works as expected

### Interdependencies

The segments have the following critical dependencies:

1. Authentication system (Segment 2) is required for most other segments.

2. Core Backend Components (Segment 3) are needed for all subsequent backend features.

3. AI Model Integrations (Segment 4) are required for Content Generation (Segment 5).

4. Core Frontend Components (Segment 6) are needed for all other frontend features.

### Continuation Guide

If you need to continue in a new session, follow these steps:

1. Review the last completed segment from your notes.

2. Verify the working state of previously completed segments.

3. Begin implementing the next segment according to this plan.

4. If you encounter an issue, check dependencies and prerequisites before proceeding.
