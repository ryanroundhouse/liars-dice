process.env.NODE_ENV = 'test'
/* tslint:disable:no-unused-expression */

import "mocha";
import chai from "chai";
import { Game } from "./game";
import { Result } from "./types/result";
import { GameInterface } from "./interfaces/game-interface";
import { Participant } from "./interfaces/participant";
import winston from "winston";

chai.should();

// create logger
const logger = winston.createLogger({
    transports: [
      new winston.transports.Console({ silent: true }),
    ],
  });

describe("game functionality", () => {
    describe("create game functionality", () => {
        it("can't create game if you don't provide an ID", () => {
            const game: Game = new Game(logger);
            const result: Result<string> = game.createGame(null, new Map<string, GameInterface>());
            result.ok.should.be.false;
        });
        it("can't create game if you don't provide a gamePopulation", () => {
            const game: Game = new Game(logger);
            const result: Result<string> = game.createGame("100", null);
            result.ok.should.be.false;
        });
        it("can't create game if you're already in a game", () => {
            const playerId: string = "test";
            const participant: Participant = {
                userId: playerId,
                name: "test player",
                numberOfDice: 5,
                roll: [],
                eliminated: false
            }
            const game: Game = new Game(logger);
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const gameWithPlayer: GameInterface = {
                started: false,
                finished: false,
                participants: [participant],
                gameMessageLog: []
            }
            gamePopulation.set("gameId", gameWithPlayer);
            const result: Result<string> = game.createGame(playerId, gamePopulation);
            result.ok.should.be.false;
        });
        it("can create game if you're not in a game", () => {
            const playerId: string = "test";
            const game: Game = new Game(logger);
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const result: Result<string> = game.createGame(playerId, gamePopulation);
            result.ok.should.be.true;
        });
        it("can create game if you're already in a game but it's finished", () => {
            const playerId: string = "test";
            const participant: Participant = {
                userId: playerId,
                name: "test player",
                numberOfDice: 5,
                roll: [],
                eliminated: false
            }
            const game: Game = new Game(logger);
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const gameWithPlayer: GameInterface = {
                started: true,
                finished: true,
                participants: [participant],
                gameMessageLog: []
            }
            gamePopulation.set("gameId", gameWithPlayer);
            const result: Result<string> = game.createGame(playerId, gamePopulation);
            result.ok.should.be.true;
        });
        it("can create game while other games exist", () => {
            const playerId: string = "test";
            const otherPlayerId: string = "not test";
            const participant: Participant = {
                userId: otherPlayerId,
                name: "not test player",
                numberOfDice: 5,
                roll: [],
                eliminated: false
            }
            const game: Game = new Game(logger);
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const gameWithPlayer: GameInterface = {
                started: true,
                finished: true,
                participants: [participant],
                gameMessageLog: []
            }
            gamePopulation.set("gameId", gameWithPlayer);
            const result: Result<string> = game.createGame(playerId, gamePopulation);
            result.ok.should.be.true;
        });
    });
    
    describe("join game functionality", () => {
        it("can't join game if you don't provide a userID", () => {
            const game: Game = new Game(logger);
            const result: Result<Participant[]> = game.joinGame(null, "gameId", "name", new Map<string, GameInterface>());
            result.ok.should.be.false;
        });
        it("can't join game if you don't provide a gameID", () => {
            const game: Game = new Game(logger);
            const result: Result<Participant[]> = game.joinGame("userId", null, "name", new Map<string, GameInterface>());
            result.ok.should.be.false;
        });
        it("can't join game if you don't provide a name", () => {
            const game: Game = new Game(logger);
            const result: Result<Participant[]> = game.joinGame("userId", "gameId", null, new Map<string, GameInterface>());
            result.ok.should.be.false;
        });
        it("can't join game if you don't provide a gamePopulation", () => {
            const game: Game = new Game(logger);
            const result: Result<Participant[]> = game.joinGame("userId", "gameId", "name", null);
            result.ok.should.be.false;
        });
        it("can't join game if it doesn't exist", () => {
            const game: Game = new Game(logger);
            const result: Result<Participant[]> = game.joinGame("userId", "gameId", "name", new Map<string, GameInterface>());
            result.ok.should.be.false;
        });
        it("can't join game if already in a game", () => {
            const playerId: string = "test";
            const participant: Participant = {
                userId: playerId,
                name: "not test player",
                numberOfDice: 5,
                roll: [],
                eliminated: false
            }
            const game: Game = new Game(logger);
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const gameWithPlayer: GameInterface = {
                started: false,
                finished: false,
                participants: [participant],
                gameMessageLog: []
            }
            gamePopulation.set("gameId", gameWithPlayer);
            const result: Result<Participant[]> = game.joinGame(playerId, "gameId", "name", new Map<string, GameInterface>());
            result.ok.should.be.false;
        });
        it("can join game if games exist, but you're not in it", () => {
            const game: Game = new Game(logger);
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const emptyGame: GameInterface = {
                started: false,
                finished: false,
                participants: [],
                gameMessageLog: []
            }
            gamePopulation.set("gameId", emptyGame);
            const result: Result<Participant[]> = game.joinGame("userId", "gameId", "name", gamePopulation);
            result.ok.should.be.true;
        });
        it("can join game if games exist, participant in another game, but game is finished", () => {
            const playerId: string = "test";
            const participant: Participant = {
                userId: playerId,
                name: "not test player",
                numberOfDice: 5,
                roll: [],
                eliminated: false
            }
            const game: Game = new Game(logger);
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const gameWithPlayer: GameInterface = {
                started: true,
                finished: true,
                participants: [participant],
                gameMessageLog: []
            }
            gamePopulation.set("gameId", gameWithPlayer);
            const result: Result<Participant[]> = game.joinGame(playerId, "gameId", "name", gamePopulation);
            result.ok.should.be.true;
        });
        it("can join game if games exist, but not a participant in another game", () => {
            const otherPlayerId: string = "not test";
            const participant: Participant = {
                userId: otherPlayerId,
                name: "not test player",
                numberOfDice: 5,
                roll: [],
                eliminated: false
            }
            const game: Game = new Game(logger);
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const gameWithPlayer: GameInterface = {
                started: false,
                finished: false,
                participants: [participant],
                gameMessageLog: []
            }
            gamePopulation.set("gameId", gameWithPlayer);
            const result: Result<Participant[]> = game.joinGame("userId", "gameId", "name", gamePopulation);
            result.ok.should.be.true;
        });
        it("can join game if games exist, but player was already eliminated from their game", () => {
            const playerId: string = "not test";
            const participant: Participant = {
                userId: playerId,
                name: "not test player",
                numberOfDice: 5,
                roll: [],
                eliminated: true
            }
            const game: Game = new Game(logger);
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const gameWithPlayer: GameInterface = {
                started: true,
                finished: false,
                participants: [participant],
                gameMessageLog: []
            }
            gamePopulation.set("gameId", gameWithPlayer);
            const result: Result<Participant[]> = game.joinGame(playerId, "gameId", "name", gamePopulation);
            result.ok.should.be.true;
        });
    });
    describe("start game functionality", () => {
        it("can't start game if you don't provide a userID", () => {
            const game: Game = new Game(logger);
            const result: Result<string> = game.startGame(null, "gameId", new Map<string, GameInterface>());
            result.ok.should.be.false;
        });
        it("can't start game if you don't provide a gameID", () => {
            const game: Game = new Game(logger);
            const result: Result<string> = game.startGame("userId", null, new Map<string, GameInterface>());
            result.ok.should.be.false;
        });
        it("can't start game if you don't provide a gamePopulation", () => {
            const game: Game = new Game(logger);
            const result: Result<string> = game.startGame("userId", "gameId", null);
            result.ok.should.be.false;
        });
        it("can't start game if it doesn't exist", () => {
            const game: Game = new Game(logger);
            const result: Result<string> = game.startGame("userId", "gameId", new Map<string, GameInterface>());
            result.ok.should.be.false;
        });
        it("can't start game if it's already started.", () => {
            const playerId: string = "test";
            const participant: Participant = {
                userId: playerId,
                name: "test player",
                numberOfDice: 5,
                roll: [],
                eliminated: true
            }
            const game: Game = new Game(logger);
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const gameWithPlayer: GameInterface = {
                started: true,
                finished: false,
                participants: [participant],
                gameMessageLog: []
            }
            gamePopulation.set("gameId", gameWithPlayer);
            const result: Result<string> = game.startGame("userId", "gameId", gamePopulation);
            result.ok.should.be.false;
        });
        it("can't start game if you're not in it.", () => {
            const playerId: string = "not test";
            const participant: Participant = {
                userId: playerId,
                name: "test player",
                numberOfDice: 5,
                roll: [],
                eliminated: true
            }
            const game: Game = new Game(logger);
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const gameWithPlayer: GameInterface = {
                started: false,
                finished: false,
                participants: [participant],
                gameMessageLog: []
            }
            gamePopulation.set("gameId", gameWithPlayer);
            const result: Result<string> = game.startGame("userId", "gameId", gamePopulation);
            result.ok.should.be.false;
        });
    });
});
