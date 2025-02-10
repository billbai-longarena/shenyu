# Shenyu

A powerful AI conversation platform with multiple model support and extensible plugin system.

## Features

- Multi-model support
- Real-time streaming responses
- History management
- Plugin system
- User data persistence
- Customizable prompts
- WebSocket support

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 7.0.0

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/shenyu.git
cd shenyu
```

2. Configure environment variables
```bash
# Backend configuration
cd packages/backend
cp .env.example .env
# Edit .env file with your API keys
```

### Development

The project provides convenient startup scripts with default port configuration:

- Frontend: 8080
- Backend: 3001

1. Start backend server
```bash
./scripts/start-backend.sh
# Or specify a different port
PORT=3002 ./scripts/start-backend.sh
```

2. Start frontend development server
```bash
# In a new terminal
./scripts/start-frontend.sh
# Or specify a different port
PORT=8081 ./scripts/start-frontend.sh
```

These scripts will automatically:
- Check port availability and provide friendly prompts
- Install dependencies
- Load environment variables
- Start development servers

Notes:
- Use different ports when running multiple instances
- When changing frontend port, remember to update backend CORS configuration
- It's recommended to keep default ports during development unless necessary

### Production Deployment

1. Build frontend
```bash
cd packages/frontend
npm run build
```

2. Build backend
```bash
cd packages/backend
npm run build
```

3. Start services
```bash
# Start frontend
cd packages/frontend
npm run preview

# Start backend
cd packages/backend
npm start
```

## Project Structure

```
shenyu/
├── packages/
│   ├── frontend/     # Frontend project
│   │   ├── src/     # Source code
│   │   ├── public/  # Static assets
│   │   └── dist/    # Build output
│   └── backend/     # Backend project
│       ├── src/     # TypeScript source
│       └── dist/    # Build output
├── docs/            # Documentation
└── scripts/         # Utility scripts
```

## API Documentation

See [API Documentation](docs/api/chat-completions.md) for detailed API reference.

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

For security concerns, please see our [Security Policy](SECURITY.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
