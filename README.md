# Foundry - AI Startup Builder

An AI-powered platform for validating startup ideas using multiple specialized agents and evidence-based analysis.

## Features

- 🎤 **Multimodal Input**: Text or voice input for startup ideas
- 🤖 **AI Agent System**: Multiple specialized agents for comprehensive validation
- 📊 **Market Analysis**: Evidence-based validation using RAG
- 🏆 **Competitor Analysis**: Automated competitor research
- ✅ **Quality Assurance**: Built-in critic and refiner agents
- 📄 **Detailed Reports**: Professional validation reports

## Tech Stack

- **Frontend**: React, TypeScript, Clerk, TailwindCSS
- **Backend**: FastAPI, Python 3.11
- **Database**: PostgreSQL, FAISS
- **AI**: Claude (Anthropic), GPT (OpenAI)
- **Audio**: Whisper STT, OpenAI TTS

## Quick Start

### Using Setup Script (macOS)

```bash
chmod +x setup-project.sh
./setup-project.sh
```

### Manual Setup

1. **Install Dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend
   cd ../backend
   pip install -r requirements.txt
   ```

2. **Configure Environment**
   ```bash
   # Copy example env files
   cp frontend/.env.example frontend/.env.local
   cp backend/.env.example backend/.env
   
   # Edit with your API keys
   ```

3. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   uvicorn app.main:app --reload
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/api/docs

## Docker Setup

```bash
docker-compose up -d
```

## Project Structure

```
├── frontend/          # React frontend
├── backend/           # FastAPI backend
├── shared/            # Shared types and constants
├── docs/              # Documentation
└── scripts/           # Utility scripts
```

## Environment Variables

### Frontend (.env.local)
- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk public key
- `VITE_API_BASE_URL`: Backend API URL
- `VITE_WS_URL`: WebSocket URL

### Backend (.env)
- `DATABASE_URL`: PostgreSQL connection string
- `CLERK_SECRET_KEY`: Clerk secret key
- `ANTHROPIC_API_KEY`: Anthropic API key
- `OPENAI_API_KEY`: OpenAI API key

See `.env.example` files for complete list.

## Development

### Frontend
```bash
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run linter
npm run type-check   # TypeScript check
```

### Backend
```bash
cd backend
uvicorn app.main:app --reload  # Start dev server
pytest                          # Run tests
black .                         # Format code
mypy .                          # Type check
```

## Testing

```bash
# Frontend
cd frontend
npm run test

# Backend
cd backend
pytest
pytest --cov=app  # With coverage
```

## Deployment

See [docs/deployment/](./docs/deployment/) for deployment guides:
- AWS
- Railway
- Render

## Documentation

- [Architecture Overview](./docs/architecture/system-overview.md)
- [API Documentation](./docs/api/endpoints.md)
- [Development Guide](./docs/development/setup-guide.md)

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
