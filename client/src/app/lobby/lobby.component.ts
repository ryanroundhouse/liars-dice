import { Component, OnInit } from '@angular/core';
import { Queue } from 'queue-typescript';
import { LobbyService } from '../services/lobby.service';
import { NameGeneratorService } from '../services/name-generator.service';

import { ServerMessageService } from '../services/server-message.service';
import { GameMessage, MessageType, RoundSetup, Participant, Claim, RoundResults, UiGameMessage, GameOver, NameChange } from '@ryanroundhouse/liars-dice-interface';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'liar-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss']
})
export class LobbyComponent implements OnInit {
  loggedIn: boolean = false;
  gameId: string;
  joinLink: string;
  name: string;
  minQuantity: number = 1;
  gameStarted: boolean = false;
  yourTurn: boolean = false;
  mainMessage: string;
  dice: number[] = [];

  players: Participant[] = [];
  playerId: string;
  playerTurn: string;

  messages: GameMessage[] = [];
  quantity: number;
  value: number;
  lastClaim: Claim;
  messageQueue: Queue<UiGameMessage> = new Queue<UiGameMessage>();
  slowDown: boolean = false;

  constructor(private lobbyService: LobbyService, private messageService: ServerMessageService, private nameGeneratorService: NameGeneratorService) {
    this.name = nameGeneratorService.generateName();
  }

  ngOnInit(): void {
    if (!this.playerId) {
      this.lobbyService.login().subscribe(next => {
        console.log(next);
        this.playerId = next.value.userId;
        if (next.value.name){
          this.name = next.value.name;
        }
        this.loggedIn = true;
        this.slowDown = false;
        this.messageService.connect().subscribe(next => this.processGameMessage(next, 0), error => console.error(`error when subscribing to messages: ${console.error}`));
        if (next.value.gameId) {
          this.setGameId(next.value.gameId);
          this.lobbyService.getGameState(this.gameId).subscribe(next => {
            const messages = next.value;
            messages.forEach(message => { this.processGameMessage(message, 0) });
          },
            error => console.error(`error fetching game state: ${error}`)
          )
        }
      },
        error => console.log(`got a login error: ${error.error.message}`));
    }
  }

  setGameId(newGameId: string) {
    this.gameId = newGameId;
    if (!newGameId) {
      this.joinLink = null;
    }
    else {
      this.joinLink = `http://localhost:4201/join/${newGameId}`;
    }
  }

  onClaim(event: Claim) {
    this.lobbyService.claim(this.gameId, event.quantity, event.value, event.bangOn, event.cheat).subscribe(next => {
      console.log(next);
      this.quantity = null;
      this.value = null;
      this.yourTurn = false;
    },
      error => console.error(error.error.message)
    );
  }

  onClickCopyGameLink(inputElement) {
    inputElement.select();
    document.execCommand('copy');
    inputElement.setSelectionRange(0, 0);
  }

  onClickSetName(userName: string){
    if (userName.length <= 0){
      console.log(`can't set username to blank value`);
      return;
    }
    console.log(`setting username to ${userName}`);
    this.lobbyService.setName(this.gameId, userName).subscribe(
      next => console.log(`username updated successfully`), 
      error => console.error(`username update failed: ${JSON.stringify(error)}`));
  }

  onClickLogout() {
    this.lobbyService.logout().subscribe(next => this.loggedIn = false, error => console.log(error.error.message));
    this.messageService.disconnect();
    window.location.reload();
  }

  onClickCreateGame() {
    this.lobbyService.createGame().subscribe(next => {
      this.setGameId(next.value);
      console.log(next);
      this.lobbyService.joinGame(this.gameId, this.name).subscribe(next => {
        console.log('got join game response: ' + JSON.stringify(next));
        const existingPlayers: Participant[] = next.value;
        this.players = this.players.concat(existingPlayers);
      },
        error => console.log(error.error.message));
    },
      error => console.log(error));
  }

  onClickStartGame() {
    this.lobbyService.startGame(this.gameId).subscribe(next => this.gameStarted = true, error => console.log(error.error.message));
  }

  processRoundResults(results: RoundResults) {
    this.lastClaim = null;
    let message: string = `${results.callingPlayer.name} called ${results.claim.bangOn ? "cheat" : "bang on"} on ${results.calledPlayer.name}.  `;
    message += `They were ${results.claimSuccess ? "wrong! " : "right! "} They had ${this.countNumberOfThatRoll(results.calledPlayer.roll, results.claim.value)} ${results.claim.value}s.`;
    if (results.playerEliminated) {
      message += " They are eliminated from the game.";
    }
    this.mainMessage = message;
  }

