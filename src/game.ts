import { GameInterface } from "./interfaces/game-interface";
import { Result } from "./types/result";
import { v4 as uuidv4 } from 'uuid';
import winston from "winston";
import { Participant } from "./interfaces/participant";
import { MessageType } from "./enums/messageType";
import { RoundSetup } from "./interfaces/round-setup";
import { RoundResults } from "./interfaces/round-results";
import { GameMessage } from "./interfaces/game-message";
import { ErrorMessage } from "./enums/errorMessage";
import { Claim } from "./interfaces/claim";
import { GameOver } from "./interfaces/game-over";
import { Messenger } from "./messenger";

export class Game{
    static gamePopulation = new Map<string, GameInterface>();

    // need this to be the singleton messenger!
    constructor(private logger: winston.Logger, private messenger: Messenger){}

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

    joinGame(userId: string, gameId: string, name: string, gamePopulation: Map<string, GameInterface>): Result<any>{
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
            if (typeof selectedGame.participants.find(selectedParticipant => selectedParticipant.userId === userId && selectedParticipant.eliminated === false) !== "undefined"){
                if (!selectedGame.finished){
                    alreadyInGame = true;
                }
            }
        });
        if (alreadyInGame){
            return {ok: false, message: ErrorMessage.CantJoinGameWhenInRunningGame };
        }
        this.logger.debug(`${userId} is attempting to join game ${gameId}`);
        const participant: Participant = {
            userId,
            name,
            numberOfDice: 5,
            roll: [],
            eliminated: false
        };
        existingGame.participants.push(participant);
        this.logger.debug(`${gameId}, ${MessageType.PlayerJoined}, ${existingGame.participants[existingGame.participants.length - 1]}, ${gamePopulation}`);
        const result = this.messenger.sendGameMessageToAll(gameId, MessageType.PlayerJoined, existingGame.participants[existingGame.participants.length - 1], gamePopulation);
        if (!result.ok){
            return result;
        }
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
        this.messenger.sendGameMessageToAll(gameId, MessageType.GameStarted, null, gamePopulation);
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

    generateDiceAndNotifyGameMessage(gameId: string, startingPlayer: Participant, messageType: MessageType, gamePopulation: Map<string, GameInterface>): Result<string>{
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
        const existingGame = gamePopulation.get(gameId);
        if (existingGame == null){
            return { ok: false, message: ErrorMessage.GameNotFound };
        }
        // send everyone's starting info
        const resultList: Result<string>[] = [];
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
            resultList.push(this.messenger.sendGameMessageToOne(gameId, participant.userId, MessageType.RoundStarted, roundSetup, gamePopulation));
        });
        if (!resultList.every(result => result.ok)){
            let errorMessages: string = "";
            resultList.filter(result => !result.ok).forEach(result => errorMessages += result.message);
            return {ok: false, message: errorMessages};
        }
        return { ok: true, message: "messages sent" };
    }

    startRound(gameId: string, gamePopulation: Map<string, GameInterface>): Result<string>{
        if (!gamePopulation){
            return { ok: false, message: ErrorMessage.NoGamePopulationProvided };
        }
        if (!gameId){
            return { ok: false, message: ErrorMessage.NoGameIDProvided };
        }
        const existingGame = gamePopulation.get(gameId);
        if (existingGame == null){
            return { ok: false, message: ErrorMessage.GameNotFound };
        }

        const calcStartingPlayerResult: Result<Participant> = this.calculateStartingPlayer(existingGame);
        if (!calcStartingPlayerResult.ok){
            return {ok: false, message: calcStartingPlayerResult.message};
        }

        const generateDiceAndNotifyResult: Result<string> = this.generateDiceAndNotifyGameMessage(gameId, calcStartingPlayerResult.value, MessageType.RoundStarted, gamePopulation);
        if (!generateDiceAndNotifyResult.ok){
            return {ok: false, message: generateDiceAndNotifyResult.message};
        }
        return { ok: true, value: "round started." };
    }

    processClaim(gameId: string, playerId: string, currentClaim: GameMessage, gamePopulation: Map<string, GameInterface>): Result<string> {
        this.logger.log('info', `got request to make a claim ${JSON.stringify(currentClaim)} in ${gameId} from ${playerId}`);
        const existingGame = gamePopulation.get(gameId);
        // does the game exist?
        if (existingGame == null){
            this.logger.log('info', `${playerId} tried to start game ${gameId} that didn't exist.`);
            return {ok: false, message: 'game does not exist.'};
        }
        // is the game not started
        if (!existingGame.started){
            this.logger.log('info', `${playerId} tried to make a claim in ${gameId} but it hasn't started yet.`);
            return {ok: false, message: 'game has\'nt started yet.'};
        }
        const lastMessage = existingGame.gameMessageLog[existingGame.gameMessageLog.length - 1];
        this.logger.debug(`lastMessage was ${JSON.stringify(lastMessage)}`);
        // can't claim if it's not your turn
        if (lastMessage.messageType === MessageType.Claim){
            this.logger.debug(`comparing ${JSON.stringify(lastMessage)} to ${JSON.stringify(currentClaim)} by ${playerId}`);
            if (lastMessage.message.nextPlayerId !== playerId){
                this.logger.log('info', `${playerId} tried to claim in ${gameId} when it's not their turn.`);
                return {ok: false, message: 'it\'s not your turn.'};
            }
            if (!(currentClaim.message as Claim).cheat && (lastMessage.message as Claim).quantity >= currentClaim.message.quantity){
                this.logger.log('info', `${playerId} tried to claim smaller than last claim in ${gameId}.`);
                return {ok: false, message: 'you need to make a claim of larger quantity than the last claim or call cheat.'};
            }
        }
        if (lastMessage.messageType === MessageType.RoundStarted){
            // find the starting player's roundstarted.  It's not always the last one.
            const reverseGameMessageLog = existingGame.gameMessageLog.slice().reverse();
            const startingPlayerMessage = reverseGameMessageLog.find(gameMessage => gameMessage.messageType === MessageType.RoundStarted && (gameMessage.message as RoundSetup).startingPlayer);
            this.logger.debug(`found startingPlayer from: ${JSON.stringify(startingPlayerMessage)}`);
            if ((startingPlayerMessage.message as RoundSetup).participant.userId !== playerId){
                this.logger.log('info', `${playerId} tried to claim in ${gameId} when it's not their turn!`);
                return {ok: false, message: 'it\'s not your turn.'};
            }
        }
        // cheat is called.  Resolve.
        if (currentClaim.message.cheat){
            const result = this.resolveCheat(gameId, playerId, lastMessage, existingGame, gamePopulation);
            if (!result.ok){
                return result;
            }
        }
        // pass it on to the next player.
        else{
            const result = this.resolveClaim(gameId, playerId, currentClaim, existingGame, gamePopulation);
            if (!result.ok){
                return result;
            }
        }
        return {ok: true, message: "claim processed."};
    }

    resolveClaim(gameId: string, playerId: string, currentClaim: GameMessage, existingGame: GameInterface, gamePopulation: Map<string, GameInterface>): Result<string>{
        const activePlayers = existingGame.participants.filter(participant => !participant.eliminated);
        this.logger.debug(`activePlayers: ${JSON.stringify(activePlayers)}`);
        const currentPlayer = activePlayers.find(participant => participant.userId === playerId);
        this.logger.debug(`currentPlayer: ${JSON.stringify(currentPlayer)}`);
        let nextPlayer: Participant;
        if (activePlayers.indexOf(currentPlayer) === activePlayers.length - 1){
            nextPlayer = activePlayers[0];
        }
        else{
            nextPlayer = activePlayers[activePlayers.indexOf(currentPlayer) + 1];
        }
        currentClaim.message.nextPlayerId = nextPlayer.userId;
        currentClaim.message.playerId = playerId;
        this.logger.verbose(`gamePopulation is now:`);
        Game.gamePopulation.forEach((val, key) => this.logger.verbose(`${key}: ${JSON.stringify(val)}`));
        const result = this.messenger.sendGameMessageToAll(gameId, MessageType.Claim, currentClaim.message, gamePopulation);
        return result;
    }

    resolveCheat(gameId: string, playerId: string, lastMessage: GameMessage, existingGame: GameInterface, gamePopulation: Map<string, GameInterface>): Result<string>{
        // can't call cheat with no claims
        if (lastMessage.messageType !== MessageType.Claim){
            this.logger.log('info', `${playerId} tried to call cheat in ${gameId} when there hasn't been a claim.`);
            return {ok: false, message: 'can\'t call cheat if no one has made a claim.'};
        }
        const lastClaim = lastMessage.message as Claim;
        const challengedPlayer = existingGame.participants.find(participant => participant.userId === lastClaim.playerId);
        const numberOfThatRoll = Game.countNumberOfThatRoll(challengedPlayer.roll, lastClaim.value);
        let roundResults: RoundResults;
        if (lastClaim.quantity > numberOfThatRoll){
            this.logger.info('cheat call successful');
            challengedPlayer.numberOfDice--;
            if (challengedPlayer.numberOfDice === 0){
                challengedPlayer.eliminated = true;
            }
            roundResults = {
                callingPlayer: existingGame.participants.find(participant => participant.userId === playerId),
                calledPlayer: challengedPlayer,
                claim: lastClaim,
                claimSuccess: true,
                playerEliminated: challengedPlayer.numberOfDice === 0
            }
        }
        else{
            this.logger.info('cheat call unsuccessful');
            const challenger = existingGame.participants.find(participant => participant.userId === playerId);
            challenger.numberOfDice--;
            if (challenger.numberOfDice === 0){
                challenger.eliminated = true;
            }
            roundResults = {
                callingPlayer: existingGame.participants.find(participant => participant.userId === playerId),
                calledPlayer: challengedPlayer,
                claim: lastClaim,
                claimSuccess: false,
                playerEliminated: challenger.numberOfDice === 0
            }
        }
        this.logger.verbose(`gamePopulation is now:`);
        Game.gamePopulation.forEach((val, key) => this.logger.verbose(`${key}: ${JSON.stringify(val)}`));
        this.messenger.sendGameMessageToAll(gameId, MessageType.RoundResults, roundResults, gamePopulation);
        const activePlayers = existingGame.participants.filter(participant => !participant.eliminated);
        if (activePlayers.length === 1){
            const gameOver: GameOver = {
                winner: activePlayers[0]
            }
            this.messenger.sendGameMessageToAll(gameId, MessageType.GameOver, gameOver, gamePopulation);
            existingGame.finished = true;
        }
        else{
            this.startRound(gameId, Game.gamePopulation);
        }
        return {ok: true};
    }

    static getRandomInt(max: number) {
      return Math.floor(Math.random() * Math.floor(max));
    }

    static countNumberOfThatRoll(roll: number[], value: number){
        let count = 0;
        for(const die of roll){
            if(+die === +value){
                count++;
            }
        }
        return count;
    }
}