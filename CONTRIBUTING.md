# Contributing to Vociant

Thank you for your interest in contributing to Vociant! We welcome contributions from the community.

## How to Contribute

### 1. Fork the Repository

```bash
git clone https://github.com/yourusername/vociant.git
cd vociant
```

### 2. Set Up Development Environment

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp apps/vociant-console/.env.example apps/vociant-console/.env
# Edit .env with your API keys

# Initialize database
pnpm db:push

# Start development server
pnpm dev
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 4. Make Your Changes

- Follow the existing code style
- Add tests if applicable
- Update documentation as needed

### 5. Test Your Changes

```bash
# Run type checking
pnpm typecheck

# Run the development server
pnpm dev

# Test in browser
open http://localhost:3000
```

### 6. Commit Your Changes

```bash
git add .
git commit -m "feat: add your feature description"
```

**Commit Message Format:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

### 7. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Style

- Use TypeScript for all code
- Follow existing naming conventions
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

## Project Structure

```
vociant/
├── packages/
│   └── vociant-core/          # Core orchestration engine
│       ├── providers/          # Provider implementations
│       ├── engine/             # SessionEngine
│       ├── tools/              # Tool execution
│       └── types/              # TypeScript types
└── apps/
    └── vociant-console/        # Next.js console
        ├── src/app/            # Pages & API routes
        ├── src/components/     # React components
        └── prisma/             # Database schema
```

## Areas for Contribution

### Provider Integrations

We're always looking for new provider integrations:

- **TTS**: Google Cloud TTS, Azure TTS, AWS Polly
- **STT**: Google Speech-to-Text, Azure Speech, AssemblyAI
- **LLM**: Google Gemini, Cohere, Mistral

See [docs/PROVIDERS.md](./docs/PROVIDERS.md) for integration guide.

### Features

- Advanced RAG with vector databases (Pinecone, Weaviate)
- Telephony channel support (Twilio, Vonage)
- Multi-language support
- Observability integrations (OpenTelemetry, DataDog)
- Enhanced security (credential encryption, auth)

### Bug Fixes

Check [GitHub Issues](https://github.com/yourusername/vociant/issues) for bugs to fix.

### Documentation

- Improve existing docs
- Add tutorials and examples
- Translate documentation

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions or ideas

Thank you for contributing to Vociant! 🎤
