import { GameInterface } from "./interfaces/game-interface";
import { Result } from "./types/result";
import { v4 as uuidv4 } from 'uuid';
import winston from "winston";
import { Participant } from "./interfaces/participant";

export class Game{
    logger: winston.Logger;

    constructor(logger: winston.Logger){
        // this.logger = logger || winston.createLogger();
    }

    createGame(creator:string, gamePopulation: Map<string, GameInterface>): Result<string>{
        if (!creator){
            return { ok: false, message: "no creator provided" };
        }
        if (!gamePopulation){
            return { ok: false, message: "no gamePopulation provided" };
        }
        let alreadyInGame = false;
        gamePopulation.forEach((selectedGame: GameInterface) => {
            if (typeof selectedGame.participants.find(selectedParticipant => selectedParticipant.userId === creator) !== "undefined"){
                if (!selectedGame.finished){
                    alreadyInGame = true;
                }
            }
        });
        if (alreadyInGame){
            return {ok: false, message: "player can't start a new game when already in a game."};
        }
        this.logger?.log('info', `got game create from ${creator}`);
        const id = uuidv4();
        this.logger?.log('info', `gameId is ${id}`);
        const game: GameInterface = {
            started: false,
            finished: false,
            participants: [],
            gameMessageLog: []
        }
        gamePopulation.set(id, game);

        return {ok: true, value: id};
    }

    joinGame(userId: string, gameId: string, name: string, gamePopulation: Map<string, GameInterface>): Result<Participant[]>{
        if (!userId){
            return { ok: false, message: "no userId provided" };
        }
        if (!gamePopulation){
            return { ok: false, message: "no gamePopulation provided" };
        }
        if (!gameId){
            return { ok: false, message: "no gameId provided" };
        }
        if (!name){
            return { ok: false, message: "no name provided" };
        }
        const existingGame = gamePopulation.get(gameId);
        if (!existingGame){
            return { ok: false, message: "game not found" };
        }
        let alreadyInGame = false;
        gamePopulation.forEach((selectedGame: GameInterface) => {
            if (typeof selectedGame.participants.find(selectedParticipant => selectedParticipant.userId === userId && selectedParticipant.eliminated == false) !== "undefined"){
                if (!selectedGame.finished){
                    alreadyInGame = true;
                }
            }
        });
        if (alreadyInGame){
            return {ok: false, message: "player can't join a new game when already in a running game."};
        }
        const participant: Participant = {
            userId,
            name,
            numberOfDice: 5,
            roll: [],
            eliminated: false
        };
        existingGame.participants.push(participant);
        return {ok: true, value: existingGame.participants};
    }

    startGame(userId: string, gameId: string, gamePopulation: Map<string, GameInterface>): Result<string>{
        if (!userId){
            return { ok: false, message: "no userId provided" };
        }
        if (!gamePopulation){
            return { ok: false, message: "no gamePopulation provided" };
        }
        if (!gameId){
            return { ok: false, message: "no gameId provided" };
        }
        const existingGame = gamePopulation.get(gameId);
        // does the game exist?
        if (existingGame == null){
            return { ok: false, message: "game does not exist." };
        }
        if (existingGame.started){
            return { ok: false, message: "game already started." };
        }
        let inGame = false;
        if (existingGame.participants.find(selectedParticipant => selectedParticipant.userId === userId)){
            inGame = true;
        }
        if (!inGame){
            return {ok: false, message: "you must be in the game to start the game."};
        }

        existingGame.started = true;
        return { ok: true, value: gameId };
    }
}