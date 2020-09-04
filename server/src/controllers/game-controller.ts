import { Request, Response } from "express";
import logger from "../logger";
import { Game } from "../game";
import { v4 as uuidv4 } from 'uuid';
import messenger from "../messenger";
import { Participant, GameMessage } from "@ryanroundhouse/liars-dice-interface";

const game: Game = new Game(messenger);

/**
 * Create a game.
 * @route POST /game/create
 */
export function createGame(req: Request, res: Response){
    const userId: string = req.session.userId;
    if (userId === undefined){
        res.status(400).send({message: 'user must log in before creating a game.'});
        logger.log('info', `user tried to create a game before logging in.`);
        return;
    }
    const result = game.createGame(userId, Game.gamePopulation);
    if (!result.ok){
        res.status(400).send(result);
        return;
    }
    else{
        res.send({ result: 'OK', gameId: result });
    }
}

/**
 * Login to get a session id.
 * @route POST /login
 */
export function login(req: Request, res: Response){
    // send error if the user is already logged in
    logger.debug(`session set to ${req.session.userId}`);
    if (req.session.userId != null){
        res.send({status: '200', message: 'already logged in.'});
        return;
    }
    // create set visitor's session
    const id = uuidv4();
    logger.log('info', `Setting session for user ${id}`);
    req.session.userId = id;
    res.send({ result: 'OK', message: `${id}` });
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
        res.send({ result: 'OK', message: 'Session destroyed' });
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

    const result = game.joinGame(userId, gameId, name, Game.gamePopulation);
    if (!result.ok){
        res.status(400).send(result);
        return;
    }
    const participants: Participant[] = result.value;
    res.send({result: 'OK', message: participants});
}

/**
 * Start an existing game.
 * @route POST /game/:gameId/start
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

    const result = game.startGame(userId, gameId, Game.gamePopulation);
    if (!result.ok){
        res.status(400).send(result);
        return;
    }

    res.send(result);
    game.startRound(gameId, Game.gamePopulation);
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
    const result = game.processClaim(gameId, req.session.userId, currentClaim, Game.gamePopulation);
    if (!result.ok){
        res.status(400).send(result);
        return;
    }
    res.send(result);
}