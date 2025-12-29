import { GameState, Player, DiceRoll, RollDiceResponse, HoldResponse } from '../types';
import db from '../db/database';

// Helper functions to convert between DB format and GameState
function dbRowToGameState(row: any): GameState {
  return {
    id: row.id,
    player1: {
      id: row.player1_id,
      userId: row.player1_id.split('-').slice(1).join('-'), // Extract userId from player id
      username: row.player1_username,
    },
    player2: {
      id: row.player2_id,
      userId: row.player2_id.split('-').slice(1).join('-'),
      username: row.player2_username,
    },
    currentPlayerId: row.current_player_id,
    player1Score: row.player1_score,
    player2Score: row.player2_score,
    player1RoundScore: row.player1_round_score,
    player2RoundScore: row.player2_round_score,
    winningScore: row.winning_score,
    status: row.status as 'waiting' | 'active' | 'finished',
    winnerId: row.winner_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function gameStateToDbRow(game: GameState): any {
  return {
    id: game.id,
    player1_id: game.player1.id,
    player1_username: game.player1.username,
    player2_id: game.player2.id,
    player2_username: game.player2.username,
    current_player_id: game.currentPlayerId,
    player1_score: game.player1Score,
    player2_score: game.player2Score,
    player1_round_score: game.player1RoundScore,
    player2_round_score: game.player2RoundScore,
    winning_score: game.winningScore,
    status: game.status,
    winner_id: game.winnerId || null,
    created_at: game.createdAt,
    updated_at: game.updatedAt,
  };
}

export class GameService {
  createGame(
    player1: Player,
    player2: Player,
    winningScore: number = 100
  ): GameState {
    const gameId = `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
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
      createdAt: now,
      updatedAt: now,
    };

    const row = gameStateToDbRow(gameState);
    const insert = db.prepare(`
      INSERT INTO games (
        id, player1_id, player1_username, player2_id, player2_username,
        current_player_id, player1_score, player2_score,
        player1_round_score, player2_round_score, winning_score,
        status, winner_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insert.run(
      row.id,
      row.player1_id,
      row.player1_username,
      row.player2_id,
      row.player2_username,
      row.current_player_id,
      row.player1_score,
      row.player2_score,
      row.player1_round_score,
      row.player2_round_score,
      row.winning_score,
      row.status,
      row.winner_id,
      row.created_at,
      row.updated_at
    );

    return gameState;
  }

  getGame(gameId: string): GameState | undefined {
    const row = db
      .prepare('SELECT * FROM games WHERE id = ?')
      .get(gameId) as any;

    if (!row) {
      return undefined;
    }

    // Extract userId from player ID (format: player-{userId})
    const player1UserId = row.player1_id.startsWith('player-') 
      ? row.player1_id.replace('player-', '') 
      : row.player1_id;
    const player2UserId = row.player2_id.startsWith('player-')
      ? row.player2_id.replace('player-', '')
      : row.player2_id;

    const game: GameState = {
      id: row.id,
      player1: {
        id: row.player1_id.startsWith('player-') ? row.player1_id : `player-${row.player1_id}`,
        userId: player1UserId,
        username: row.player1_username,
      },
      player2: {
        id: row.player2_id.startsWith('player-') ? row.player2_id : `player-${row.player2_id}`,
        userId: player2UserId,
        username: row.player2_username,
      },
      currentPlayerId: row.current_player_id,
      player1Score: row.player1_score,
      player2Score: row.player2_score,
      player1RoundScore: row.player1_round_score,
      player2RoundScore: row.player2_round_score,
      winningScore: row.winning_score,
      status: row.status as 'waiting' | 'active' | 'finished',
      winnerId: row.winner_id || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return game;
  }

  getAllGames(): GameState[] {
    const rows = db.prepare('SELECT * FROM games').all() as any[];
    return rows.map((row) => {
      const player1UserId = row.player1_id.startsWith('player-') 
        ? row.player1_id.replace('player-', '') 
        : row.player1_id;
      const player2UserId = row.player2_id.startsWith('player-')
        ? row.player2_id.replace('player-', '')
        : row.player2_id;

      return {
        id: row.id,
        player1: {
          id: row.player1_id.startsWith('player-') ? row.player1_id : `player-${row.player1_id}`,
          userId: player1UserId,
          username: row.player1_username,
        },
        player2: {
          id: row.player2_id.startsWith('player-') ? row.player2_id : `player-${row.player2_id}`,
          userId: player2UserId,
          username: row.player2_username,
        },
        currentPlayerId: row.current_player_id,
        player1Score: row.player1_score,
        player2Score: row.player2_score,
        player1RoundScore: row.player1_round_score,
        player2RoundScore: row.player2_round_score,
        winningScore: row.winning_score,
        status: row.status as 'waiting' | 'active' | 'finished',
        winnerId: row.winner_id || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
  }

  getUserGames(userId: string): GameState[] {
    // Search for games where userId matches either player (with or without 'player-' prefix)
    const rows = db
      .prepare(`
        SELECT * FROM games 
        WHERE player1_id = ? OR player1_id = ? OR player2_id = ? OR player2_id = ?
      `)
      .all(userId, `player-${userId}`, userId, `player-${userId}`) as any[];

    return rows.map((row) => {
      const player1UserId = row.player1_id.startsWith('player-') 
        ? row.player1_id.replace('player-', '') 
        : row.player1_id;
      const player2UserId = row.player2_id.startsWith('player-')
        ? row.player2_id.replace('player-', '')
        : row.player2_id;

      return {
        id: row.id,
        player1: {
          id: row.player1_id.startsWith('player-') ? row.player1_id : `player-${row.player1_id}`,
          userId: player1UserId,
          username: row.player1_username,
        },
        player2: {
          id: row.player2_id.startsWith('player-') ? row.player2_id : `player-${row.player2_id}`,
          userId: player2UserId,
          username: row.player2_username,
        },
        currentPlayerId: row.current_player_id,
        player1Score: row.player1_score,
        player2Score: row.player2_score,
        player1RoundScore: row.player1_round_score,
        player2RoundScore: row.player2_round_score,
        winningScore: row.winning_score,
        status: row.status as 'waiting' | 'active' | 'finished',
        winnerId: row.winner_id || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
  }

  private updateGame(game: GameState): void {
    const row = gameStateToDbRow(game);
    const update = db.prepare(`
      UPDATE games SET
        current_player_id = ?,
        player1_score = ?,
        player2_score = ?,
        player1_round_score = ?,
        player2_round_score = ?,
        winning_score = ?,
        status = ?,
        winner_id = ?,
        updated_at = ?
      WHERE id = ?
    `);

    update.run(
      row.current_player_id,
      row.player1_score,
      row.player2_score,
      row.player1_round_score,
      row.player2_round_score,
      row.winning_score,
      row.status,
      row.winner_id,
      row.updated_at,
      row.id
    );
  }

  rollDice(gameId: string, userId: string): RollDiceResponse {
    const game = this.getGame(gameId);
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
    this.updateGame(game);

    return {
      dice,
      roundScore,
      isDoubleSix,
      gameState: { ...game },
    };
  }

  hold(gameId: string, userId: string): HoldResponse {
    const game = this.getGame(gameId);
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
    this.updateGame(game);

    return {
      gameState: { ...game },
      isGameOver,
      winnerId,
    };
  }

  newGame(gameId: string, userId: string, winningScore?: number): GameState {
    const game = this.getGame(gameId);
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
    this.updateGame(game);

    return { ...game };
  }

  deleteGame(gameId: string): boolean {
    const result = db.prepare('DELETE FROM games WHERE id = ?').run(gameId);
    return result.changes > 0;
  }
}

// Singleton instance
export const gameService = new GameService();
