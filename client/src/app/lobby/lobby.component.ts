import { Component, OnInit } from '@angular/core';
import { Queue } from 'queue-typescript';
import { faClipboard, faSignOutAlt, IconDefinition } from '@fortawesome/free-solid-svg-icons';

import {
  GameMessage,
  MessageType,
  RoundSetup,
  Participant,
  Claim,
  RoundResults,
  UiGameMessage,
  GameOver,
  NameChange,
} from '@ryanroundhouse/liars-dice-interface';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { ServerMessageService } from '../services/server-message.service';
import { NameGeneratorService } from '../services/name-generator.service';
import { LobbyService } from '../services/lobby.service';

@Component({
  selector: 'liar-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss'],
})
export class LobbyComponent implements OnInit {
  loggedIn = false;

  gameId: string;

  joinLink: string;

  name: string;

  minQuantity = 1;

  gameStarted = false;

  yourTurn = false;

  mainMessage: string;

  dice: number[] = [];

  debug = false;

  gameOver = false;

  gameOverMessage: string;

  players: Participant[] = [];

  playerId: string;

  playerTurn: string;

  messages: GameMessage[] = [];

  quantity: number;

  value: number;

  lastClaim: Claim;

  messageQueue: Queue<UiGameMessage> = new Queue<UiGameMessage>();

  slowDown = false;

  faClipboard: IconDefinition = faClipboard;

  faSignOutAlt: IconDefinition = faSignOutAlt;

  constructor(
    private lobbyService: LobbyService,
    private messageService: ServerMessageService,
    nameGeneratorService: NameGeneratorService,
    private router: Router,
  ) {
    this.name = nameGeneratorService.generateName();
  }

  ngOnInit(): void {
    if (!this.playerId) {
      this.lobbyService.login().subscribe(
        (loginResponse) => {
          console.log(loginResponse);
          this.playerId = loginResponse.value.userId;
          if (loginResponse.value.name) {
            this.name = loginResponse.value.name;
          }
          this.loggedIn = true;
          this.slowDown = false;
          this.gameOver = false;
          this.messageService.connect().subscribe(
            (connectResponse) => this.processGameMessage(connectResponse, 0),
            (error) => console.error(`error when subscribing to messages: ${error}`),
          );
          if (loginResponse.value.gameId) {
            this.setGameId(loginResponse.value.gameId);
            this.lobbyService.getGameState(this.gameId).subscribe(
              (getGameDateResponse) => {
                const messages = getGameDateResponse.value;
                messages.forEach((message) => {
                  this.processGameMessage(message, 0);
                });
              },
              (error) => console.error(`error fetching game state: ${error}`),
            );
          }
        },
        (error) => console.log(`got a login error: ${error.error.message}`),
      );
    }
  }

  onClickLogout() {
    this.lobbyService.logout().subscribe(
      () => {
        this.loggedIn = false;
      },
      (error) => console.log(error.error.message),
    );
    this.messageService.disconnect();
    this.router.navigate(['/']);
  }

  setGameId(newGameId: string) {
    this.gameId = newGameId;
    if (!newGameId) {
      this.joinLink = null;
    } else {
      this.joinLink = `${environment.ssl}://${window.location.host}/join/${newGameId}`;
    }
  }

  onClickBackToLobby() {
    this.router.navigate(['/']);
  }

  onClaim(event: Claim) {
    this.lobbyService
      .claim(this.gameId, event.quantity, event.value, event.bangOn, event.cheat)
      .subscribe(
        (next) => {
          console.log(next);
          this.quantity = null;
          this.value = null;
          this.yourTurn = false;
        },
        (error) => console.error(error.error.message),
      );
  }

  onClickCopyGameLink(inputElement) {
    inputElement.select();
    document.execCommand('copy');
    inputElement.setSelectionRange(0, 0);
  }

