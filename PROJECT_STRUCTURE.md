# Project Structure Template

This document provides a complete project structure template for implementing NestJS + AI SDK + React streaming applications.

## Complete Directory Structure

```
my-ai-app/
├── package.json                           # Root workspace configuration
├── tsconfig.json                          # Root TypeScript configuration
├── .gitignore                             # Git ignore patterns
├── README.md                              # Project documentation
├── docker-compose.yml                     # Docker setup (optional)
├── .env.example                           # Environment variables template
│
├── packages/
│   ├── api/                               # NestJS Backend
│   │   ├── package.json                   # Backend dependencies
│   │   ├── tsconfig.json                  # Backend TypeScript config
│   │   ├── nest-cli.json                  # NestJS CLI configuration
│   │   ├── .env                           # Backend environment variables
│   │   ├── .env.example                   # Environment template
│   │   │
│   │   ├── src/
│   │   │   ├── main.ts                    # Application entry point
│   │   │   ├── app.module.ts              # Root application module
│   │   │   ├── app.controller.ts          # Root controller
│   │   │   ├── app.service.ts             # Root service
│   │   │   │
│   │   │   ├── common/                    # Shared utilities
│   │   │   │   ├── dto/                   # Data Transfer Objects
│   │   │   │   │   ├── ai-request.dto.ts
│   │   │   │   │   └── ai-response.dto.ts
│   │   │   │   ├── guards/                # Authentication guards
│   │   │   │   │   └── throttle.guard.ts
│   │   │   │   ├── interceptors/          # Response interceptors
│   │   │   │   │   └── logging.interceptor.ts
│   │   │   │   ├── filters/               # Exception filters
│   │   │   │   │   └── ai-exception.filter.ts
│   │   │   │   └── utils/                 # Utility functions
│   │   │   │       ├── ai-client.util.ts
│   │   │   │       └── validation.util.ts
│   │   │   │
│   │   │   ├── base/                      # Base classes
│   │   │   │   ├── base-ai.service.ts     # Base AI service
│   │   │   │   └── base.controller.ts     # Base controller
│   │   │   │
│   │   │   ├── sequential-processing/     # Sequential pattern
│   │   │   │   ├── sequential-processing.module.ts
│   │   │   │   ├── sequential-processing.controller.ts
│   │   │   │   ├── sequential-processing.service.ts
│   │   │   │   ├── sequential-processing.service.spec.ts
│   │   │   │   └── dto/
│   │   │   │       ├── sequential-request.dto.ts
│   │   │   │       └── sequential-response.dto.ts
│   │   │   │
│   │   │   ├── routing/                   # Routing pattern
│   │   │   │   ├── routing.module.ts
│   │   │   │   ├── routing.controller.ts
│   │   │   │   ├── routing.service.ts
│   │   │   │   ├── routing.service.spec.ts
│   │   │   │   └── dto/
│   │   │   │       ├── routing-request.dto.ts
│   │   │   │       └── routing-response.dto.ts
│   │   │   │
│   │   │   ├── parallel-processing/       # Parallel pattern
│   │   │   │   ├── parallel-processing.module.ts
│   │   │   │   ├── parallel-processing.controller.ts
│   │   │   │   ├── parallel-processing.service.ts
│   │   │   │   ├── parallel-processing.service.spec.ts
│   │   │   │   └── dto/
│   │   │   │       ├── parallel-request.dto.ts
│   │   │   │       └── parallel-response.dto.ts
│   │   │   │
│   │   │   ├── orchestrator-worker/       # Orchestrator pattern
│   │   │   │   ├── orchestrator-worker.module.ts
│   │   │   │   ├── orchestrator-worker.controller.ts
│   │   │   │   ├── orchestrator-worker.service.ts
│   │   │   │   ├── orchestrator-worker.service.spec.ts
│   │   │   │   └── dto/
│   │   │   │       ├── orchestrator-request.dto.ts
│   │   │   │       └── orchestrator-response.dto.ts
│   │   │   │
│   │   │   ├── evaluator-optimizer/       # Evaluator pattern
│   │   │   │   ├── evaluator-optimizer.module.ts
│   │   │   │   ├── evaluator-optimizer.controller.ts
│   │   │   │   ├── evaluator-optimizer.service.ts
│   │   │   │   ├── evaluator-optimizer.service.spec.ts
│   │   │   │   └── dto/
│   │   │   │       ├── evaluator-request.dto.ts
│   │   │   │       └── evaluator-response.dto.ts
│   │   │   │
│   │   │   └── multi-step-tool-usage/     # Tool usage pattern
│   │   │       ├── multi-step-tool-usage.module.ts
│   │   │       ├── multi-step-tool-usage.controller.ts
│   │   │       ├── multi-step-tool-usage.service.ts
│   │   │       ├── multi-step-tool-usage.service.spec.ts
│   │   │       ├── tools/                 # Function calling tools
│   │   │       │   ├── calculator.tool.ts
│   │   │       │   ├── validator.tool.ts
│   │   │       │   └── index.ts
│   │   │       └── dto/
│   │   │           ├── tool-request.dto.ts
│   │   │           └── tool-response.dto.ts
│   │   │
│   │   ├── test/                          # E2E tests
│   │   │   ├── app.e2e-spec.ts
│   │   │   ├── sequential-processing.e2e-spec.ts
│   │   │   ├── routing.e2e-spec.ts
│   │   │   ├── parallel-processing.e2e-spec.ts
│   │   │   ├── orchestrator-worker.e2e-spec.ts
│   │   │   ├── evaluator-optimizer.e2e-spec.ts
│   │   │   └── multi-step-tool-usage.e2e-spec.ts
│   │   │
│   │   ├── jest.config.js                 # Main Jest configuration
│   │   ├── jest.unit.config.js            # Unit tests configuration
│   │   └── jest.e2e.config.js             # E2E tests configuration
│   │
│   └── webapp/                            # React Frontend
│       ├── package.json                   # Frontend dependencies
│       ├── tsconfig.json                  # Frontend TypeScript config
│       ├── vite.config.ts                 # Vite configuration
│       ├── index.html                     # HTML entry point
│       ├── .env                           # Frontend environment variables
│       ├── .env.example                   # Environment template
│       │
│       ├── public/
│       │   ├── favicon.ico
│       │   └── manifest.json
│       │
│       ├── src/
│       │   ├── main.tsx                   # React entry point
│       │   ├── App.tsx                    # Main App component
│       │   ├── App.css                    # Global styles
│       │   ├── vite-env.d.ts              # Vite type definitions
│       │   │
│       │   ├── components/                # Reusable components
│       │   │   ├── common/                # Common UI components
│       │   │   │   ├── Layout.tsx         # App layout wrapper
│       │   │   │   ├── Navigation.tsx     # Navigation component
│       │   │   │   ├── ErrorBoundary.tsx  # Error boundary
│       │   │   │   ├── LoadingStates.tsx  # Loading components
│       │   │   │   └── AgentInteraction.tsx # Universal AI interaction
│       │   │   │
│       │   │   ├── displays/              # Result display components
│       │   │   │   ├── SequentialProcessingDisplay.tsx
│       │   │   │   ├── RoutingDisplay.tsx
│       │   │   │   ├── ParallelProcessingDisplay.tsx
│       │   │   │   ├── OrchestratorWorkerDisplay.tsx
│       │   │   │   ├── EvaluatorOptimizerDisplay.tsx
│       │   │   │   └── MultiStepToolUsageDisplay.tsx
│       │   │   │
│       │   │   └── optimized/             # Performance optimized components
│       │   │       ├── MemoizedResultDisplay.tsx
│       │   │       ├── VirtualizedResultList.tsx
│       │   │       └── LazyLoadedComponent.tsx
│       │   │
│       │   ├── hooks/                     # Custom React hooks
│       │   │   ├── useAIStream.ts         # Core streaming hook
│       │   │   ├── useDebounced.ts        # Debounced values
│       │   │   ├── useWebSocketStream.ts  # WebSocket streaming (optional)
│       │   │   └── useErrorHandling.ts    # Error handling hook
│       │   │
│       │   ├── pages/                     # Route-specific pages
│       │   │   ├── HomePage.tsx           # Landing page
│       │   │   ├── SequentialProcessingPage.tsx
│       │   │   ├── RoutingPage.tsx
│       │   │   ├── ParallelProcessingPage.tsx
│       │   │   ├── OrchestratorWorkerPage.tsx
│       │   │   ├── EvaluatorOptimizerPage.tsx
│       │   │   └── MultiStepToolUsagePage.tsx
│       │   │
│       │   ├── types/                     # TypeScript type definitions
│       │   │   ├── api.types.ts           # API response types
│       │   │   ├── ai-patterns.types.ts   # Pattern-specific types
│       │   │   └── common.types.ts        # Common types
│       │   │
│       │   ├── utils/                     # Utility functions
│       │   │   ├── api.utils.ts           # API helpers
│       │   │   ├── validation.utils.ts    # Form validation
│       │   │   └── formatting.utils.ts    # Data formatting
│       │   │
│       │   └── styles/                    # Styling files
│       │       ├── theme.ts               # Material-UI theme
│       │       ├── global.css             # Global styles
│       │       └── components.css         # Component-specific styles
│       │
│       └── __tests__/                     # Frontend tests
│           ├── components/
│           │   ├── AgentInteraction.test.tsx
│           │   └── displays/
│           │       ├── SequentialProcessingDisplay.test.tsx
│           │       └── ParallelProcessingDisplay.test.tsx
│           ├── hooks/
│           │   ├── useAIStream.test.ts
│           │   └── useDebounced.test.ts
│           └── pages/
│               └── HomePage.test.tsx
│
├── scripts/                               # Build & deployment scripts
│   ├── build.sh                           # Production build script
│   ├── dev.sh                             # Development startup script
│   ├── test.sh                            # Test runner script
│   └── deploy.sh                          # Deployment script
│
├── docs/                                  # Additional documentation
│   ├── API.md                             # API documentation
│   ├── DEPLOYMENT.md                      # Deployment guide
│   ├── DEVELOPMENT.md                     # Development guide
│   └── TROUBLESHOOTING.md                 # Common issues & solutions
│
└── docker/                                # Docker configuration
    ├── Dockerfile.api                     # Backend Dockerfile
    ├── Dockerfile.webapp                  # Frontend Dockerfile
    └── docker-compose.yml                 # Multi-container setup
```

