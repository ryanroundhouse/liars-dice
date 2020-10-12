import { v4 as uuidv4 } from 'uuid';
import logger from "./logger";
import { GameInterface, Participant, RoundSetup, RoundResults, GameMessage, Claim, GameOver, MessageType, Result } from "@ryanroundhouse/liars-dice-interface"
import { ErrorMessage } from "./enums/errorMessage";
import { Messenger } from './messenger';

export class Game{
    // need this to be the singleton messenger!
    constructor(private messenger: Messenger){}

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
        logger.log('info', `got game create from ${userId}`);
        const id = uuidv4();
        logger.log('info', `gameId is ${id}`);
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
        if (existingGame.started){
            return { ok: false, message: ErrorMessage.GameAlreadyStarted };
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
        logger.debug(`${userId} is attempting to join game ${gameId}`);
        const participant: Participant = {
            userId,
            name,
            numberOfDice: 5,
            roll: [],
            eliminated: false
        };
        const otherPlayers = [...existingGame.participants];
        existingGame.participants.push(participant);
        logger.debug(`${gameId}, ${MessageType.PlayerJoined}, ${participant}, ${gamePopulation}`);
        const result = this.messenger.sendGameMessageToAll(gameId, MessageType.PlayerJoined, participant, gamePopulation);
        if (!result.ok){
            return result;
        }
        return {ok: true, value: otherPlayers};
    }

