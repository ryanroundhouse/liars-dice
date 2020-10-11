import { Request, Response } from "express";
import logger from "../logger";
import { v4 as uuidv4 } from 'uuid';
import messenger from "../messenger";
import { GameMessage, Result } from "@ryanroundhouse/liars-dice-interface";
import game from "../service/game-service";
import gamePopulation from "../service/game-population";

/**
 * Create a game.
 * @route GET /game/create
 */
export function createGame(req: Request, res: Response){
    const userId: string = req.session.userId;
    logger.debug(`session set to ${req.session.userId}`);
    if (userId === undefined){
        res.status(400).send({message: 'user must log in before creating a game.'});
        logger.log('info', `user tried to create a game before logging in.`);
        return;
    }
    const result = game.createGame(userId, gamePopulation);
    if (!result.ok){
        res.status(400).send(result);
        return;
    }
    else{
        res.send(result);
    }
}

/**
 * Login to get a session id.
 * @route GET /login
 */
export function login(req: Request, res: Response){
    // send error if the user is already logged in
    logger.debug(`session set to ${req.session.userId}`);
    if (req.session.userId != null){
        const alreadyLoggedInResult: Result<string> = {
            ok: true,
            value: req.session.userId
        };
        res.send(alreadyLoggedInResult);
        return;
    }
    // create set visitor's session
    const id = uuidv4();
    logger.log('info', `Setting session for user ${id}`);
    req.session.userId = id;
    const newLoginResult: Result<string> = {
        ok: true,
        value: id
    };
    res.send(newLoginResult);
}

/**
 * Logout to destroy your session id.
 * @route DELETE /logout
 */
export function logout(req: Request, res: Response){
    if (req.session.userId === undefined){
        res.status(400).send({result: '400', message: 'you\'re not logged in.'});
        return;
    }
    const ws = messenger.wsConnections.get(req.session.userId);
    logger.log('info', `Destroying session from ${req.session.userId} `);
    req.session.destroy(() => {
        if (ws) {
            ws.close();
        }
        const result: Result<string> = {ok: true, message: 'Session destroyed'};
        res.clearCookie('liars-dice');
        res.send(result);
    });
}

/**
 * Join an existing game.
 * @route POST /game/:gameId/join
 */
export function joinGame(req: Request, res: Response){
    const userId: string = req.session.userId;
    if (userId === undefined){
        res.status(400).send({ result: '400', message: 'user must log in before joining a game.' });
        logger.log('info', `user tried to join a game before logging in.`);
        return;
    }
    const gameId = req.params.gameId;
    const name = req.body.name;

    const result = game.joinGame(userId, gameId, name, gamePopulation);
    if (!result.ok){
        res.status(400).send(result);
        return;
    }
    res.send(result);
}

/**
 * Start an existing game.
 * @route GET /game/:gameId/start
 */
export function startGame(req: Request, res: Response){
    const gameId = req.params.gameId;
    const userId = req.session.userId;
    if (typeof gameId === undefined){
        res.send({ result: '400', message: 'user must log in before starting a game.' });
        logger.log('info', `user tried to start a game ${gameId} before logging in.`);
        return;
    }
    logger.log('info', `got request to start ${gameId} from ${userId}`);

    const result = game.startGame(userId, gameId, gamePopulation);
    if (!result.ok){
        res.status(400).send(result);
        return;
    }

    res.send(result);
    game.startRound(gameId, gamePopulation);
}

/**
 * Get full gamestate.
 * @route GET /game/:gameId/
 */
export function getGameState(req: Request, res: Response){
    const gameId = req.params.gameId;
    const userId = req.session.userId;
    if (typeof gameId === undefined){
        res.send({ result: '400', message: 'user must log in before requesting a gamestate.' });
        logger.log('info', `user tried to get a game state ${gameId} before logging in.`);
        return;
    }
    logger.log('info', `got request for ${gameId} game state from ${userId}`);

    const result = game.getGameState(userId, gameId, gamePopulation);
    if (!result.ok){
        res.status(400).send(result);
        return;
    }

    res.send(result);
}

/**
 * Make a claim.
 * @route POST /game/:gameId/claim
 */
export function claim(req: Request, res: Response){
    const gameId = req.params.gameId;
    if (typeof gameId === undefined){
        res.send({ result: '400', message: 'user must join a game before making a claim.' });
        logger.log('info', `user tried to make a claim in ${gameId} before joining it.`);
        return;
    }
    const currentClaim: GameMessage = req.body;
    const result = game.processClaim(gameId, req.session.userId, currentClaim, gamePopulation);
    if (!result.ok){
        res.status(400).send(result);
        return;
    }
    res.send(result);
}