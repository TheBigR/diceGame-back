import { GameState, Player, DiceRoll, RollDiceResponse, HoldResponse } from '../types';

export class GameService {
  private games: Map<string, GameState> = new Map();

  createGame(
    player1: Player,
    player2: Player,
    winningScore: number = 100
  ): GameState {
    const gameId = `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const gameState: GameState = {
      id: gameId,
      player1,
      player2,
      currentPlayerId: player1.id,
      player1Score: 0,
      player2Score: 0,
      player1RoundScore: 0,
      player2RoundScore: 0,
      winningScore,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.games.set(gameId, gameState);
    return gameState;
  }

  getGame(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  getAllGames(): GameState[] {
    return Array.from(this.games.values());
  }

  getUserGames(userId: string): GameState[] {
    return Array.from(this.games.values()).filter(
      game => game.player1.userId === userId || game.player2.userId === userId
    );
  }

  rollDice(gameId: string, userId: string): RollDiceResponse {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.status !== 'active') {
      throw new Error('Game is not active');
    }

    // Validate it's the current player's turn
    const currentPlayer = game.currentPlayerId === game.player1.id ? game.player1 : game.player2;
    if (currentPlayer.userId !== userId) {
      throw new Error('Not your turn');
    }

    // Roll two dice
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const dice: DiceRoll = { die1, die2, timestamp: Date.now() };

    const isDoubleSix = die1 === 6 && die2 === 6;
    let roundScore = die1 + die2;

    if (isDoubleSix) {
      // Reset round score and pass turn
      if (game.currentPlayerId === game.player1.id) {
        game.player1RoundScore = 0;
        game.currentPlayerId = game.player2.id;
      } else {
        game.player2RoundScore = 0;
        game.currentPlayerId = game.player1.id;
      }
    } else {
      // Add to round score
      if (game.currentPlayerId === game.player1.id) {
        game.player1RoundScore += roundScore;
        roundScore = game.player1RoundScore;
      } else {
        game.player2RoundScore += roundScore;
        roundScore = game.player2RoundScore;
      }
    }

    game.updatedAt = Date.now();
    this.games.set(gameId, game);

    return {
      dice,
      roundScore,
      isDoubleSix,
      gameState: { ...game },
    };
  }

  hold(gameId: string, userId: string): HoldResponse {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.status !== 'active') {
      throw new Error('Game is not active');
    }

    // Validate it's the current player's turn
    const currentPlayer = game.currentPlayerId === game.player1.id ? game.player1 : game.player2;
    if (currentPlayer.userId !== userId) {
      throw new Error('Not your turn');
    }

    // Add round score to global score
    if (game.currentPlayerId === game.player1.id) {
      game.player1Score += game.player1RoundScore;
      game.player1RoundScore = 0;
      game.currentPlayerId = game.player2.id;
    } else {
      game.player2Score += game.player2RoundScore;
      game.player2RoundScore = 0;
      game.currentPlayerId = game.player1.id;
    }

    // Check for winner
    let isGameOver = false;
    let winnerId: string | undefined;

    if (game.player1Score >= game.winningScore) {
      isGameOver = true;
      game.status = 'finished';
      game.winnerId = game.player1.id;
      winnerId = game.player1.userId;
    } else if (game.player2Score >= game.winningScore) {
      isGameOver = true;
      game.status = 'finished';
      game.winnerId = game.player2.id;
      winnerId = game.player2.userId;
    }

    game.updatedAt = Date.now();
    this.games.set(gameId, game);

    return {
      gameState: { ...game },
      isGameOver,
      winnerId,
    };
  }

  newGame(gameId: string, userId: string, winningScore?: number): GameState {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    // Verify user is part of the game
    if (game.player1.userId !== userId && game.player2.userId !== userId) {
      throw new Error('You are not part of this game');
    }

    // Reset game state
    game.currentPlayerId = game.player1.id;
    game.player1Score = 0;
    game.player2Score = 0;
    game.player1RoundScore = 0;
    game.player2RoundScore = 0;
    game.status = 'active';
    game.winnerId = undefined;
    
    if (winningScore !== undefined) {
      game.winningScore = winningScore;
    }

    game.updatedAt = Date.now();
    this.games.set(gameId, game);

    return { ...game };
  }

  deleteGame(gameId: string): boolean {
    return this.games.delete(gameId);
  }
}

// Singleton instance
export const gameService = new GameService();

