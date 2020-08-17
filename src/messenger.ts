import { ErrorMessage } from "./enums/errorMessage";
import { Participant } from "./interfaces/participant";
import { MessageType } from "./enums/messageType";
import { Game } from "./game";
import WebSocket from "ws";
import { GameMessage } from "./interfaces/game-message";
import { GameInterface } from "./interfaces/game-interface";
import { Result } from "./types/result";
import logger from "./logger";

export class Messenger{
    wsConnections = new Map<string, WebSocket>();

    sendGameMessageToAll(gameId: string, messageType: MessageType, message: any){
        const existingGame = Game.gamePopulation.get(gameId);
        const gameMessage: GameMessage = {
            messageType,
            message
        }
        logger.debug(`sending gameMessage: ${JSON.stringify(gameMessage)}`);
        existingGame.gameMessageLog.push(gameMessage);
        existingGame.participants.forEach((participant: Participant) => {
            const participantConnection = this.wsConnections.get(participant.userId);
            if (participantConnection){
                this.wsConnections.get(participant.userId).send(JSON.stringify(gameMessage));
            }
            else{
                logger.error(`no connection found to send gameMessage to ${participant.userId}`);
            }
        });
    }

    sendGameMessageToOne(gameId: string, participantId: string, messageType: MessageType, message: any, gamePopulation: Map<string, GameInterface>): Result<string>{
        if (!gameId){
            return {ok: false, message: ErrorMessage.NoGameIDProvided};
        }
        if (!participantId){
            return {ok: false, message: ErrorMessage.NoParticipantProvided};
        }
        if (!messageType){
            return {ok: false, message: ErrorMessage.NoMessageTypeProvided};
        }
        if (!message){
            return {ok: false, message: ErrorMessage.NoMessageProvided};
        }
        if (!gamePopulation){
            return {ok: false, message: ErrorMessage.NoGamePopulationProvided};
        }
        const existingGame = gamePopulation.get(gameId);
        if (!existingGame){
            return {ok: false, message: ErrorMessage.GameNotFound};
        }
        const gameMessage: GameMessage = {
            messageType,
            message
        }
        existingGame.gameMessageLog.push(gameMessage);
        const wsConnection = this.wsConnections.get(participantId);
        if (!wsConnection){
            return {ok: false, message: ErrorMessage.ParticipantNotInConnectionList};
        }
        wsConnection.send(JSON.stringify(gameMessage));
        return {ok: true, value: "message sent."};
    }
}

export default new Messenger();