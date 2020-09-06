import express from "express";
import compression from "compression";  // compresses requests
import bodyParser from "body-parser";
import path from "path";
import sessionParser from "./session-parser";
import * as gameController from "./controllers/game-controller";

// Create Express server
const app = express();
const sourceAddress = "http://localhost:4201";

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

// app.use(cors({origin:[sourceAddress],credentials: true}));
// CORS Middleware
app.use((req, res, next) => {
  // Enabling CORS
  res.header('Access-Control-Allow-Credentials', "true");
  res.header("Access-Control-Allow-Origin", sourceAddress);
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-client-key, x-client-token, x-client-secret, Authorization");
  next();
});

app.post('/login', gameController.login);
app.delete('/logout', gameController.logout);
app.post('/game/create', gameController.createGame);
app.post('/game/:gameId/join', gameController.joinGame);
app.post('/game/:gameId/start', gameController.startGame);
app.post('/game/:gameId/claim', gameController.claim);

export default app;