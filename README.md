# ft_transcendence

A modern web application featuring online Pong gameplay with real-time multiplayer capabilities, user management, and tournament systems. Final project of the 1337School web development curriculum.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Game Features](#game-features)
- [Architecture](#architecture)
- [Security](#security)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Authors](#authors)

## Overview

ft_transcendence is a comprehensive web application that recreates the classic Pong game with modern web technologies. Players can register, play against each other in real-time, participate in tournaments, chat with other users, and track their game statistics. The project demonstrates full-stack development skills including real-time communication, user authentication, database management, and responsive web design.

## Features

### Core Features
- **Real-time Pong Game**: Smooth multiplayer Pong gameplay using WebSockets
- **User Authentication**: Secure registration and login system with JWT tokens
- **Two-Factor Authentication (2FA)**: Enhanced security with TOTP support
- **User Profiles**: Customizable user profiles with avatars and statistics
- **Friend System**: Add friends, view their status, and invite them to games
- **Chat System**: Real-time messaging with channels and direct messages
- **Tournament System**: Organized tournaments with bracket generation
- **Game History**: Complete match history and statistics tracking
- **Leaderboard**: Global ranking system based on wins and losses
- **Responsive Design**: Mobile-friendly interface

### Advanced Features
- **Live Game Spectating**: Watch ongoing matches in real-time
- **Game Customization**: Custom paddle colors, ball speed, and game modes
- **Admin Panel**: User management and moderation tools
- **Language Support**: Multi-language interface (EN, FR, ES)
- **Dark/Light Theme**: User preference theme switching
- **Blockchain Integration**: Tournament results stored on blockchain
- **AI Opponents**: Play against AI with different difficulty levels
- **Voice Chat**: Integrated voice communication during matches

## Tech Stack

### Frontend
- **JavaScript/TypeScript**: Modern ES6+ with optional TypeScript support
- **HTML5 Canvas**: Game rendering and animations
- **CSS3/SCSS**: Responsive styling with animations
- **Bootstrap 5**: UI component framework
- **WebSocket Client**: Real-time communication

### Backend
- **Django**: Python web framework
- **Django REST Framework**: API development
- **Django Channels**: WebSocket support
- **PostgreSQL**: Primary database
- **Redis**: Session storage and WebSocket channel layer
- **Nginx**: Web server and reverse proxy

### DevOps & Tools
- **Docker & Docker Compose**: Containerization
- **Makefile**: Build automation
- **SSL/TLS**: HTTPS encryption
- **OAuth 2.0**: Third-party authentication (1337Intranet, Google, GitHub)

## Requirements

- **Docker**: Latest version
- **Docker Compose**: v2.0+
- **Make**: Build tool
- **Git**: Version control
- **SSL Certificate**: For HTTPS (development certificates provided)

## Installation

### Quick Start with Docker

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/ft_transcendence.git
cd ft_transcendence
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Build and run with Docker:**
```bash
make build
make up
```

4. **Initialize the database:**
```bash
make migrate
make createsuperuser
```

5. **Access the application:**
- Website: https://localhost:8443
- Admin: https://localhost:8443/admin

### Manual Development Setup

1. **Backend setup:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
```

2. **Frontend setup:**
```bash
cd frontend
npm install
npm run build
```

3. **Redis setup:**
```bash
redis-server
```

4. **Run development servers:**
```bash
# Backend
python manage.py runserver 8000

# WebSocket server
python manage.py runworker
```

## Usage

### Basic Game Flow

1. **Register/Login**: Create an account or log in
2. **Profile Setup**: Upload avatar and customize profile
3. **Find Opponents**: Browse online users or join matchmaking queue
4. **Play Pong**: Enjoy real-time multiplayer Pong matches
5. **Track Progress**: View statistics and climb the leaderboard
6. **Join Tournaments**: Participate in organized competitions

### Game Controls

- **Player 1**: `W` (up) / `S` (down)
- **Player 2**: `↑` (up) / `↓` (down)
- **Pause**: `SPACE`
- **Quit**: `ESC`

### Chat Commands

- `/help` - Show available commands
- `/join <channel>` - Join a chat channel
- `/leave <channel>` - Leave a chat channel
- `/whisper <user> <message>` - Send private message
- `/block <user>` - Block a user
- `/unblock <user>` - Unblock a user

## Game Features

### Game Modes

- **Classic**: Traditional Pong gameplay
- **Speed**: Faster ball and paddle movement
- **Tournament**: Competitive tournament matches
- **AI Training**: Practice against AI opponents

### Customization Options

- **Paddle Colors**: RGB color picker
- **Ball Speed**: Adjustable speed settings
- **Game Duration**: Time-limited or score-limited matches
- **Power-ups**: Optional power-ups for enhanced gameplay

### Tournament System

- **Single Elimination**: Bracket-style tournaments
- **Round Robin**: Everyone plays everyone
- **Custom Rules**: Configurable tournament settings
- **Prize System**: Virtual rewards for winners

## Architecture

### System Design

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (HTML/JS)     │◄──►│   (Django)      │◄──►│ (PostgreSQL)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│     Redis       │◄─────────────┘
                        │ (WebSocket/Cache)│
                        └─────────────────┘
```

### Key Components

- **Game Engine**: JavaScript-based Pong game logic
- **WebSocket Handler**: Real-time communication management
- **User Manager**: Authentication and profile management
- **Tournament Manager**: Tournament creation and management
- **Chat System**: Real-time messaging infrastructure
- **Statistics Tracker**: Game data collection and analysis

## Security

### Security Measures

- **HTTPS Only**: All communication encrypted with SSL/TLS
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt password hashing
- **CSRF Protection**: Cross-site request forgery protection
- **SQL Injection Prevention**: Django ORM parameterized queries
- **XSS Protection**: Input sanitization and Content Security Policy
- **Rate Limiting**: API and WebSocket rate limiting
- **2FA Support**: Time-based One-Time Password (TOTP)

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/transcendence

# Security
SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here

# OAuth
OAUTH_42_CLIENT_ID=your-42-client-id
OAUTH_42_CLIENT_SECRET=your-42-client-secret

# Redis
REDIS_URL=redis://localhost:6379

# Email (for 2FA)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

## API Documentation

### Authentication Endpoints

```bash
POST /api/auth/register/     # User registration
POST /api/auth/login/        # User login
POST /api/auth/logout/       # User logout
POST /api/auth/refresh/      # JWT token refresh
GET  /api/auth/profile/      # Get user profile
PUT  /api/auth/profile/      # Update user profile
```

### Game Endpoints

```bash
GET  /api/games/             # List all games
POST /api/games/create/      # Create new game
GET  /api/games/{id}/        # Get game details
POST /api/games/{id}/join/   # Join game
POST /api/games/{id}/leave/  # Leave game
GET  /api/games/history/     # User game history
```

### Tournament Endpoints

```bash
GET  /api/tournaments/           # List tournaments
POST /api/tournaments/create/    # Create tournament
GET  /api/tournaments/{id}/      # Tournament details
POST /api/tournaments/{id}/join/ # Join tournament
GET  /api/tournaments/{id}/bracket/ # Tournament bracket
```

### WebSocket Events

```javascript
// Game events
'game.start'     // Game started
'game.update'    // Game state update
'game.end'       // Game finished
'player.move'    // Player movement
'ball.update'    // Ball position update

// Chat events
'message.send'   // Send message
'message.receive' // Receive message
'user.typing'    // User typing indicator

// Tournament events
'tournament.update' // Tournament state change
'bracket.update'    // Bracket update
```

## Testing

### Running Tests

```bash
# Backend tests
make test-backend

# Frontend tests
make test-frontend

# End-to-end tests
make test-e2e

# All tests
make test
```

### Test Coverage

- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **WebSocket Tests**: Real-time communication testing
- **Game Logic Tests**: Pong game mechanics testing
- **Security Tests**: Authentication and authorization testing

## Deployment

### Production Deployment

1. **Configure production environment:**
```bash
cp .env.production .env
# Update production values
```

2. **Deploy with Docker:**
```bash
make deploy
```

3. **Set up SSL certificate:**
```bash
make ssl-cert
```

4. **Initialize production database:**
```bash
make prod-migrate
```

### Docker Services

- **web**: Django application server
- **nginx**: Reverse proxy and static file serving
- **db**: PostgreSQL database
- **redis**: Cache and WebSocket channel layer
- **worker**: Background task processor

## Project Structure

```
ft_transcendence/
├── docker-compose.yml
├── Makefile
├── README.md
├── .env.example
├── requirements.txt
│
├── backend/
│   ├── transcendence/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── apps/
│   │   ├── authentication/
│   │   ├── game/
│   │   ├── chat/
│   │   ├── tournament/
│   │   └── users/
│   └── static/
│
├── frontend/
│   ├── static/
│   │   ├── js/
│   │   │   ├── game/
│   │   │   ├── auth/
│   │   │   ├── chat/
│   │   │   └── tournament/
│   │   ├── css/
│   │   └── assets/
│   └── templates/
│
├── nginx/
│   ├── nginx.conf
│   └── ssl/
│
└── tests/
    ├── backend/
    ├── frontend/
    └── e2e/
```

## Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and commit: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style

- **Python**: Follow PEP 8 standards
- **JavaScript**: Use ESLint configuration
- **HTML/CSS**: Follow BEM methodology
- **Git**: Use conventional commit messages

### Pre-commit Hooks

```bash
pip install pre-commit
pre-commit install
```

## Authors

- **Youssef Lmkhantar** - *Full-stack Developer* - [MyGithub](https://github.com/ylamkhan)
- **Zineb Saoud** - *Frontend Developer* - [GitHub](https://github.com/Simba2021)
- **Yousra Bouzafour** - *Backend Developer* - [GitHub](https://github.com/ybouzafo)
- **Ibrahim El Harraq** - *DevOps Engineer* - [GitHub](https://github.com/El7arraq)

---

**Project Grade**: ⭐⭐⭐ (125/100)

*This project represents the culmination of the 1337 School web development curriculum, demonstrating mastery of modern web technologies, real-time communication, and full-stack development principles.*

## License

This project is part of the 1337 School curriculum and is intended for educational purposes only.

---

*Made with ❤️ at 1337 School*