  processRoundStarted(roundSetup: RoundSetup) {
    this.dice = roundSetup.participant.roll;
    this.minQuantity = 1;
    this.playerTurn = roundSetup.startingPlayerId;
    if (this.playerTurn === this.playerId) {
      this.yourTurn = true;
      this.mainMessage = "It's your turn.  Make a claim.";
    }
    else {
      this.mainMessage = "It's someone else's turn.";
      this.yourTurn = false;
    }
  }

  processClaim(claim: Claim) {
    const lastPlayer = this.players.find(player => player.userId === claim.playerId);
    let message: string = "";
    if (!claim.bangOn && !claim.cheat) {
      message = lastPlayer.name + " claimed " + claim.quantity + " " + claim.value + "s.  It's ";
    }

    this.lastClaim = claim;
    this.playerTurn = claim.nextPlayerId;
    if (this.playerTurn === this.playerId) {
      message += "your turn.";
      this.yourTurn = true;
    }
    else {
      const nextPlayer = this.players.find(player => player.userId === claim.nextPlayerId);
      message += nextPlayer.name + "'s turn.";
      this.yourTurn = false;
    }
    this.minQuantity = Number(claim.quantity) + 1;
    this.mainMessage = message;
  }

  processPlayerJoined(participant: Participant) {
    this.mainMessage = `${participant.name} has joined the game.`;
    this.players.push(participant);
  }

  processGameStarted() {
    this.gameStarted = true;
    this.mainMessage = "game has started.";
  }

  processGameOver(gameOver: GameOver) {
    if (gameOver.winner.userId === this.playerId) {
      this.mainMessage = `Congrats!  You win!`;
    }
    else {
      this.mainMessage = `Congrats to ${gameOver.winner.name} on their win!  Better luck next time.`;
    }
    this.gameStarted = false;
    this.setGameId(null);
    this.players = [];
  }

  private processNextMessage() {
    console.log("started processing next message...");
    let secondsDelay = 0;
    if (this.messageQueue.length > 0) {
      const uiGameMessage: UiGameMessage = this.messageQueue.dequeue();
      console.log(`There's something in the queue: ${JSON.stringify(uiGameMessage)}`);
      switch (uiGameMessage.gameMessage.messageType) {
        case MessageType.GameStarted: {
          this.processGameStarted();
          break;
        }
        case MessageType.RoundResults: {
          secondsDelay = 5;
          this.processRoundResults(uiGameMessage.gameMessage.message as RoundResults);
          break;
        }
        case MessageType.RoundStarted: {
          this.processRoundStarted(uiGameMessage.gameMessage.message as RoundSetup);
          break;
        }
        case MessageType.Claim: {
          this.processClaim(uiGameMessage.gameMessage.message as Claim);
          break;
        }
        case MessageType.PlayerJoined: {
          this.processPlayerJoined(uiGameMessage.gameMessage.message as Participant);
          break;
        }
        case MessageType.GameOver: {
          this.processGameOver(uiGameMessage.gameMessage.message as GameOver);
          break;
        }
        case MessageType.NameChangeMessage: {
          this.processNameChange(uiGameMessage.gameMessage.message as NameChange);
        }
      }
      setTimeout(() => {
        // console.log("timeout expired.");
        this.processNextMessage();
      }, secondsDelay * 1000);
    }
    else {
      console.log('no more messages to process.  clearing slowdown.');
      this.slowDown = false;
    }
  }
  processNameChange(nameChange: NameChange) {
    console.log(`processing name change event: ${JSON.stringify(nameChange)}`);
    let player = this.players.find(player => player.userId === nameChange.playerId);
    let nameChangeMessage: string;
    if (!player){
      console.error(`player not found.`);
    }
    else{
      this.mainMessage = `${player.name} changed their name to ${nameChange.name}`;
      player.name = nameChange.name;
    }
  }

  processGameMessage(gameMessage: GameMessage, seconds: number) {
    console.log('message received: ' + JSON.stringify(gameMessage));
    this.messages.push(gameMessage);
    const uiGameMessage: UiGameMessage = { gameMessage: gameMessage, secondsDelay: seconds };
    this.messageQueue.enqueue(uiGameMessage);
    if (!this.slowDown) {
      console.log("no message loop processing.  Kick it off.");
      this.slowDown = true;
      this.processNextMessage();
    }
    else {
      console.log("message loop running.  Wait for the right time.");
    }
  }

  private countNumberOfThatRoll(roll: number[], value: number) {
    let count = 0;
    for (const die of roll) {
      if (+die === +value) {
        count++;
      }
    }
    return count;
  }
}