    getGameState(userId: string, gameId: string, gamePopulation: Map<string, GameInterface>): Result<GameMessage[]>{
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
        let inGame = false;
        if (existingGame.participants.find(selectedParticipant => selectedParticipant.userId === userId)){
            inGame = true;
        }
        if (!inGame){
            return {ok: false, message: ErrorMessage.MustBeInGameToGetGameState };
        }
        return { ok: true, value: existingGame.gameMessageLog };
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

    findGameWithPlayer(playerId: string, gamePopulation: Map<string, GameInterface>): Result<string>{
        if (!playerId){
            return {ok:false, message: ErrorMessage.NoUserIDProvided };
        }
        if (!gamePopulation){
            return {ok:false, message: ErrorMessage.NoGamePopulationProvided };
        }
        let foundGameId: string;
        gamePopulation.forEach((gamePop, gameId) => {
            if (!gamePop.finished && gamePop.participants.find(participant => participant.userId === playerId)){
                foundGameId = gameId;
            }
        });
        const result: Result<string> = {
            ok: true,
            value: foundGameId,
        }
        return result;
    }

    findPlayerName(playerId: string, gamePopulation: Map<string, GameInterface>): Result<string>{
        if (!playerId){
            return {ok:false, message: ErrorMessage.NoUserIDProvided };
        }
        if (!gamePopulation){
            return {ok:false, message: ErrorMessage.NoGamePopulationProvided };
        }
        let foundName: string;
        gamePopulation.forEach((gamePop, gameId) => {
            if (!gamePop.finished && gamePop.participants.find(participant => participant.userId === playerId)){
                const foundPlayer = gamePop.participants.find(participant => participant.userId === playerId);
                if (foundPlayer){
                    foundName = foundPlayer.name;
                }
            }
        });
        const result: Result<string> = {
            ok: true,
            value: foundName,
        }
        return result;
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
            logger.info(`new game, rolling for starting player, got ${startingPlayer.userId}`);
        }
        // whoever goofed up is the new starting player
        else if (lastPlayEvent.messageType === MessageType.RoundResults){
            logger.info(`checking lastPlayEvent: ${JSON.stringify(lastPlayEvent)}`);
            const roundResults = (lastPlayEvent.message as RoundResults);
            if (!roundResults.claimSuccess){
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
            const roundSetup: RoundSetup = {
                participant,
                startingPlayerId: startingPlayer.userId
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
        logger.log('info', `got request to make a claim ${JSON.stringify(currentClaim)} in ${gameId} from ${playerId}`);
        if (!gameId){
            return {ok: false, message: ErrorMessage.NoGameIDProvided};
        }
        if (!playerId){
            return {ok: false, message: ErrorMessage.NoUserIDProvided};
        }
        if (!currentClaim){
            return {ok: false, message: ErrorMessage.NoClaimProvided};
        }
        if (!gamePopulation){
            return {ok: false, message: ErrorMessage.NoGamePopulationProvided};
        }
        const existingGame = gamePopulation.get(gameId);
        // does the game exist?
        if (existingGame == null){
            logger.log('info', `${playerId} tried to start game ${gameId} that didn't exist.`);
            return {ok: false, message: ErrorMessage.GameNotFound};
        }
        // is the game not started
        if (!existingGame.started){
            logger.log('info', `${playerId} tried to make a claim in ${gameId} but it hasn't started yet.`);
            return {ok: false, message: ErrorMessage.GameNotStarted};
        }
        const lastMessage = existingGame.gameMessageLog[existingGame.gameMessageLog.length - 1];
        logger.debug(`lastMessage was ${JSON.stringify(lastMessage)}`);
        // can't claim if it's not your turn
        if (lastMessage.messageType === MessageType.Claim){
            logger.debug(`comparing ${JSON.stringify(lastMessage)} to ${JSON.stringify(currentClaim)} by ${playerId}`);
            if (lastMessage.message.nextPlayerId !== playerId){
                logger.log('info', `${playerId} tried to claim in ${gameId} when it's not their turn.`);
                return {ok: false, message: ErrorMessage.NotYourTurn};
            }
            if (!((currentClaim.message as Claim).cheat || (currentClaim.message as Claim).bangOn) && (lastMessage.message as Claim).quantity >= currentClaim.message.quantity){
                logger.log('info', `${playerId} tried to claim smaller than last claim in ${gameId}.`);
                return {ok: false, message: ErrorMessage.ClaimTooLow};
            }
        }
        if (lastMessage.messageType === MessageType.RoundStarted){
            // find the starting player's roundstarted.  It's not always the last one.
            const reverseGameMessageLog = existingGame.gameMessageLog.slice().reverse();
            const startingPlayerMessage = reverseGameMessageLog.find(gameMessage => gameMessage.messageType === MessageType.RoundStarted && (gameMessage.message as RoundSetup).startingPlayerId);
            logger.debug(`found startingPlayer from: ${JSON.stringify(startingPlayerMessage)}`);
            if ((startingPlayerMessage.message as RoundSetup).startingPlayerId !== playerId){
                logger.log('info', `${playerId} tried to claim in ${gameId} when it's not their turn!`);
                return {ok: false, message: ErrorMessage.NotYourTurn};
            }
        }
        // cheat is called.  Resolve.
        if (currentClaim.message.cheat){
            const result = this.resolveCheat(gameId, playerId, lastMessage, existingGame, gamePopulation);
            if (!result.ok){
                return result;
            }
        }
        // bang on is called.  Resolve.
        else if (currentClaim.message.bangOn){
            const result = this.resolveBangOn(gameId, playerId, lastMessage, existingGame, gamePopulation);
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
        if (!gameId){
            return {ok: false, message: ErrorMessage.NoGameIDProvided};
        }
        if (!playerId){
            return {ok: false, message: ErrorMessage.NoUserIDProvided};
        }
        if (!currentClaim){
            return {ok: false, message: ErrorMessage.NoClaimProvided};
        }
        if (!existingGame){
            return {ok: false, message: ErrorMessage.GameNotFound};
        }
        if (!gamePopulation){
            return {ok: false, message: ErrorMessage.NoGamePopulationProvided};
        }
        const activePlayers = existingGame.participants.filter(participant => !participant.eliminated);
        logger.debug(`activePlayers: ${JSON.stringify(activePlayers)}`);
        const currentPlayer = activePlayers.find(participant => participant.userId === playerId);
        logger.debug(`currentPlayer: ${JSON.stringify(currentPlayer)}`);
        let nextPlayer: Participant;
        if (activePlayers.indexOf(currentPlayer) === activePlayers.length - 1){
            nextPlayer = activePlayers[0];
        }
        else{
            nextPlayer = activePlayers[activePlayers.indexOf(currentPlayer) + 1];
        }
        currentClaim.message.nextPlayerId = nextPlayer.userId;
        currentClaim.message.playerId = playerId;
        logger.verbose(`gamePopulation is now:`);
        gamePopulation.forEach((val, key) => logger.verbose(`${key}: ${JSON.stringify(val)}`));
        const result = this.messenger.sendGameMessageToAll(gameId, MessageType.Claim, currentClaim.message, gamePopulation);
        return result;
    }

    resolveBangOn(gameId: string, playerId: string, lastMessage: GameMessage, existingGame: GameInterface, gamePopulation: Map<string, GameInterface>): Result<string>{
        if (!gameId){
            return {ok: false, message: ErrorMessage.NoGameIDProvided};
        }
        if (!playerId){
            return {ok: false, message: ErrorMessage.NoUserIDProvided};
        }
        if (!lastMessage){
            return {ok: false, message: ErrorMessage.NoClaimProvided};
        }
        if (!existingGame){
            return {ok: false, message: ErrorMessage.GameNotFound};
        }
        if (!gamePopulation){
            return {ok: false, message: ErrorMessage.NoGamePopulationProvided};
        }
        // can't call cheat with no claims
        if (lastMessage.messageType !== MessageType.Claim){
            logger.log('info', `${playerId} tried to call cheat in ${gameId} when there hasn't been a claim.`);
            return {ok: false, message: ErrorMessage.CanOnlyCheatClaim};
        }
        const lastClaim = lastMessage.message as Claim;
        const challenger = existingGame.participants.find(participant => participant.userId === playerId);
        const challengedPlayer = existingGame.participants.find(participant => participant.userId === lastClaim.playerId);
        const numberOfThatRoll = Game.countNumberOfThatRoll(challengedPlayer.roll, lastClaim.value);
        let roundResults: RoundResults;
        logger.log('debug', `${challengedPlayer.name} claimed ${lastClaim.quantity} ${lastClaim.value}s and has ${numberOfThatRoll} ${lastClaim.value}s`);
        logger.log('debug', `${typeof(lastClaim.quantity)} === ${typeof(numberOfThatRoll)} -> ${Number(lastClaim.quantity) === numberOfThatRoll}`);
        if (Number(lastClaim.quantity) === numberOfThatRoll){
            logger.info('bang on call successful');
            challengedPlayer.numberOfDice = challengedPlayer.numberOfDice - 2;
            if (challengedPlayer.numberOfDice <= 0){
                challengedPlayer.eliminated = true;
            }
            roundResults = {
                callingPlayer: existingGame.participants.find(participant => participant.userId === playerId),
                calledPlayer: challengedPlayer,
                claim: lastClaim,
                claimSuccess: false,
                playerEliminated: challengedPlayer.eliminated
            }
        }
        else{
            logger.info('bang on call unsuccessful');
            challenger.numberOfDice = challenger.numberOfDice - 2;
            if (challenger.numberOfDice <= 0){
                challenger.eliminated = true;
            }
            roundResults = {
                callingPlayer: existingGame.participants.find(participant => participant.userId === playerId),
                calledPlayer: challengedPlayer,
                claim: lastClaim,
                claimSuccess: true,
                playerEliminated: challenger.eliminated
            }
        }
        logger.verbose(`gamePopulation is now:`);
        gamePopulation.forEach((val, key) => logger.verbose(`${key}: ${JSON.stringify(val)}`));
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
            const result = this.startRound(gameId, gamePopulation);
            if (!result.ok){
                return result;
            }
        }
        return {ok: true};
    }

    resolveCheat(gameId: string, playerId: string, lastMessage: GameMessage, existingGame: GameInterface, gamePopulation: Map<string, GameInterface>): Result<string>{
        if (!gameId){
            return {ok: false, message: ErrorMessage.NoGameIDProvided};
        }
        if (!playerId){
            return {ok: false, message: ErrorMessage.NoUserIDProvided};
        }
        if (!lastMessage){
            return {ok: false, message: ErrorMessage.NoClaimProvided};
        }
        if (!existingGame){
            return {ok: false, message: ErrorMessage.GameNotFound};
        }
        if (!gamePopulation){
            return {ok: false, message: ErrorMessage.NoGamePopulationProvided};
        }
        // can't call cheat with no claims
        if (lastMessage.messageType !== MessageType.Claim){
            logger.log('info', `${playerId} tried to call cheat in ${gameId} when there hasn't been a claim.`);
            return {ok: false, message: ErrorMessage.CanOnlyCheatClaim};
        }
        const lastClaim = lastMessage.message as Claim;
        const challengedPlayer = existingGame.participants.find(participant => participant.userId === lastClaim.playerId);
        const numberOfThatRoll = Game.countNumberOfThatRoll(challengedPlayer.roll, lastClaim.value);
        let roundResults: RoundResults;
        if (lastClaim.quantity > numberOfThatRoll){
            logger.info('cheat call successful');
            challengedPlayer.numberOfDice--;
            if (challengedPlayer.numberOfDice === 0){
                challengedPlayer.eliminated = true;
            }
            roundResults = {
                callingPlayer: existingGame.participants.find(participant => participant.userId === playerId),
                calledPlayer: challengedPlayer,
                claim: lastClaim,
                claimSuccess: false,
                playerEliminated: challengedPlayer.eliminated
            }
        }
        else{
            logger.info('cheat call unsuccessful');
            const challenger = existingGame.participants.find(participant => participant.userId === playerId);
            challenger.numberOfDice--;
            if (challenger.numberOfDice === 0){
                challenger.eliminated = true;
            }
            roundResults = {
                callingPlayer: existingGame.participants.find(participant => participant.userId === playerId),
                calledPlayer: challengedPlayer,
                claim: lastClaim,
                claimSuccess: true,
                playerEliminated: challenger.eliminated
            }
        }
        logger.verbose(`gamePopulation is now:`);
        gamePopulation.forEach((val, key) => logger.verbose(`${key}: ${JSON.stringify(val)}`));
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
            const result = this.startRound(gameId, gamePopulation);
            if (!result.ok){
                return result;
            }
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