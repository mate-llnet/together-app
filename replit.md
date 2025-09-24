# replit.md

## Overview

Together is a relationship activity tracking application that helps couples monitor and appreciate their shared household contributions. The app allows partners to log activities, generate AI-powered suggestions, send appreciations, and view analytics on their relationship dynamics. Built with a modern full-stack architecture, it emphasizes collaboration, positive reinforcement, and balanced partnership responsibilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a modern React-based frontend with:
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server
- **TailwindCSS** with custom design tokens for consistent styling
- **Shadcn/ui** component library for pre-built UI components
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **React Hook Form** with Zod validation for form handling

The frontend follows a modular structure with separate directories for pages, components (including reusable UI components), hooks, and utilities. The design system uses warm gradients and relationship-focused theming.

### Backend Architecture
The backend is built with Node.js and Express:
- **Express.js** server with TypeScript
- **RESTful API** design with structured route handling
- **Middleware-based architecture** for request logging and error handling
- **Service layer** pattern for business logic separation (AI services, storage abstraction)
- **Development/Production** environment separation with different serving strategies

### Data Storage Solutions
- **PostgreSQL** as the primary database using Neon serverless
- **Drizzle ORM** for type-safe database operations and migrations
- **Abstract storage interface** (IStorage) allowing for different database implementations
- **Schema-first approach** with shared TypeScript types between frontend and backend

The database schema includes tables for users, couples, activities, activity categories, appreciations, and AI suggestions with proper foreign key relationships.

### Authentication and Authorization
- **Simple session-based authentication** with email/password
- **User context management** via React Context API
- **Client-side authentication state** persistence using localStorage
- **Request headers** for user identification (x-user-id)

The system currently uses basic password storage (noted for production hashing requirements) and focuses on user experience over complex security features.

### API Architecture
- **REST endpoints** organized by functionality (/auth, /activities, /partner, /ai, /analytics)
- **Request/Response validation** using Zod schemas
- **Error handling middleware** with consistent error responses
- **Query parameters** for filtering and pagination
- **Mutation operations** with optimistic updates via TanStack Query

### External Service Integrations
- **OpenAI GPT-5 API** for generating activity suggestions and categorization
- **AI-powered features** including contextual activity recommendations and appreciation message generation
- **Environment-based configuration** for API keys and external service endpoints

The AI integration provides personalized suggestions based on user activity patterns, time of day, and relationship dynamics, enhancing the user experience with intelligent recommendations.