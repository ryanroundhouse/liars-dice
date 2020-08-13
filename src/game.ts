import { GameInterface } from "./interfaces/game-interface";
import { Result } from "./types/result";
import { v4 as uuidv4 } from 'uuid';
import winston from "winston";
import { Participant } from "./interfaces/participant";
import { MessageType } from "./enums/messageType";
import { RoundSetup } from "./interfaces/round-setup";
import { RoundResults } from "./interfaces/round-results";
import { GameMessage } from "./interfaces/game-message";
import WebSocket from "ws";
import { ErrorMessage } from "./enums/errorMessage";

export class Game{
    logger: winston.Logger;
    wsConnections = new Map<string, WebSocket>();
    gamePopulation = new Map<string, GameInterface>();

    constructor(logger: winston.Logger){
        // this.logger = logger || winston.createLogger();
    }

    createGame(userId:string, gamePopulation: Map<string, GameInterface>): Result<string>{
        if (!userId){
            return { ok: false, message: ErrorMessage.NoUserIDProvided };
        }
        if (!gamePopulation){
            return { ok: false, message: ErrorMessage.NoGamePopulationProvided };
        }
        let alreadyInGame = false;
        gamePopulation.forEach((selectedGame: GameInterface) => {
            if (typeof selectedGame.participants.find(selectedParticipant => selectedParticipant.userId === userId) !== "undefined"){
                if (!selectedGame.finished){
                    alreadyInGame = true;
                }
            }
        });
        if (alreadyInGame){
            return {ok: false, message: ErrorMessage.CantCreateNewGameWhenInGame};
        }
        this.logger?.log('info', `got game create from ${userId}`);
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
            return { ok: false, message: ErrorMessage.NoUserIDProvided };
        }
        if (!gamePopulation){
            return { ok: false, message: ErrorMessage.NoGamePopulationProvided };
        }
        if (!gameId){
            return { ok: false, message: ErrorMessage.NoGameIDProvided };
        }
        if (!name){
            return { ok: false, message: ErrorMessage.NoNameProvided };
        }
        const existingGame = gamePopulation.get(gameId);
        if (!existingGame){
            return { ok: false, message: ErrorMessage.GameNotFound };
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
            return {ok: false, message: ErrorMessage.CantJoinGameWhenInRunningGame };
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
            return { ok: false, message: ErrorMessage.NoUserIDProvided };
        }
        if (!gamePopulation){
            return { ok: false, message: ErrorMessage.NoGamePopulationProvided };
        }
        if (!gameId){
            return { ok: false, message: ErrorMessage.NoGameIDProvided };
        }
        const existingGame = gamePopulation.get(gameId);
        // does the game exist?
        if (existingGame == null){
            return { ok: false, message: ErrorMessage.GameNotFound };
        }
        if (existingGame.started){
            return { ok: false, message: ErrorMessage.GameAlreadyStarted };
        }
        let inGame = false;
        if (existingGame.participants.find(selectedParticipant => selectedParticipant.userId === userId)){
            inGame = true;
        }
        if (!inGame){
            return {ok: false, message: ErrorMessage.MustBeInGameToStartGame };
        }
        if (existingGame.participants.length <= 1){
            return {ok: false, message: ErrorMessage.MustHaveTwoOrMorePlayers };
        }