## Key Configuration Files

### Root package.json

```json
{
  "name": "ai-streaming-app",
  "version": "1.0.0",
  "workspaces": [
    "packages/api",
    "packages/webapp"
  ],
  "scripts": {
    "dev": "concurrently \"npm run start:dev --workspace=api\" \"npm run dev --workspace=webapp\"",
    "build": "npm run build --workspaces",
    "lint": "npm run lint --workspaces",
    "lint:fix": "npm run lint:fix --workspaces",
    "test": "npm run test --workspace=api",
    "test:e2e": "npm run test:e2e --workspace=api",
    "test:frontend": "npm run test --workspace=webapp",
    "clean": "npm run clean --workspaces",
    "postinstall": "npm run build"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "typescript": "^5.0.0"
  }
}
```

### Root tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@api/*": ["packages/api/src/*"],
      "@webapp/*": ["packages/webapp/src/*"]
    }
  },
  "include": ["packages/*/src/**/*"],
  "exclude": ["node_modules", "dist", "build"]
}
```

### Backend package.json

```json
{
  "name": "@ai-app/api",
  "version": "1.0.0",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest --config jest.unit.config.js",
    "test:watch": "jest --config jest.unit.config.js --watch",
    "test:cov": "jest --config jest.unit.config.js --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config jest.e2e.config.js",
    "test:all": "npm run test && npm run test:e2e"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/throttler": "^5.0.0",
    "@ai-sdk/google": "^0.0.15",
    "ai": "^3.0.0",
    "zod": "^3.22.0",
    "mathjs": "^12.0.0",
    "dotenv": "^16.3.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.2",
    "@types/node": "^20.3.1",
    "@types/supertest": "^6.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.42.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "jest": "^29.5.0",
    "prettier": "^3.0.0",
    "source-map-support": "^0.5.21",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.4.3",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.3"
  }
}
```

### Frontend package.json

```json
{
  "name": "@ai-app/webapp",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "@ai-sdk/react": "^0.0.9",
    "@mui/material": "^5.14.0",
    "@mui/icons-material": "^5.14.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "react-textarea-autosize": "^8.5.0",
    "react-window": "^1.8.8",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@types/react-window": "^1.8.8",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.3",
    "eslint": "^8.45.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.3",
    "typescript": "^5.0.2",
    "vite": "^4.4.5",
    "vitest": "^0.34.0",
    "@vitest/ui": "^0.34.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "jsdom": "^22.1.0"
  }
}
```

## Environment Configuration

### Backend .env.example

```env
# AI Configuration
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# Database (if needed)
DATABASE_URL=postgresql://user:password@localhost:5432/aiapp