  onClickCreateGame() {
    this.lobbyService.createGame().subscribe(
      (createGameResponse) => {
        this.setGameId(createGameResponse.value);
        console.log(createGameResponse);
        this.lobbyService.joinGame(this.gameId, this.name).subscribe(
          (joinGameResponse) => {
            console.log(`got join game response: ${JSON.stringify(joinGameResponse)}`);
            const existingPlayers: Participant[] = joinGameResponse.value;
            this.players = this.players.concat(existingPlayers);
          },
          (joinGameError) => console.log(joinGameError.error.message),
        );
      },
      (createGameError) => console.log(createGameError),
    );
  }

  onClickStartGame() {
    this.lobbyService.startGame(this.gameId).subscribe(
      () => {
        this.gameStarted = true;
      },
      (error) => console.log(error.error.message),
    );
  }

  processRoundResults(results: RoundResults) {
    this.lastClaim = null;
    let message = `${results.callingPlayer.name} called ${
      results.claim.bangOn ? 'cheat' : 'bang on'
    } on ${results.calledPlayer.name}.  `;
    message += `They were ${
      results.claimSuccess ? 'wrong! ' : 'right! '
    } They had ${this.countNumberOfThatRoll(results.calledPlayer.roll, results.claim.value)} ${
      results.claim.value
    }s.`;
    if (results.playerEliminated) {
      message += ' They are eliminated from the game.';
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
    } else {
      this.mainMessage = "It's someone else's turn.";
      this.yourTurn = false;
    }
  }

  processClaim(claim: Claim) {
    const lastPlayer = this.players.find((player) => player.userId === claim.playerId);
    let message = '';
    if (!claim.bangOn && !claim.cheat) {
      message = `${lastPlayer.name} claimed ${claim.quantity} ${claim.value}s.  It's `;
    }

    this.lastClaim = claim;
    this.playerTurn = claim.nextPlayerId;
    if (this.playerTurn === this.playerId) {
      message += 'your turn.';
      this.yourTurn = true;
    } else {
      const nextPlayer = this.players.find((player) => player.userId === claim.nextPlayerId);
      message += `${nextPlayer.name}'s turn.`;
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
    this.mainMessage = 'game has started.';
  }

  processGameOver(gameOverMessage: GameOver) {
    this.gameOver = true;
    if (gameOverMessage.winner.userId === this.playerId) {
      this.gameOverMessage = `Congrats!  You win!`;
    } else {
      this.gameOverMessage = `Congrats to ${gameOverMessage.winner.name} on their win!  Better luck next time.`;
    }
    this.gameStarted = false;
    this.setGameId(null);
    this.players = [];
  }

  private processNextMessage() {
    console.log('started processing next message...');
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
          break;
        }
        default: {
          console.log('unexpected message type');
        }
      }
      setTimeout(() => {
        // console.log("timeout expired.");
        this.processNextMessage();
      }, secondsDelay * 1000);
    } else {
      console.log('no more messages to process.  clearing slowdown.');
      this.slowDown = false;
    }
  }

  processNameChange(nameChange: NameChange) {
    console.log(`processing name change event: ${JSON.stringify(nameChange)}`);
    const player = this.players.find((foundPlayer) => foundPlayer.userId === nameChange.playerId);
    if (!player) {
      console.error(`player not found.`);
    } else {
      this.mainMessage = `${player.name} changed their name to ${nameChange.name}`;
      player.name = nameChange.name;
    }
  }

  processGameMessage(gameMessage: GameMessage, seconds: number) {
    console.log(`message received: ${JSON.stringify(gameMessage)}`);
    this.messages.push(gameMessage);
    const uiGameMessage: UiGameMessage = { gameMessage, secondsDelay: seconds };
    this.messageQueue.enqueue(uiGameMessage);
    if (!this.slowDown) {
      console.log('no message loop processing.  Kick it off.');
      this.slowDown = true;
      this.processNextMessage();
    } else {
      console.log('message loop running.  Wait for the right time.');
    }
  }

  private countNumberOfThatRoll(roll: number[], value: number) {
    let count = 0;
    roll.forEach((die) => {
      if (+die === +value) {
        count += 1;
      }
    });
    return count;
  }
}
