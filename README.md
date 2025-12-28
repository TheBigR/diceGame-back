# Dice Game Backend API

A Node.js/TypeScript backend API for a two-player dice game with authentication.

## Features

- **Authentication**: JWT-based authentication system
- **Game Management**: Create, manage, and play dice games
- **Game Rules Enforcement**: All game logic enforced on the backend
- **State Management**: Complete game state management

## Game Rules

- 2 players play in rounds
- On a turn, a player rolls 2 dice as many times as they want
- Each roll adds to the round score
- If the player rolls 6 & 6, the round score is lost and the turn passes
- A player can Hold: the round score is added to the global score and the turn passes
- The first player to reach the winning score wins
- Players can set the winning score (default: 100)
- A player can start a new game at any time

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (copy from `.env.example`):
```
PORT=3000
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
```

3. Build the project:
```bash
npm run build
```

4. Run the server:
```bash
npm start
```

Or run in development mode with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
  - Body: `{ "username": "string", "password": "string" }`
  - Returns: `{ "token": "string", "user": { "id": "string", "username": "string" } }`

- `POST /api/auth/login` - Login
  - Body: `{ "username": "string", "password": "string" }`
  - Returns: `{ "token": "string", "user": { "id": "string", "username": "string" } }`

- `GET /api/auth/me` - Get current user (requires authentication)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ "id": "string", "username": "string" }`

### Games

All game endpoints require authentication (Bearer token in Authorization header).

- `POST /api/games` - Create a new game
  - Body: `{ "player1Username": "string", "player2Username": "string", "winningScore": number (optional, default: 100) }`
  - Returns: Game state object

- `GET /api/games/my-games` - Get all games for the authenticated user
  - Returns: Array of game state objects

- `GET /api/games/:gameId` - Get a specific game
  - Returns: Game state object

- `POST /api/games/:gameId/roll` - Roll the dice
  - Returns: `{ "dice": { "die1": number, "die2": number, "timestamp": number }, "roundScore": number, "isDoubleSix": boolean, "gameState": GameState }`

- `POST /api/games/:gameId/hold` - Hold and pass turn
  - Returns: `{ "gameState": GameState, "isGameOver": boolean, "winnerId": "string" (optional) }`

- `POST /api/games/:gameId/new-game` - Start a new game (reset current game)
  - Body: `{ "winningScore": number (optional) }`
  - Returns: Game state object

## Game State Structure

```typescript
{
  id: string;
  player1: { id: string, userId: string, username: string };
  player2: { id: string, userId: string, username: string };
  currentPlayerId: string;
  player1Score: number;
  player2Score: number;
  player1RoundScore: number;
  player2RoundScore: number;
  winningScore: number;
  status: 'waiting' | 'active' | 'finished';
  winnerId?: string;
  createdAt: number;
  updatedAt: number;
}
```

## Development

- Type checking: `npm run type-check`
- Build: `npm run build`
- Dev mode: `npm run dev`

