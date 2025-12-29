import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { gameService } from '../services/game.service';
import { userService } from '../services/user.service';
import { CreateGameRequest } from '../types';

export const createGame = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { player1Username, player2Username, winningScore = 100 }: CreateGameRequest = req.body;

    if (!player1Username || !player2Username) {
      res.status(400).json({ error: 'Both player usernames are required' });
      return;
    }

    if (winningScore <= 0) {
      res.status(400).json({ error: 'Winning score must be greater than 0' });
      return;
    }

    // Get or create users
    let player1User = userService.getUserByUsername(player1Username);
    if (!player1User) {
      player1User = await userService.createUser(player1Username, 'default-password');
    }

    let player2User = userService.getUserByUsername(player2Username);
    if (!player2User) {
      player2User = await userService.createUser(player2Username, 'default-password');
    }

    // Verify authenticated user is one of the players
    if (player1User.id !== req.user.userId && player2User.id !== req.user.userId) {
      res.status(403).json({ error: 'You must be one of the players' });
      return;
    }

    const game = gameService.createGame(
      {
        id: `player-${player1User.id}`,
        userId: player1User.id,
        username: player1User.username,
      },
      {
        id: `player-${player2User.id}`,
        userId: player2User.id,
        username: player2User.username,
      },
      winningScore
    );

    res.status(201).json(game);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getGame = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { gameId } = req.params;
    const game = gameService.getGame(gameId);

    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    // Verify user is part of the game
    if (game.player1.userId !== req.user.userId && game.player2.userId !== req.user.userId) {
      res.status(403).json({ error: 'You are not part of this game' });
      return;
    }

    res.json(game);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyGames = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const games = gameService.getUserGames(req.user.userId);
    res.json(games);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const rollDice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { gameId } = req.params;
    const result = gameService.rollDice(gameId, req.user.userId);

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const hold = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { gameId } = req.params;
    const result = gameService.hold(gameId, req.user.userId);

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const newGame = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { gameId } = req.params;
    const { winningScore } = req.body;

    const game = gameService.newGame(gameId, req.user.userId, winningScore);
    res.json(game);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const endGame = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { gameId } = req.params;
    const game = gameService.endGame(gameId, req.user.userId);

    res.json(game);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteGame = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { gameId } = req.params;
    const game = gameService.getGame(gameId);

    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    // Verify user is part of the game
    if (game.player1.userId !== req.user.userId && game.player2.userId !== req.user.userId) {
      res.status(403).json({ error: 'You are not part of this game' });
      return;
    }

    const deleted = gameService.deleteGame(gameId);
    if (deleted) {
      res.status(200).json({ message: 'Game deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete game' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

