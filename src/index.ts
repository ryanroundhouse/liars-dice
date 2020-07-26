import express from "express";
import winston from "winston";
import session from "express-session";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from 'uuid';
import WebSocket from "ws";
import { Participant } from "./interfaces/participant";
import { Game } from "./interfaces/game";
import { GameMessage } from "./interfaces/game-message";
import { MessageType } from "./enums/messageType";
import { RoundResults } from "./interfaces/round-results";
import { RoundSetup } from "./interfaces/round-setup";
import { Claim } from "./interfaces/claim";
import { GameOver } from "./interfaces/game-over";

const app = express();
const port = 8080; // default port to listen
const wsConnections = new Map<string, WebSocket>();
const gamePopulation = new Map<string, Game>();
const secret = 'alibubalay';

// create logger
const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
      // winston.format.timestamp({format: 'YY-MM-DD HH:MM:SS'}),
      winston.format.json()
  ),
    transports: [
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' }),
    ],
});
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.simple()
    }));
}

// create a unique sessions per visitor stored as a cookie.
const sessionParser = session({
  secret,
  name: "my-session",
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 172800000
  }
});

app.use(express.static('public'));
app.use(sessionParser);
app.use(bodyParser.json());

// start the Express server
const server = app.listen( port, () => {
    logger.log('info', `server started at http://localhost:${ port }`);
} );

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
  res.send({ result: 'OK', message: 'Session created' });
});

// log out from session
app.delete('/logout', (request, response) => {
  if (request.session.userId === undefined){
    response.status(400).send({result: '400', message: 'you\'re not logged in.'});
    return;
  }
  const ws = wsConnections.get(request.session.userId);

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
  if (typeof userId === undefined){
    res.status(400).send({ result: '400', message: 'user must log in before creating a game.' });
    logger.log('info', `user tried to create a game before logging in.`);
    return;
  }
  logger.log('info', `got game create: ${req.body.gameId} from ${userId}`);
  const id = uuidv4();
  logger.log('info', `gameId is ${id}`);
  const game: Game = {
    started: false,
    participants: [],
    gameMessageLog: []
  }
  gamePopulation.set(id, game);
  logger.verbose(`gamePopulation is now:`);
  gamePopulation.forEach((val, key) => logger.verbose(`${key}: ${JSON.stringify(val)}`));
  res.send({ result: 'OK', message: {gameId: id} });
});

app.post('/game/:gameId/join', (req, res) => {
  const gameId = req.params.gameId;
  if (typeof gameId === undefined){
    res.send({ result: '400', message: 'user must log in before joining a game.' });
    logger.log('info', `user tried to join game ${gameId} before logging in.`);
    return;
  }
  logger.log('info', `got request to join ${gameId} from ${req.session.userId}`);
  const game = gamePopulation.get(gameId);
  // does the game exist?
  if (game == null){
    res.send({ result: '400', message: 'game does not exist.' });
    logger.log('info', `${req.session.userId} tried to join game ${gameId} that didn't exist.`);
    return;
  }
  // is the user already a participant of a game?
  let alreadyInGame = false;
  gamePopulation.forEach((selectedGame: Game) => {
    if (typeof selectedGame.participants.find(selectedParticipant => selectedParticipant.userId === req.session.userId) !== "undefined"){
      alreadyInGame = true;
    }
  })
  if (alreadyInGame){
    res.send({ result: '400', message: 'you can only be in 1 game.' });
    logger.log('info', `${req.session.userId} tried to join game ${gameId} when they were already in a game.`);
    return;
  }
  // did they provide a name
  const name = req.body.name;
  if (!name){
    res.send({ result: '400', message: 'you must supply a name in the body.' });
    logger.log('info', `${req.session.userId} tried to join game ${gameId} but didn't provide a name.`);
    return;
  }
  // is the game already started
  if (game.started){
    res.send({ result: '400', message: 'game has already started.' });
    logger.log('info', `${req.session.userId} tried to join game ${gameId} but it already started.`);
    return;
  }
  // join the game
  const participant: Participant = {
    userId: req.session.userId,
    name,
    numberOfDice: 5,
    roll: [],
    eliminated: false
  }
  res.send({ result: 'OK', message: game.participants });
  game.participants.push(participant);
  gamePopulation.set(gameId, game);
  logger.verbose(`gamePopulation is now:`);
  gamePopulation.forEach((val, key) => logger.verbose(`${key}: ${JSON.stringify(val)}`));
  sendGameMessage(gameId, MessageType.PlayerJoined, participant);
});

