import { GameInterface, MessageType, NameChange } from "@ryanroundhouse/liars-dice-interface";
import { ErrorMessage } from "./enums/errorMessage";
import { Messenger } from "./messenger";

export class Player{
    // need this to be the singleton messenger!
    constructor(private messenger: Messenger){}

    updatePlayer(userId: string, gameId: string, name: string, gamePopulation: Map<string, GameInterface>){
        if (!userId){
            return { ok: false, message: ErrorMessage.NoUserIDProvided };
        }
        if (!gamePopulation){
            return { ok: false, message: ErrorMessage.NoGamePopulationProvided };
        }
        if (!gameId){
            return {ok: false, message: ErrorMessage.NoGameIDProvided};
        }
        if (!name){
            return {ok: false, message: ErrorMessage.NoNameProvided};
        }

        const game = gamePopulation.get(gameId);
        if (!game){
            return {ok: false, message: ErrorMessage.GameNotFound};
        }
        if (game.started){
            return {ok: false, message: ErrorMessage.GameAlreadyStarted};
        }
        const player = game.participants.find(participant => participant.userId === userId);
        if (!player){
            return {ok: false, message: ErrorMessage.PlayerNotFound};
        }
        player.name = name;

        const nameChange: NameChange = {
            playerId: userId,
            name
        }
        const result = this.messenger.sendGameMessageToAll(gameId, MessageType.NameChangeMessage, nameChange, gamePopulation);
        if (!result.ok){
            return result;
        }
        return {ok: true};
    }
}