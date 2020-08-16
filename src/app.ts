import express from "express";
import compression from "compression";  // compresses requests
import bodyParser from "body-parser";
import path from "path";
import { v4 as uuidv4 } from 'uuid';
import { Game } from "./game";
import { Participant } from "./interfaces/participant";
import { GameMessage } from "./interfaces/game-message";
import { MessageType } from "./enums/messageType";
import { GameOver } from "./interfaces/game-over";
import { RoundResults } from "./interfaces/round-results";
import { Claim } from "./interfaces/claim";
import { RoundSetup } from "./interfaces/round-setup";
import logger from "./logger";
import sessionParser from "./session-parser";

const game: Game = new Game(logger);

// Create Express server
const app = express();

// Express configuration
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(sessionParser);

app.use(
    express.static(path.join(__dirname, "public"), { maxAge: 31557600000 })
);

// create session
app.post('/login', (req, res) => {
    // send error if the user is already logged in
    logger.debug(`session set to ${req.session.userId}`);
    if (req.session.userId != null){
      res.status(400).send({status: '400', message: 'already logged in.'});
      return;
    }
    // create set visitor's session
    const id = uuidv4();
    logger.log('info', `Setting session for user ${id}`);
    req.session.userId = id;
    res.send({ result: 'OK', message: `Session created as ${id}` });
  });

  // log out from session
  app.delete('/logout', (request, response) => {
    if (request.session.userId === undefined){
      response.status(400).send({result: '400', message: 'you\'re not logged in.'});
      return;
    }
    const ws = Game.wsConnections.get(request.session.userId);

    logger.log('info', `Destroying session from ${request.session.userId} `);
    request.session.destroy(() => {
      if (ws) {
        ws.close();
      }
      response.send({ result: 'OK', message: 'Session destroyed' });
    });
  });

  // create a game
  app.post('/game/create', (req, res) => {
    const userId: string = req.session.userId;
    if (userId === undefined){
      res.status(400).send({ result: '400', message: 'user must log in before creating a game.' });
      logger.log('info', `user tried to create a game before logging in.`);
      return;
    }
    const result = game.createGame(userId, Game.gamePopulation);
    if (!result.ok){
      res.status(400).send(result);
      return;
    }
    res.send({ result: 'OK', gameId: result });
  });

  app.post('/game/:gameId/join', (req, res) => {
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
    sendGameMessage(gameId, MessageType.PlayerJoined, participants[participants.length - 1]);
  });

  app.post('/game/:gameId/start', (req, res) => {
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

    res.send({ result: 'OK', message: gameId });
    logger.verbose(`gamePopulation is now:`);
    sendGameMessage(gameId, MessageType.GameStarted, null);
    game.startRound(gameId, Game.gamePopulation, Game.wsConnections);
  });

  app.post('/game/:gameId/claim', (req, res) => {
    const gameId = req.params.gameId;
    if (typeof gameId === undefined){
      res.send({ result: '400', message: 'user must join a game before making a claim.' });
      logger.log('info', `user tried to make a claim in ${gameId} before joining it.`);
      return;
    }
    const claim: GameMessage = req.body;
    logger.log('info', `got request to make a claim ${JSON.stringify(claim)} in ${gameId} from ${req.session.userId}`);
    const existingGame = Game.gamePopulation.get(gameId);
    // does the game exist?
    if (existingGame == null){
      res.send({ result: '400', message: 'game does not exist.' });
      logger.log('info', `${req.session.userId} tried to start game ${gameId} that didn't exist.`);
      return;
    }
    // is the game not started
    if (!existingGame.started){
      res.send({ result: '400', message: 'game has\'nt started yet.' });
      logger.log('info', `${req.session.userId} tried to make a claim in ${gameId} but it hasn't started yet.`);
      return;
    }
    const lastMessage = existingGame.gameMessageLog[existingGame.gameMessageLog.length - 1];
    logger.debug(`lastMessage was ${JSON.stringify(lastMessage)}`);
    // can't claim if it's not your turn
    if (lastMessage.messageType === MessageType.Claim){
      logger.debug(`comparing ${JSON.stringify(lastMessage)} to ${JSON.stringify(claim)} by ${req.session.userId}`);
      if (lastMessage.message.nextPlayerId !== req.session.userId){
        res.send({ result: '400', message: 'it\'s not your turn.' });
        logger.log('info', `${req.session.userId} tried to claim in ${gameId} when it's not their turn.`);
        return;
      }
      if (!(claim.message as Claim).cheat && (lastMessage.message as Claim).quantity >= claim.message.quantity){
        res.send({ result: '400', message: 'you need to make a claim of larger quantity than the last claim or call cheat.' });
        logger.log('info', `${req.session.userId} tried to claim smaller than last claim in ${gameId}.`);
        return;
      }
    }
    if (lastMessage.messageType === MessageType.RoundStarted){
      // find the starting player's roundstarted.  It's not always the last one.
      const reverseGameMessageLog = existingGame.gameMessageLog.slice().reverse();
      const startingPlayerMessage = reverseGameMessageLog.find(gameMessage => gameMessage.messageType === MessageType.RoundStarted && (gameMessage.message as RoundSetup).startingPlayer);
      logger.debug(`found startingPlayer from: ${JSON.stringify(startingPlayerMessage)}`);
      if ((startingPlayerMessage.message as RoundSetup).participant.userId !== req.session.userId){
        res.send({ result: '400', message: 'it\'s not your turn.' });
        logger.log('info', `${req.session.userId} tried to claim in ${gameId} when it's not their turn!`);
        return;
      }
    }
    // cheat is called.  Resolve.
    if (claim.message.cheat){
      // can't call cheat with no claims
      if (lastMessage.messageType !== MessageType.Claim){
        res.send({ result: '400', message: 'can\'t call cheat if no one has made a claim.' });
        logger.log('info', `${req.session.userId} tried to call cheat in ${gameId} when there hasn't been a claim.`);
        return;
      }
      const lastClaim = lastMessage.message as Claim;
      const challengedPlayer = existingGame.participants.find(participant => participant.userId === lastClaim.playerId);
      const numberOfThatRoll = countNumberOfThatRoll(challengedPlayer.roll, lastClaim.value);
      let roundResults: RoundResults;
      if (lastClaim.quantity > numberOfThatRoll){
        logger.info('cheat call successful');
        challengedPlayer.numberOfDice--;
        if (challengedPlayer.numberOfDice === 0){
          challengedPlayer.eliminated = true;
        }
        roundResults = {
          callingPlayer: existingGame.participants.find(participant => participant.userId === req.session.userId),
          calledPlayer: challengedPlayer,
          claim: lastClaim,
          claimSuccess: true,
          playerEliminated: challengedPlayer.numberOfDice === 0
        }
      }
      else{
        logger.info('cheat call unsuccessful');
        const challenger = existingGame.participants.find(participant => participant.userId === req.session.userId);
        challenger.numberOfDice--;
        if (challenger.numberOfDice === 0){
          challenger.eliminated = true;
        }
        roundResults = {
          callingPlayer: existingGame.participants.find(participant => participant.userId === req.session.userId),
          calledPlayer: challengedPlayer,
          claim: lastClaim,
          claimSuccess: false,
          playerEliminated: challenger.numberOfDice === 0
        }
      }
      res.send({ result: 'OK', message: 'true' });
      logger.verbose(`gamePopulation is now:`);
      Game.gamePopulation.forEach((val, key) => logger.verbose(`${key}: ${JSON.stringify(val)}`));
      sendGameMessage(gameId, MessageType.RoundResults, roundResults);
      const activePlayers = existingGame.participants.filter(participant => !participant.eliminated);
      if (activePlayers.length === 1){
        const gameOver: GameOver = {
          winner: activePlayers[0]
        }
        sendGameMessage(gameId, MessageType.GameOver, gameOver);
        existingGame.finished = true;
      }
      else{
        game.startRound(gameId, Game.gamePopulation, Game.wsConnections);
      }
    }
    // pass it on to the next player.
    else{
      const activePlayers = existingGame.participants.filter(participant => !participant.eliminated);
      logger.debug(`activePlayers: ${JSON.stringify(activePlayers)}`);
      const currentPlayer = activePlayers.find(participant => participant.userId === req.session.userId);
      logger.debug(`currentPlayer: ${JSON.stringify(currentPlayer)}`);
      let nextPlayer: Participant;
      if (activePlayers.indexOf(currentPlayer) === activePlayers.length - 1){
        nextPlayer = activePlayers[0];
      }
      else{
        nextPlayer = activePlayers[activePlayers.indexOf(currentPlayer) + 1];
      }
      claim.message.nextPlayerId = nextPlayer.userId;
      claim.message.playerId = req.session.userId;
      res.send({ result: 'OK', message: 'true' });
      logger.verbose(`gamePopulation is now:`);
      Game.gamePopulation.forEach((val, key) => logger.verbose(`${key}: ${JSON.stringify(val)}`));
      sendGameMessage(gameId, MessageType.Claim, claim.message);
    }
  });

  function countNumberOfThatRoll(roll: number[], value: number){
    logger.debug(`counting number of ${value} in ${JSON.stringify(roll)}`);
    let count = 0;
    for(const die of roll){
      logger.debug(`compare ${die} ${value}`);
      if(+die === +value){
        logger.debug(`got one`);
        count++;
      }
    }
    logger.debug(`found ${count} occurrences`);
    return count;
  }

  function sendGameMessage(gameId: string, messageType: MessageType, message: any){
    const existingGame = Game.gamePopulation.get(gameId);
    const gameMessage: GameMessage = {
      messageType,
      message
    }
    logger.debug(`sending gameMessage: ${JSON.stringify(gameMessage)}`);
    existingGame.gameMessageLog.push(gameMessage);
    existingGame.participants.forEach((participant: Participant) => {
      const participantConnection = Game.wsConnections.get(participant.userId);
      if (participantConnection){
        Game.wsConnections.get(participant.userId).send(JSON.stringify(gameMessage));
      }
      else{
        logger.error(`no connection found to send gameMessage to ${participant.userId}`);
      }
    });
  }

export default app;