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
import logger from './logger';

logger.silent = true;

chai.should();

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

            const result: Result<string> = messenger.sendGameMessageToOne(null, participantId, messageType, message, gamePopulation);
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

            const result: Result<string> = messenger.sendGameMessageToOne(gameId, null, messageType, message, gamePopulation);
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

            const result: Result<string> = messenger.sendGameMessageToOne(gameId, participantId, null, message, gamePopulation);
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

            const result: Result<string> = messenger.sendGameMessageToOne(gameId, participantId, messageType, null, gamePopulation);
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

            const result: Result<string> = messenger.sendGameMessageToOne(gameId, participantId, messageType, message, null);
            result.ok.should.be.false;
            result.message.should.equal(ErrorMessage.NoGamePopulationProvided);
        });
        it("sendGameMessageToOne fails if no connection list", () => {
            const gameId: string = "gameId";
            const participantId: string = "participantId";
            const messageType: MessageType = MessageType.GameStarted;
            const message: string = "message";
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const messenger = new Messenger();

            const startingPlayer: Participant = {
                userId: "userId",
                name: "name",
                numberOfDice: 5,
                roll: [],
                eliminated: false
            };
            const gameInterface: GameInterface = {
                started: false,
                finished: false,
                gameMessageLog: [],
                participants: [startingPlayer]
            }
            gamePopulation.set(gameId, gameInterface);

            const result: Result<string> = messenger.sendGameMessageToOne(gameId, participantId, messageType, message, gamePopulation);
            result.ok.should.be.false;
            result.message.should.equal(ErrorMessage.ParticipantNotInConnectionList);
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
            const messenger = new Messenger();

            const result: Result<string> = messenger.sendGameMessageToOne(gameId, participantId, messageType, message, gamePopulation);
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
            const messenger = new Messenger();

            const result: Result<string> = messenger.sendGameMessageToOne(gameId, participantId, messageType, message, gamePopulation);
            result.ok.should.be.false;
            result.message.should.equal(ErrorMessage.ParticipantNotInConnectionList);
        });
        it("sendGameMessageToOne sends message successfully", () => {
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
            messenger.wsConnections = wsConnections;

            const result: Result<string> = messenger.sendGameMessageToOne(gameId, participantId, messageType, message, gamePopulation);
            result.ok.should.be.true;
            expect(webSocketStub.send.calledOnce).to.be.true;
            webSocketStub.send.firstCall.args[0].should.equal(JSON.stringify(gameMessage));
            result.value.should.equal("message sent.");
            gameInterface.gameMessageLog.length.should.equal(1);
            expect(gameInterface.gameMessageLog[0].message).to.equal(message);
            expect(gameInterface.gameMessageLog[0].messageType).to.equal(messageType);
        });
    });

    describe ("sendGameMessageToAll tests", () => {
        it("sendGameMessageToAll fails if no gameId", () => {
            const gameId: string = "gameId";
            const messageType: MessageType = MessageType.GameStarted;
            const message: string = "message";
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const messenger = new Messenger();

            const result: Result<string> = messenger.sendGameMessageToAll(null, messageType, message, gamePopulation);
            result.ok.should.be.false;
            result.message.should.equal(ErrorMessage.NoGameIDProvided);
        });
        it("sendGameMessageToAll fails if no messageType", () => {
            const gameId: string = "gameId";
            const messageType: MessageType = MessageType.GameStarted;
            const message: string = "message";
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const messenger = new Messenger();

            const result: Result<string> = messenger.sendGameMessageToAll(gameId, null, message, gamePopulation);
            result.ok.should.be.false;
            result.message.should.equal(ErrorMessage.NoMessageTypeProvided);
        });
        it("sendGameMessageToAll fails if no gamePopulation", () => {
            const gameId: string = "gameId";
            const messageType: MessageType = MessageType.GameStarted;
            const message: string = "message";
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const messenger = new Messenger();

            const result: Result<string> = messenger.sendGameMessageToAll(gameId, messageType, message, null);
            result.ok.should.be.false;
            result.message.should.equal(ErrorMessage.NoGamePopulationProvided);
        });
        it("sendGameMessageToAll fails if game doesn't exist", () => {
            const gameId: string = "gameId";
            const messageType: MessageType = MessageType.GameStarted;
            const message: string = "message";
            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const messenger = new Messenger();

            const result: Result<string> = messenger.sendGameMessageToAll(gameId, messageType, message, gamePopulation);
            result.ok.should.be.false;
            result.message.should.equal(ErrorMessage.GameNotFound);
        });
        it("sendGameMessageToAll sends message to both participants", () => {
            const startingPlayer: Participant = {
                userId: "userId",
                name: "name",
                numberOfDice: 5,
                roll: [],
                eliminated: false
            };
            const nextPlayer: Participant = {
                userId: "nextUserId",
                name: "next name",
                numberOfDice: 3,
                roll: [],
                eliminated: false
            }
            const gameId: string = "gameId";
            const messageType: MessageType = MessageType.GameStarted;
            const message: string = "test message";

            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const tempMessenger = new Messenger();
            const wsConnections: Map<string, WebSocket> = new Map<string, WebSocket>();

            const gameInterface: GameInterface = {
                started: false,
                finished: false,
                gameMessageLog: [],
                participants: [startingPlayer, nextPlayer]
            }
            gamePopulation.set(gameId, gameInterface);
            const startingWebSocket = new WebSocket("ws://localhost");
            const nextWebSocket = new WebSocket("ws://localhost");
            const startingPlayerWebSocketStub = sinon.stub(startingWebSocket);
            const nextPlayerWebSocketStub = sinon.stub(nextWebSocket);
            wsConnections.set(startingPlayer.userId, startingWebSocket);
            wsConnections.set(nextPlayer.userId, nextWebSocket);
            tempMessenger.wsConnections = wsConnections;

            const result = tempMessenger.sendGameMessageToAll(gameId, messageType, message, gamePopulation);
            result.ok.should.be.true;
            result.message.should.equal('message sent to 2 recipients');
            expect(startingPlayerWebSocketStub.send.calledOnce).to.be.true;
            const startingPlayerMessage = JSON.parse(startingPlayerWebSocketStub.send.firstCall.args[0]);
            startingPlayerMessage.message.should.equal(message);
            startingPlayerMessage.messageType.should.equal(messageType);

            expect(nextPlayerWebSocketStub.send.calledOnce).to.be.true;
            const nextPlayerMessage = JSON.parse(nextPlayerWebSocketStub.send.firstCall.args[0]);
            nextPlayerMessage.message.should.equal(message);
            nextPlayerMessage.messageType.should.equal(messageType);

            gameInterface.gameMessageLog.length.should.equal(1);
            expect(gameInterface.gameMessageLog[0].message).to.equal(message);
            expect(gameInterface.gameMessageLog[0].messageType).to.equal(messageType);
        });
        it("sendGameMessageToAll sends message to only 1 participants if second logged out.", () => {
            const startingPlayer: Participant = {
                userId: "userId",
                name: "name",
                numberOfDice: 5,
                roll: [],
                eliminated: false
            };
            const nextPlayer: Participant = {
                userId: "nextUserId",
                name: "next name",
                numberOfDice: 3,
                roll: [],
                eliminated: false
            }
            const gameId: string = "gameId";
            const messageType: MessageType = MessageType.GameStarted;
            const message: string = "test message";

            const gamePopulation: Map<string, GameInterface> = new Map<string, GameInterface>();
            const tempMessenger = new Messenger();
            const wsConnections: Map<string, WebSocket> = new Map<string, WebSocket>();

            const gameInterface: GameInterface = {
                started: false,
                finished: false,
                gameMessageLog: [],
                participants: [startingPlayer, nextPlayer]
            }
            gamePopulation.set(gameId, gameInterface);
            const startingWebSocket = new WebSocket("ws://localhost");
            const startingPlayerWebSocketStub = sinon.stub(startingWebSocket);
            wsConnections.set(startingPlayer.userId, startingWebSocket);
            tempMessenger.wsConnections = wsConnections;

            const result = tempMessenger.sendGameMessageToAll(gameId, messageType, message, gamePopulation);
            result.ok.should.be.true;
            result.message.should.equal('message sent to 1 recipients');
            expect(startingPlayerWebSocketStub.send.calledOnce).to.be.true;
            const startingPlayerMessage = JSON.parse(startingPlayerWebSocketStub.send.firstCall.args[0]);
            startingPlayerMessage.message.should.equal(message);
            startingPlayerMessage.messageType.should.equal(messageType);

            gameInterface.gameMessageLog.length.should.equal(1);
            expect(gameInterface.gameMessageLog[0].message).to.equal(message);
            expect(gameInterface.gameMessageLog[0].messageType).to.equal(messageType);
        });
    });
});