# Logging
LOG_LEVEL=debug

# Caching (if using Redis)
REDIS_URL=redis://localhost:6379
```

### Frontend .env.example

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001

# Feature Flags
VITE_ENABLE_WEBSOCKETS=false
VITE_ENABLE_ANALYTICS=false

# UI Configuration
VITE_THEME_MODE=light
VITE_MAX_STREAM_TIMEOUT=30000
```

## Docker Configuration

### Backend Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY packages/api/package*.json ./packages/api/
RUN npm ci

COPY packages/api/ ./packages/api/
COPY tsconfig.json ./
RUN npm run build --workspace=api

FROM node:18-alpine AS production

WORKDIR /app
COPY package*.json ./
COPY packages/api/package*.json ./packages/api/
RUN npm ci --only=production

COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY packages/api/.env* ./packages/api/

EXPOSE 3001

CMD ["npm", "run", "start:prod", "--workspace=api"]
```

### Frontend Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY packages/webapp/package*.json ./packages/webapp/
RUN npm ci

COPY packages/webapp/ ./packages/webapp/
COPY tsconfig.json ./
RUN npm run build --workspace=webapp

FROM nginx:alpine AS production

COPY --from=builder /app/packages/webapp/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - GOOGLE_GENERATIVE_AI_API_KEY=${GOOGLE_GENERATIVE_AI_API_KEY}
    volumes:
      - ./packages/api/.env:/app/packages/api/.env

  webapp:
    build:
      context: .
      dockerfile: docker/Dockerfile.webapp
    ports:
      - "80:80"
    depends_on:
      - api
    environment:
      - VITE_API_BASE_URL=http://api:3001

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

## Development Scripts

### scripts/dev.sh

```bash
#!/bin/bash
echo "Starting development environment..."

# Check if .env files exist
if [ ! -f packages/api/.env ]; then
    echo "Creating API .env from template..."
    cp packages/api/.env.example packages/api/.env
fi

if [ ! -f packages/webapp/.env ]; then
    echo "Creating webapp .env from template..."
    cp packages/webapp/.env.example packages/webapp/.env
fi

# Install dependencies
npm install

# Start development servers
npm run dev
```

### scripts/build.sh

```bash
#!/bin/bash
echo "Building production application..."

# Clean previous builds
npm run clean

# Install dependencies
npm ci

# Build all packages
npm run build

echo "Build completed successfully!"
```

### scripts/test.sh

```bash
#!/bin/bash
echo "Running test suite..."

# Run linting
npm run lint

# Run backend tests
npm run test --workspace=api
npm run test:e2e --workspace=api

# Run frontend tests
npm run test --workspace=webapp

echo "All tests completed!"
```

This comprehensive project structure provides a solid foundation for building scalable AI streaming applications with proper organization, configuration, and development workflow.