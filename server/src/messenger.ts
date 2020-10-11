import { ErrorMessage } from "./enums/errorMessage";
import WebSocket from "ws";
import logger from "./logger";
import { GameInterface, GameMessage, MessageType, Participant, Result } from "@ryanroundhouse/liars-dice-interface";

export class Messenger{
    wsConnections = new Map<string, WebSocket>();

    sendGameMessageToAll(gameId: string, messageType: MessageType, message: any, gamePopulation: Map<string, GameInterface>): Result<string>{
        if (!gameId){
            return {ok: false, message: ErrorMessage.NoGameIDProvided};
        }
        if (!Object.values(MessageType).includes(messageType)){
            return {ok: false, message: ErrorMessage.NoMessageTypeProvided};
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
        logger.debug(`sending gameMessage to all: ${JSON.stringify(gameMessage)}`);
        existingGame.gameMessageLog.push(gameMessage);
        let numberOfRecipients: number = 0;
        existingGame.participants.forEach((participant: Participant) => {
            const participantConnection = this.wsConnections.get(participant.userId);
            if (participantConnection){
                numberOfRecipients++;
                participantConnection.send(JSON.stringify(gameMessage));
            }
            else{
                logger.error(`no connection found to send gameMessage to ${participant.userId}`);
            }
        });
        return {ok: true, message: `message sent to ${numberOfRecipients} recipients`};
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