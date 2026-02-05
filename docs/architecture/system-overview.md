# System Architecture Overview

## High-Level Architecture

The Foundry system follows a three-tier architecture:

1. **Frontend (React)**: User interface for input collection and result visualization
2. **Backend (FastAPI)**: Orchestration layer with AI agents
3. **Data Layer**: PostgreSQL for structured data, FAISS for vector search

## Key Components

### Frontend
- React with TypeScript
- Clerk for authentication
- Zustand for state management
- TailwindCSS for styling

### Backend
- FastAPI for REST API
- Multiple AI agents for validation
- RAG system for evidence-based analysis
- WebSocket for real-time updates

### Databases
- PostgreSQL: User data, ideas, validation results
- FAISS: Vector embeddings for market research documents

## Data Flow

1. User inputs idea (text/voice)
2. Backend normalizes input to structured format
3. Planner agent creates execution plan
4. Specialized agents perform validation
5. Critic agent evaluates quality
6. Refiner agent improves weak outputs
7. Final report generated and returned

For detailed workflow, see [agent-workflow.md](./agent-workflow.md)
