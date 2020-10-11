import { Request, Response } from "express";
import gamePopulation from "../service/game-population";
import logger from "../logger";
import player from "../service/player-service";

/**
 * Update a player.
 * @route PUT /player/:playerId
 */
export function updatePlayer(req: Request, res: Response){
    const userId: string = req.session.userId;
    logger.debug(`session set to ${req.session.userId}`);
    if (userId === undefined){
        res.status(400).send({message: 'user must log in before creating a game.'});
        logger.log('info', `user tried to create a game before logging in.`);
        return;
    }
    const name = req.params.name;
    const gameId = req.params.gameId;
    const result = player.updatePlayer(userId, gameId, name, gamePopulation);
    if (!result.ok){
        res.status(400).send(result);
        return;
    }
    res.send(result);
}