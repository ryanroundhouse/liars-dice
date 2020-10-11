process.env.NODE_ENV = 'dev'
/* tslint:disable:no-unused-expression */

import "mocha";
import { Player } from "./player";
import { Messenger } from "./messenger";
import { GameInterface, Participant, Result } from "@ryanroundhouse/liars-dice-interface";
import { ErrorMessage } from "./enums/errorMessage";
import sinon from "sinon";
import { assert, expect } from "chai";

describe("player functionality", () => {
    describe("update player", () => {
        it ("can't update player if no userId provided", () => {
            const player = new Player(new Messenger());
            const playerId = "playerId";
            const gameId = "gameId";
            const name = "name";
            const result: Result<string> = player.updatePlayer(null, gameId, name, new Map<string, GameInterface>());
            result.ok.should.be.false;
            result.message.should.equal(ErrorMessage.NoUserIDProvided);
        });
        it ("can't update player if no gameId provided", () => {
            const player = new Player(new Messenger());
            const playerId = "playerId";
            const gameId = "gameId";
            const name = "name";
            const result: Result<string> = player.updatePlayer(playerId, null, name, new Map<string, GameInterface>());
            result.ok.should.be.false;
            result.message.should.equal(ErrorMessage.NoGameIDProvided);
        });
        it ("can't update player if no name provided", () => {
            const player = new Player(new Messenger());
            const playerId = "playerId";
            const gameId = "gameId";
            const name = "name";
            const result: Result<string> = player.updatePlayer(playerId, gameId, null, new Map<string, GameInterface>());
            result.ok.should.be.false;
            result.message.should.equal(ErrorMessage.NoNameProvided);
        });
        it ("can't update player if no gamePopulation provided", () => {
            const player = new Player(new Messenger());
            const playerId = "playerId";
            const gameId = "gameId";
            const name = "name";
            const result: Result<string> = player.updatePlayer(playerId, gameId, name, null);
            result.ok.should.be.false;
            result.message.should.equal(ErrorMessage.NoGamePopulationProvided);
        });
        it ("can't update player if no game not found", () => {
            const player = new Player(new Messenger());
            const playerId = "playerId";
            const gameId = "gameId";
            const name = "name";
            const gamePopulation = new Map<string, GameInterface>();
            const participant: Participant = {
                userId: playerId,
                name,
                numberOfDice: 5,
                roll: null,
                eliminated: false
            }
            const gameInterface: GameInterface = {
                started: false,
                finished: false,
                gameMessageLog: null,
                participants: [participant]
            }
            gamePopulation.set("not gameId", gameInterface);
            const result: Result<string> = player.updatePlayer(playerId, gameId, name, gamePopulation);
            result.ok.should.be.false;
            result.message.should.equal(ErrorMessage.GameNotFound);
        });
        it ("can't update player if player not in game", () => {
            const player = new Player(new Messenger());
            const playerId = "playerId";
            const gameId = "gameId";
            const name = "name";
            const gamePopulation = new Map<string, GameInterface>();
            const participant: Participant = {
                userId: "not playerId",
                name,
                numberOfDice: 5,
                roll: null,
                eliminated: false
            }
            const gameInterface: GameInterface = {
                started: false,
                finished: false,
                gameMessageLog: null,
                participants: [participant]
            }
            gamePopulation.set(gameId, gameInterface);
            const result: Result<string> = player.updatePlayer(playerId, gameId, name, gamePopulation);
            result.ok.should.be.false;
            result.message.should.equal(ErrorMessage.PlayerNotFound);
        });
        it ("can't update player if game already started", () => {
            const player = new Player(new Messenger());
            const playerId = "playerId";
            const gameId = "gameId";
            const name = "name";
            const gamePopulation = new Map<string, GameInterface>();
            const participant: Participant = {
                userId: "not playerId",
                name,
                numberOfDice: 5,
                roll: null,
                eliminated: false
            }
            const gameInterface: GameInterface = {
                started: true,
                finished: false,
                gameMessageLog: null,
                participants: [participant]
            }
            gamePopulation.set(gameId, gameInterface);
            const result: Result<string> = player.updatePlayer(playerId, gameId, name, gamePopulation);
            result.ok.should.be.false;
            result.message.should.equal(ErrorMessage.GameAlreadyStarted);
        });
        it ("can change name", () => {
            const messenger = new Messenger();
            const messengerStub = sinon.stub(messenger);
            messengerStub.sendGameMessageToAll.returns({ok: true});
            const player = new Player(messengerStub);
            const playerId = "playerId";
            const gameId = "gameId";
            const name = "name";
            const gamePopulation = new Map<string, GameInterface>();
            const participant: Participant = {
                userId: playerId,
                name,
                numberOfDice: 5,
                roll: null,
                eliminated: false
            }
            const gameInterface: GameInterface = {
                started: false,
                finished: false,
                gameMessageLog: null,
                participants: [participant]
            }
            gamePopulation.set(gameId, gameInterface);
            const result: Result<string> = player.updatePlayer(playerId, gameId, name, gamePopulation);
            result.ok.should.be.true;
            expect(messengerStub.sendGameMessageToAll.calledOnce).to.be.true;
        });
        it ("changes the correct player's name", () => {
            const messenger = new Messenger();
            const messengerStub = sinon.stub(messenger);
            messengerStub.sendGameMessageToAll.returns({ok: true});
            const player = new Player(messengerStub);
            const playerId = "playerId";
            const wrongPlayerId = "wrongPlayerId";
            const gameId = "gameId";
            const name = "name";
            const wrongName = "wrongName";
            const newName = "newName";
            const gamePopulation = new Map<string, GameInterface>();
            const participant: Participant = {
                userId: playerId,
                name,
                numberOfDice: 5,
                roll: null,
                eliminated: false,
            }
            const wrongParticipant: Participant = {
                userId: wrongPlayerId,
                name: wrongName,
                numberOfDice: 5,
                roll: null,
                eliminated: false,
            }
            const gameInterface: GameInterface = {
                started: false,
                finished: false,
                gameMessageLog: null,
                participants: [participant, wrongParticipant],
            }
            gamePopulation.set(gameId, gameInterface);
            const result: Result<string> = player.updatePlayer(playerId, gameId, newName, gamePopulation);
            result.ok.should.be.true;
            assert.equal(participant.name, newName, "name not updated.");
            assert.equal(wrongParticipant.name, wrongName, "wrong name updated.");
            expect(messengerStub.sendGameMessageToAll.calledOnce).to.be.true;
        });
    });
});