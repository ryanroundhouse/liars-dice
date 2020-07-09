import express from "express";
import winston from "winston";
import session from "express-session";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from 'uuid';
import WebSocket from "ws";
import { Participant } from "./interfaces/participant";

const app = express();
const port = 8080; // default port to listen
const map = new Map<string, WebSocket>();
const gamePopulation = new Map<string, Participant[]>();
const secret = 'alibubalay';

// create logger
const logger = winston.createLogger({
    level: 'verbose',
    format: winston.format.combine(
      winston.format.timestamp({format: 'YY-MM-DD HH:MM:SS'}),
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
  if (req.session.userId != null){
    res.send({result: '400', message: 'already logged in.'});
    return;
  }
  // create set visitor's session
  const id = uuidv4();
  logger.log('info', `Setting session for user ${id}`);
  req.session.userId = id;
  res.send({ result: 'OK', message: 'Session created' });
});


// create a game
app.post('/game/create', (req, res) => {
  logger.log('info', `got game create: ${req.body.gameId} from ${req.session.userId}`);
  const id = uuidv4();
  logger.log('info', `it is ${id}`);
  const parts: Participant[] = [];
  gamePopulation.set(id, parts);
  logger.verbose(`gamePopulation is now:`);
  gamePopulation.forEach((val, key) => logger.verbose(`${key}: ${JSON.stringify(val)}`));
  res.send({ result: 'OK', message: {gameId: id} });
});

// draw a card in the game
app.post('/game/:gameId/draw', (req, res) => {
  const gameId = req.params.gameId;
  logger.log('info', `got request to draw a card in ${gameId} from ${req.session.userId}`);
  const participants: Participant[] = gamePopulation.get(gameId);
  // does the game exist?
  if (participants == null){
    res.send({ result: '400', message: 'game does not exist or you are not in that game.' });
    logger.log('warn', `${req.session.userId} tried to draw in game ${gameId} that didn't exist.`);
    return;
  }
  const participant = participants.find(part => part.userId === req.session.userId);
  // are they a participant of that game?
  if (participant == null){
    res.send({ result: '400', message: 'game does not exist or you are not in that game.' });
    logger.log('warn', `${req.session.userId} tried to draw in game ${gameId} that he wasn't a participant.`);
    return;
  }
  // draw a card
  participant.cards.push('newCard');
  logger.log('info', `${participant.userId} now has ${participant.cards.length} cards`);
  logger.verbose(`gamePopulation is now:`);
  gamePopulation.forEach((val, key) => logger.verbose(`${key}: ${JSON.stringify(val)}`));
  participants.forEach(part => {
    map.get(part.userId).send("someone got a card");
  });
  res.send({ result: 'OK', message: 'card drawn' });
});

app.post('/game/:gameId/join', (req, res) => {
  const gameId = req.params.gameId;
  logger.log('info', `got request to join ${gameId} from ${req.session.userId}`);
  const participants = gamePopulation.get(gameId);
  // does the game exist?
  if (participants == null){
    res.send({ result: '400', message: 'game does not exist.' });
    logger.log('info', `${req.session.userId} tried to join game ${gameId} that didn't exist.`);
    return;
  }
  // is the user already a participant of a game?
  let alreadyInGame = false;
  gamePopulation.forEach((value: Participant[]) => {
    if (value.find(val => val.userId === req.session.userId) != null){
      alreadyInGame = true;
    }
  })
  if (alreadyInGame){
    res.send({ result: '400', message: 'you can only be in 1 game.' });
    logger.log('info', `${req.session.userId} tried to join game ${gameId} when they were already in a game.`);
    return;
  }
  // join the game
  const participant: Participant = {
    userId: req.session.userId,
    cards: []
  }
  participants.push(participant);
  gamePopulation.set(gameId, participants);
  logger.verbose(`gamePopulation is now:`);
  gamePopulation.forEach((val, key) => logger.verbose(`${key}: ${JSON.stringify(val)}`));
  res.send({ result: 'OK', message: 'game joined' });
});

// log out from session
app.delete('/logout', (request, response) => {
  const ws = map.get(request.session.userId);

  logger.log('info', `Destroying session from ${request.session.userId} `);
  request.session.destroy(() => {
    if (ws) {
      ws.close();
    }
    response.send({ result: 'OK', message: 'Session destroyed' });
  });
});

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

  map.set(userId.toString(), ws);

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
    map.delete(userId.toString());
  });
});