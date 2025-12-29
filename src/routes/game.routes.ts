import { Router } from 'express';
import {
  createGame,
  getGame,
  getMyGames,
  rollDice,
  hold,
  newGame,
  endGame,
  deleteGame,
} from '../controllers/game.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All game routes require authentication
router.use(authenticate);

router.post('/', createGame);
router.get('/my-games', getMyGames);
router.delete('/:gameId', deleteGame);
router.get('/:gameId', getGame);
router.post('/:gameId/roll', rollDice);
router.post('/:gameId/hold', hold);
router.post('/:gameId/new-game', newGame);
router.post('/:gameId/end', endGame);

export default router;

