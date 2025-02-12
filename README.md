# Shenyu [English] | [中文](README.zh.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful AI conversation platform with multiple model support and extensible plugin system. 
The key innovation is its questionnaire-style interaction approach for creating AI Agents, effectively avoiding the mind-blank issues common in conversational interactions.
The AI Agent configurations are publicly displayed for easy prompt optimization.

## Demo
http://139.224.248.148/sn43
Basic demo server

## Features

- 🚀 Multiple AI model support (DeepSeek, Kimi, Aliyun, etc.)
- 💬 Real-time streaming responses
- 🔌 Extensible plugin system
- 📝 Conversation history persistence
- 🌐 WebSocket long connection support
- 🔄 Smart concurrency control
- 📊 Built-in performance testing tools
- 🎨 Elegant user interface

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

2. Install Dependencies
```bash
# Install all dependencies (including frontend and backend)
npm install
npm run setup
```

3. Configure environment variables
```bash
# Backend configuration
cd packages/backend
cp .env.example .env
# Edit .env file with your API keys
```

### Troubleshooting

1. Dependency Installation Issues
- If you encounter dependency installation errors, try installing separately:
```bash
cd packages/backend && npm install
cd ../frontend && npm install
```
- Ensure Node.js version >= 18 and npm version >= 9

2. Port Occupation Issues
- Default ports: Frontend 8080, Backend 3001
- Startup scripts will automatically detect and attempt to release occupied ports
- You can also specify different ports via environment variables:
```bash
PORT=3002 npm run dev:backend
PORT=8081 npm run dev:frontend
```

3. Backend Service Issues
- Ensure .env file is configured correctly
- Verify API keys are valid
- Check backend logs for detailed error messages

4. Frontend Service Issues
- Ensure backend service is running and accessible
- Check browser console for error messages
- If page loading is abnormal, try clearing browser cache

5. WebSocket Connection Issues
- Ensure firewall is not blocking WebSocket connections
- Verify backend service is running properly
- Check if WebSocket port (3001) is accessible

### Development

#### Windows

1. Install Dependencies
```bash
# Run in project root directory
npm install
npm run setup
```

2. Configure Backend Environment
```bash
# Enter backend directory
cd packages/backend
# Create .env file (if not exists)
copy .env.example .env
# Edit .env file with necessary API keys
# KIMI_API_KEY=your_api_key_here
# PORT=3001
# HOST=localhost
```

3. Start Backend Service
```bash
# Run in project root directory
npm run dev -w @shenyu/backend
```

4. Start Frontend Development Server
```bash
# Open a new terminal, run in project root directory
npm run dev -w @shenyu/frontend
```

After services start:
- Frontend URL: http://localhost:8080
- Backend URL: http://localhost:3001
- WebSocket Service: ws://localhost:3001

Important Notes:
- Ensure Node.js version >= 18
- Ensure npm version >= 9
- Backend service must run on port 3001
- If port is occupied, terminate the process using that port first
- API key configuration is required for first-time setup to use AI model services

#### Linux/macOS

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

## Documentation

- [Development Guide](docs/guide/index.md)
- [API Documentation](docs/api/chat-completions.md)
- [Component Documentation](docs/components/execution-panel.md)
- [State Management Best Practices](docs/guide/state-management-best-practices.en.md) [English]
- [Bilingual Documentation Guide](docs/guide/bilingual-docs-best-practices.en.md) [English]
- [Best Practices for Adding New Models](docs/guide/add-model-best-practices.en.md) [English]
- [Changelog](docs/changelog.en.md) [English]

## Plugin Development

Shenyu supports extending AI model support through its plugin system. Check out the [Plugin Development Guide](docs/guide/plugin-development.md) to learn how to develop your own model plugin.

## Contributing

We welcome any form of contribution! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to participate in project development.

## Security

If you discover a security vulnerability, please check our [Security Policy](SECURITY.md) for reporting procedures.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details

## Acknowledgments

Thanks to all developers who have contributed to this project!

## Contact Us

- Submit Issues
- Project Discussion
- Email Contact

## Status Badges

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/billbai-longarena/shenyu/ci.yml?branch=main)
![GitHub package.json version](https://img.shields.io/github/package-json/v/billbai-longarena/shenyu)
![GitHub](https://img.shields.io/github/license/billbai-longarena/shenyu)