app.post('/game/:gameId/start', (req, res) => {
  const gameId = req.params.gameId;
  if (typeof gameId === undefined){
    res.send({ result: '400', message: 'user must log in before starting a game.' });
    logger.log('info', `user tried to start a game ${gameId} before logging in.`);
    return;
  }
  logger.log('info', `got request to start ${gameId} from ${req.session.userId}`);
  const game = gamePopulation.get(gameId);
  // does the game exist?
  if (game == null){
    res.send({ result: '400', message: 'game does not exist.' });
    logger.log('info', `${req.session.userId} tried to start game ${gameId} that didn't exist.`);
    return;
  }
  // is the game already started
  if (game.started){
    res.send({ result: '400', message: 'game has already started.' });
    logger.log('info', `${req.session.userId} tried to start game ${gameId} but it already started.`);
    return;
  }
  game.started = true;
  res.send({ result: 'OK', message: 'true' });
  logger.verbose(`gamePopulation is now:`);
  gamePopulation.forEach((val, key) => logger.verbose(`${key}: ${JSON.stringify(val)}`));
  sendGameMessage(gameId, MessageType.GameStarted, null);
  startRound(gameId);
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
  const game = gamePopulation.get(gameId);
  // does the game exist?
  if (game == null){
    res.send({ result: '400', message: 'game does not exist.' });
    logger.log('info', `${req.session.userId} tried to start game ${gameId} that didn't exist.`);
    return;
  }
  // is the game not started
  if (!game.started){
    res.send({ result: '400', message: 'game has\'nt started yet.' });
    logger.log('info', `${req.session.userId} tried to make a claim in ${gameId} but it hasn't started yet.`);
    return;
  }
  const lastMessage = game.gameMessageLog[game.gameMessageLog.length - 1];
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
    const reverseGameMessageLog = game.gameMessageLog.slice().reverse();
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
    const challengedPlayer = game.participants.find(participant => participant.userId === lastClaim.playerId);
    const numberOfThatRoll = countNumberOfThatRoll(challengedPlayer.roll, lastClaim.value);
    let roundResults: RoundResults;
    if (lastClaim.quantity > numberOfThatRoll){
      logger.info('cheat call successful');
      challengedPlayer.numberOfDice--;
      if (challengedPlayer.numberOfDice === 0){
        challengedPlayer.eliminated = true;
      }
      roundResults = {
        callingPlayer: game.participants.find(participant => participant.userId === req.session.userId),
        calledPlayer: challengedPlayer,
        claim: lastClaim,
        claimSuccess: true,
        playerEliminated: challengedPlayer.numberOfDice === 0
      }
    }
    else{
      logger.info('cheat call unsuccessful');
      const challenger = game.participants.find(participant => participant.userId === req.session.userId);
      challenger.numberOfDice--;
      if (challenger.numberOfDice === 0){
        challenger.eliminated = true;
      }
      roundResults = {
        callingPlayer: game.participants.find(participant => participant.userId === req.session.userId),
        calledPlayer: challengedPlayer,
        claim: lastClaim,
        claimSuccess: false,
        playerEliminated: challenger.numberOfDice === 0
      }
    }
    res.send({ result: 'OK', message: 'true' });
    logger.verbose(`gamePopulation is now:`);
    gamePopulation.forEach((val, key) => logger.verbose(`${key}: ${JSON.stringify(val)}`));
    sendGameMessage(gameId, MessageType.RoundResults, roundResults);
    const activePlayers = game.participants.filter(participant => !participant.eliminated);
    if (activePlayers.length === 1){
      const gameOver: GameOver = {
        winner: activePlayers[0]
      }
      sendGameMessage(gameId, MessageType.GameOver, gameOver);
    }
    else{
      startRound(gameId);
    }
  }
  // pass it on to the next player.
  else{
    const activePlayers = game.participants.filter(participant => !participant.eliminated);
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
    gamePopulation.forEach((val, key) => logger.verbose(`${key}: ${JSON.stringify(val)}`));
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

function startRound(gameId: string){
  const game = gamePopulation.get(gameId);
  // figure out starting player
  let startingPlayer: Participant;
  const lastPlayEvent = game.gameMessageLog[game.gameMessageLog.length - 1];
  // randomize starting player if start of game
  if (lastPlayEvent.messageType === MessageType.GameStarted){
    startingPlayer = game.participants[getRandomInt(game.participants.length-1)];
    logger.info(`new game, rolling for starting player, got ${startingPlayer.userId}`);
  }
  // whoever goofed up is the new starting player
  else if (lastPlayEvent.messageType === MessageType.RoundResults){
    logger.info(`checking lastPlayEvent: ${JSON.stringify(lastPlayEvent)}`);
    const roundResults = (lastPlayEvent.message as RoundResults);
    if (roundResults.claimSuccess){
      startingPlayer = roundResults.calledPlayer;
    }
    else{
      startingPlayer = roundResults.callingPlayer;
    }
  }
  // send everyone's starting info
  game.participants.forEach(participant => {
    participant.roll = [];
    for (let i = 0; i < participant.numberOfDice; i++){
      participant.roll.push(getRandomInt(6) + 1);
    }
    let starting = false;
    if (participant.userId === startingPlayer.userId){
      starting = true;
    }
    const roundSetup: RoundSetup = {
      participant,
      startingPlayer: starting
    }
    sendGameMessageToOne(gameId, participant.userId, MessageType.RoundStarted, roundSetup);
  });
}

function getRandomInt(max: number) {
  return Math.floor(Math.random() * Math.floor(max));
}

function sendGameMessage(gameId: string, messageType: MessageType, message: any){
  const game = gamePopulation.get(gameId);
  const gameMessage: GameMessage = {
    messageType,
    message
  }
  game.gameMessageLog.push(gameMessage);
  game.participants.forEach((participant: Participant) => {
    wsConnections.get(participant.userId).send(JSON.stringify(gameMessage));
  });
}

function sendGameMessageToOne(gameId: string, participantId: string, messageType: MessageType, message: any){
  const game = gamePopulation.get(gameId);
  const gameMessage: GameMessage = {
    messageType,
    message
  }
  game.gameMessageLog.push(gameMessage);
  wsConnections.get(participantId).send(JSON.stringify(gameMessage));
}

//
// Create HTTP server by ourselves.
//
const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

server.on('upgrade', (request, socket, head) => {
  logger.log('info', 'Parsing session from request...');

  sessionParser(request, socket, () => {
    if (!request.session.userId) {
      logger.log('warn', 'someone tried to open a socket without a session.');
      socket.destroy();
      return;
    }

    logger.log('info', `Session is parsed as ${request.session.userId}`);

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });
});

wss.on('connection', (ws, request) => {
  // hacky workaround to use express-session with ws.
  const userId = (request as any).session.userId;

  wsConnections.set(userId.toString(), ws);

  ws.on('message', (message) => {
    logger.log('info', `Received message ${message} from user ${userId}`);
    // const msg = JSON.parse(message);
    // switch (msg.type){
    //   case 'join':
    //     logger.log('info', "join");
    //     var participants = gamePopulation.get(msg.gameId);
    //     if (!participants.find(participant => participant === userId)){
    //       participants.push(userId);
    //       gamePopulation.set(msg.gameId, participants);
    //     }
    //     logger.log('info', gamePopulation);
    //     break;
    //   default:
    //     logger.log('info', "unknown");
    //     break;
    // }
  });

  ws.on('close', () => {
    wsConnections.delete(userId.toString());
  });
});

module.exports = server;