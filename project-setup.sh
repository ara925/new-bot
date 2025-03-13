#!/bin/bash
# TextBuilder Clone Project Setup

# Create project root directory
mkdir -p textbuilder-clone
cd textbuilder-clone

# Create README
cat > README.md << 'EOF'
# TextBuilder.ai Clone

A complete clone of TextBuilder.ai with all functionality, including:
- AI-powered content generation (GPT-4, Claude, LLaMA)
- Bulk article generation
- AI image generation
- WordPress integration
- One-time payment system

## Project Structure
- `/frontend` - Next.js application
- `/backend` - Node.js/Express API
- `/infrastructure` - Docker and deployment configurations

## Getting Started
1. Install Docker and Docker Compose
2. Run `docker-compose up` to start the development environment
3. Frontend will be available at http://localhost:3000
4. Backend API will be available at http://localhost:4000

## Development
See detailed implementation plan in the `/docs` folder.
EOF

# Create project structure
mkdir -p frontend backend infrastructure docs

# Set up frontend (Next.js)
cd frontend

# Initialize Next.js project
npx create-next-app@latest . --typescript --eslint --tailwind --app --src-dir --import-alias="@/*"

# Install additional dependencies
npm install axios react-query jwt-decode react-hook-form react-icons react-markdown daisyui @headlessui/react

# Create additional frontend directories
mkdir -p src/components/common src/components/dashboard src/components/autowriter
mkdir -p src/components/aiwriter src/components/longform src/components/settings
mkdir -p src/contexts src/hooks src/utils

# Return to project root
cd ..

# Set up backend (Node.js/Express)
cd backend

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express mongoose bcryptjs jsonwebtoken dotenv cors helmet morgan winston express-validator bullmq redis axios nodemailer aws-sdk multer openai @anthropic-ai/sdk

# Install development dependencies
npm install -D nodemon typescript ts-node @types/express @types/node @types/mongoose @types/bcryptjs @types/jsonwebtoken

# Initialize TypeScript configuration
npx tsc --init

# Create TypeScript tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es2018",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
EOF

# Create package.json scripts
cat > package.json << 'EOF'
{
  "name": "textbuilder-clone-backend",
  "version": "1.0.0",
  "description": "Backend for TextBuilder.ai clone",
  "main": "dist/server.js",
  "scripts": {
    "start": "node dist/server.js",
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "test": "jest"
  },
  "keywords": [
    "textbuilder",
    "ai",
    "content-generation"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.1",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "winston": "^3.10.0",
    "express-validator": "^7.0.1",
    "bullmq": "^4.4.0",
    "redis": "^4.6.8",
    "axios": "^1.5.0",
    "nodemailer": "^6.9.4",
    "aws-sdk": "^2.1440.0",
    "multer": "^1.4.5-lts.1",
    "openai": "^4.0.0",
    "@anthropic-ai/sdk": "^0.6.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "typescript": "^5.2.2",
    "ts-node": "^10.9.1",
    "@types/express": "^4.17.17",
    "@types/node": "^20.5.7",
    "@types/mongoose": "^5.11.97",
    "@types/bcryptjs": "^2.4.3",
    "@types/jsonwebtoken": "^9.0.2"
  }
}
EOF

# Create backend directory structure
mkdir -p src/config src/controllers src/middleware src/models src/routes src/services/ai src/services/images
mkdir -p src/services/generator src/services/wordpress src/services/payment src/services/credits
mkdir -p src/utils src/workers

# Create basic backend files
touch src/app.ts src/server.ts

# Create environment file template
cat > .env.example << 'EOF'
# Server Configuration
PORT=4000
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://mongo:27017/textbuilder

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# JWT Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d

# AI API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
FLUX_API_KEY=your_flux_api_key
RECRAFT_API_KEY=your_recraft_api_key

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_bucket_name
AWS_REGION=your_aws_region

# Payment Gateway
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# WordPress
WP_API_DEFAULT_TIMEOUT=30000
EOF

# Return to project root
cd ..

# Set up Docker files
# Create Docker Compose file
cat > docker-compose.yml << 'EOF'
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
EOF

# Create frontend Dockerfile.dev
cat > frontend/Dockerfile.dev << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
EOF

# Create backend Dockerfile.dev
cat > backend/Dockerfile.dev << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]
EOF

# Create implementation docs file
cp -r implementation_plan.md docs/

echo "Basic project structure setup completed!"