        existingGame.started = true;
        return { ok: true, value: gameId };
    }

    calculateStartingPlayer(game: GameInterface): Result<Participant>{
        if (!game){
            return {ok:false, message: ErrorMessage.NoGameSpecified };
        }
        if (game.gameMessageLog.length === 0){
            return {ok:false, message: ErrorMessage.NoGameMessagesFound };
        }
        if (!game.started){
            return {ok:false, message: ErrorMessage.GameNotStarted };
        }
        if (game.finished){
            return {ok:false, message: ErrorMessage.GameAlreadyFinished };
        }
        let startingPlayer: Participant;
        const lastPlayEvent = game.gameMessageLog[game.gameMessageLog.length - 1];
        // randomize starting player if start of game
        if (lastPlayEvent.messageType === MessageType.GameStarted){
            startingPlayer = game.participants[Game.getRandomInt(game.participants.length-1)];
            this.logger?.info(`new game, rolling for starting player, got ${startingPlayer.userId}`);
        }
        // whoever goofed up is the new starting player
        else if (lastPlayEvent.messageType === MessageType.RoundResults){
            this.logger?.info(`checking lastPlayEvent: ${JSON.stringify(lastPlayEvent)}`);
            const roundResults = (lastPlayEvent.message as RoundResults);
            if (roundResults.claimSuccess){
                startingPlayer = roundResults.calledPlayer;
            }
            else{
                startingPlayer = roundResults.callingPlayer;
            }
        }
        else{
            return {ok:false, message: ErrorMessage.UnableToDetermineStartingPlayer };
        }
        return {ok:true, value: startingPlayer};
    }

    generateDiceAndNotifyGameMessage(gameId: string, startingPlayer: Participant, messageType: MessageType, gamePopulation: Map<string, GameInterface>, wsConnections: Map<string, WebSocket>): Result<string>{
        if (!gameId){
            return { ok: false, message: ErrorMessage.NoGameIDProvided };
        }
        if (!startingPlayer){
            return { ok: false, message: ErrorMessage.NoStartingPlayerProvided };
        }
        if (!messageType){
            return { ok: false, message: ErrorMessage.NoMessageTypeProvided };
        }
        if (!gamePopulation){
            return { ok: false, message: ErrorMessage.NoGamePopulationProvided };
        }
        if (!wsConnections){
            return { ok: false, message: ErrorMessage.NoConnectionListProvided };
        }
        const existingGame = gamePopulation.get(gameId);
        if (existingGame == null){
            return { ok: false, message: ErrorMessage.GameNotFound };
        }
        // send everyone's starting info
        existingGame.participants.forEach(participant => {
            participant.roll = [];
            for (let i = 0; i < participant.numberOfDice; i++){
                participant.roll.push(Game.getRandomInt(6) + 1);
            }
            let starting = false;
            if (participant.userId === startingPlayer.userId){
                starting = true;
            }
            const roundSetup: RoundSetup = {
                participant,
                startingPlayer: starting
            }
            this.sendGameMessageToOne(gameId, participant.userId, MessageType.RoundStarted, roundSetup, gamePopulation, wsConnections);
        });
        return { ok: true, message: "messages sent" };
    }
    
    startRound(gameId: string, gamePopulation: Map<string, GameInterface>, wsConnections: Map<string, WebSocket>): Result<string>{
        if (!gamePopulation){
            return { ok: false, message: ErrorMessage.NoGamePopulationProvided };
        }
        if (!gameId){
            return { ok: false, message: ErrorMessage.NoGameIDProvided };
        }
        if (!wsConnections){
            return { ok: false, message: ErrorMessage.NoConnectionListProvided };
        }
        const existingGame = gamePopulation.get(gameId);
        if (existingGame == null){
            return { ok: false, message: ErrorMessage.GameNotFound };
        }

        const calcStartingPlayerResult: Result<Participant> = this.calculateStartingPlayer(existingGame);
        if (!calcStartingPlayerResult.ok){
            return {ok: false, message: calcStartingPlayerResult.message};
        }

        const generateDiceAndNotifyResult: Result<string> = this.generateDiceAndNotifyGameMessage(gameId, calcStartingPlayerResult.value, MessageType.RoundStarted, gamePopulation, wsConnections);
        if (!generateDiceAndNotifyResult.ok){
            return {ok: false, message: generateDiceAndNotifyResult.message};
        }
        return { ok: true, value: "round started." };
    }

    sendGameMessageToOne(gameId: string, participantId: string, messageType: MessageType, message: any, gamePopulation: Map<string, GameInterface>, wsConnections: Map<string, WebSocket>): Result<string>{
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
        if (!wsConnections){
            return {ok: false, message: ErrorMessage.NoConnectionListProvided};
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
        const wsConnection = wsConnections.get(participantId);
        if (!wsConnection){
            return {ok: false, message: ErrorMessage.ParticipantNotInConnectionList};
        }
        wsConnection.send(JSON.stringify(gameMessage));
        return {ok: true, value: "message sent."};
    }

    static getRandomInt(max: number) {
      return Math.floor(Math.random() * Math.floor(max));
    }
}