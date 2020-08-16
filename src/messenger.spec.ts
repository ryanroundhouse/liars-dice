process.env.NODE_ENV = 'test'
/* tslint:disable:no-unused-expression */

import "mocha";
import chai, { expect } from "chai";
import { Game } from "./game";
import { Messenger } from "./messenger";
import { Result } from "./types/result";
import { GameInterface } from "./interfaces/game-interface";
import { Participant } from "./interfaces/participant";
import winston from "winston";
import WebSocket from "ws";
import { ErrorMessage } from "./enums/errorMessage";
import { GameMessage } from "./interfaces/game-message";
import { MessageType } from "./enums/messageType";
import { RoundResults } from "./interfaces/round-results";
import { Claim } from "./interfaces/claim";
import sinon from "sinon";

chai.should();

// create logger
const logger = winston.createLogger({
    transports: [
      new winston.transports.Console({ silent: true }),
    ],
});

describe ("messenger tests", () => {
    describe ("sendGameMessageToOne tests", () => {
        it("sendGameMessageToOne fails if no gameId", () => {
            const gameId: string = "gameId";
            const participantId: string = "participantId";
            const messageType: MessageType = MessageType.GameStarted;
            const message: string = "message";
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const wsConnections: Map<string, WebSocket> = new Map<string, WebSocket>();
            const messenger = new Messenger();

            const result: Result<string> = messenger.sendGameMessageToOne(null, participantId, messageType, message, gamePopulation, wsConnections);
            result.ok.should.be.false;
            result.message.should.equal(ErrorMessage.NoGameIDProvided);
        });
        it("sendGameMessageToOne fails if no participantId", () => {
            const gameId: string = "gameId";
            const participantId: string = "participantId";
            const messageType: MessageType = MessageType.GameStarted;
            const message: string = "message";
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const wsConnections: Map<string, WebSocket> = new Map<string, WebSocket>();
            const messenger = new Messenger();

            const result: Result<string> = messenger.sendGameMessageToOne(gameId, null, messageType, message, gamePopulation, wsConnections);
            result.ok.should.be.false;
            result.message.should.equal(ErrorMessage.NoParticipantProvided);
        });
        it("sendGameMessageToOne fails if no messageType", () => {
            const gameId: string = "gameId";
            const participantId: string = "participantId";
            const messageType: MessageType = MessageType.GameStarted;
            const message: string = "message";
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const wsConnections: Map<string, WebSocket> = new Map<string, WebSocket>();
            const messenger = new Messenger();

            const result: Result<string> = messenger.sendGameMessageToOne(gameId, participantId, null, message, gamePopulation, wsConnections);
            result.ok.should.be.false;
            result.message.should.equal(ErrorMessage.NoMessageTypeProvided);
        });
        it("sendGameMessageToOne fails if no message", () => {
            const gameId: string = "gameId";
            const participantId: string = "participantId";
            const messageType: MessageType = MessageType.GameStarted;
            const message: string = "message";
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const wsConnections: Map<string, WebSocket> = new Map<string, WebSocket>();
            const messenger = new Messenger();

            const result: Result<string> = messenger.sendGameMessageToOne(gameId, participantId, messageType, null, gamePopulation, wsConnections);
            result.ok.should.be.false;
            result.message.should.equal(ErrorMessage.NoMessageProvided);
        });
        it("sendGameMessageToOne fails if no gamePopulation", () => {
            const gameId: string = "gameId";
            const participantId: string = "participantId";
            const messageType: MessageType = MessageType.GameStarted;
            const message: string = "message";
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const wsConnections: Map<string, WebSocket> = new Map<string, WebSocket>();
            const messenger = new Messenger();

            const result: Result<string> = messenger.sendGameMessageToOne(gameId, participantId, messageType, message, null, wsConnections);
            result.ok.should.be.false;
            result.message.should.equal(ErrorMessage.NoGamePopulationProvided);
        });
        it("sendGameMessageToOne fails if no connection list", () => {
            const gameId: string = "gameId";
            const participantId: string = "participantId";
            const messageType: MessageType = MessageType.GameStarted;
            const message: string = "message";
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const wsConnections: Map<string, WebSocket> = new Map<string, WebSocket>();
            const messenger = new Messenger();

            const result: Result<string> = messenger.sendGameMessageToOne(gameId, participantId, messageType, message, gamePopulation, null);
            result.ok.should.be.false;
            result.message.should.equal(ErrorMessage.NoConnectionListProvided);
        });
        it("sendGameMessageToOne fails if gameId not in gamePopulation", () => {
            const gameId: string = "gameId";
            const participantId: string = "participantId";
            const messageType: MessageType = MessageType.GameStarted;
            const message: string = "message";
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const participant: Participant = {
                userId: "not participantId",
                name: "name",
                numberOfDice: 5,
                roll: [],
                eliminated: false
            }
            const gameInterface: GameInterface = {
                started: false,
                finished: false,
                gameMessageLog: [],
                participants: [participant]
            }
            gamePopulation.set("some other gameId", gameInterface);
            const wsConnections: Map<string, WebSocket> = new Map<string, WebSocket>();
            const messenger = new Messenger();

            const result: Result<string> = messenger.sendGameMessageToOne(gameId, participantId, messageType, message, gamePopulation, wsConnections);
            result.ok.should.be.false;
            result.message.should.equal(ErrorMessage.GameNotFound);
        });
        it("sendGameMessageToOne fails if participant not in connection list", () => {
            const gameId: string = "gameId";
            const participantId: string = "participantId";
            const messageType: MessageType = MessageType.GameStarted;
            const message: string = "message";
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const participant: Participant = {
                userId: "not participantId",
                name: "name",
                numberOfDice: 5,
                roll: [],
                eliminated: false
            }
            const gameInterface: GameInterface = {
                started: false,
                finished: false,
                gameMessageLog: [],
                participants: [participant]
            }
            gamePopulation.set(gameId, gameInterface);
            const wsConnections: Map<string, WebSocket> = new Map<string, WebSocket>();
            const messenger = new Messenger();

            const result: Result<string> = messenger.sendGameMessageToOne(gameId, participantId, messageType, message, gamePopulation, wsConnections);
            result.ok.should.be.false;
            result.message.should.equal(ErrorMessage.ParticipantNotInConnectionList);
        });
        it("sendGameMessageToOne adds gameMessage to gameMessageLog", () => {
            const gameId: string = "gameId";
            const participantId: string = "participantId";
            const messageType: MessageType = MessageType.GameStarted;
            const message: string = "message";
            const gameMessage: GameMessage = {
                messageType,
                message
            }
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const participant: Participant = {
                userId: participantId,
                name: "name",
                numberOfDice: 5,
                roll: [],
                eliminated: false
            }
            const gameInterface: GameInterface = {
                started: false,
                finished: false,
                gameMessageLog: [],
                participants: [participant]
            }
            gamePopulation.set(gameId, gameInterface);
            const webSocket = new WebSocket("ws://localhost");
            const webSocketStub = sinon.stub(webSocket);
            const wsConnections: Map<string, WebSocket> = new Map<string, WebSocket>();
            wsConnections.set(participantId, webSocket);
            const messenger = new Messenger();

            const result: Result<string> = messenger.sendGameMessageToOne(gameId, participantId, messageType, message, gamePopulation, wsConnections);
            result.ok.should.be.true;
            expect(webSocketStub.send.calledOnce).to.be.true;
            webSocketStub.send.firstCall.args[0].should.equal(JSON.stringify(gameMessage));
            result.value.should.equal("message sent.");
        });
    });

    describe ("sendGameMessageToAll tests", () => {
        it("sendGameMessageToAll fails if no gameId", () => {
            // expect(true).to.be.false;
        });
    });
});