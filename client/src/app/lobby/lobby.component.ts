import { Component, OnInit } from '@angular/core';
import { Queue } from 'queue-typescript';
import { LobbyService } from '../services/lobby.service';

import { ServerMessageService } from '../services/server-message.service';
import { GameMessage, MessageType, RoundSetup, Participant, Claim, RoundResults } from '@ryanroundhouse/liars-dice-interface';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'liar-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss']
})
export class LobbyComponent implements OnInit {
  loggedIn: boolean = false;
  gameId: string;
  name: string = 'bob';
  gameStarted: boolean = false;
  yourTurn: boolean = false;
  mainMessage: string;
  dice: number[] = [];
  players: Participant[] = [];
  playerId: string;
  messages: GameMessage[] = [];
  quantity: number;
  value: number;
  messageQueue: Queue<GameMessage> = new Queue<GameMessage>();
  slowDown: boolean = false;

  constructor(private lobbyService: LobbyService, private messageService: ServerMessageService, private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.gameId = this.route.snapshot.params['gameId'];
    if (!this.playerId){
      this.lobbyService.login().subscribe(next => {
          console.log(next);
          this.playerId = next.value;
          this.loggedIn = true;
          this.slowDown = false;
          this.messageService.connect().subscribe(next => this.processGameMessage(next), error => console.error(`error when subscribing to messages: ${console.error}`));
        }, 
        error => console.log(`got a login error: ${error.error.message}`));
    }
  }

  onClickClaim(){
    this.lobbyService.claim(this.gameId, this.quantity, this.value, false, false).subscribe(next => {
        console.log(next);
        this.quantity = null;
        this.value = null;
      }, 
      error => console.error(error.error.message)
    );
  }

  onClickCheat(){
    this.lobbyService.claim(this.gameId, null, null, false, true).subscribe(next => {
        console.log(next);
        this.yourTurn = false;
        this.quantity = null;
        this.value = null;
      }, 
      error => console.error(error.error.message)
    );
  }

  onClickBangOn(){
    this.lobbyService.claim(this.gameId, null, null, true, false).subscribe(next => {
        console.log(next);
        this.yourTurn = false;
        this.quantity = null;
        this.value = null;
      }, 
      error => console.error(error.error.message)
    );
  }

  onClickLogout(){
    this.lobbyService.logout().subscribe(next => this.loggedIn = false, error => console.log(error.error.message));
    this.messageService.disconnect();
  }

  onClickLogin(){
  }

  onClickJoinGame(){
    this.lobbyService.joinGame(this.gameId, this.name).subscribe(next => {
        console.log('got join game response: ' + JSON.stringify(next));
        const existingPlayers: Participant[] = next.value;
        this.players = this.players.concat(existingPlayers);
      }, 
      error => console.log(error.error.message));
  }

  onClickCreateGame(){
    this.lobbyService.createGame().subscribe(next => {
        this.gameId = next.value;
        console.log(next);
      }, 
      error => console.log(error));
  }

  onClickStartGame(){
    this.lobbyService.startGame(this.gameId).subscribe(next => this.gameStarted = true, error => console.log(error.error.message));
  }

  processRoundResults(results: RoundResults){
    let message: string = `${results.callingPlayer.name} called ${results.claim.bangOn ? "cheat" : "bang on"} on ${results.calledPlayer.name}.  `;
    message += `They were ${results.claimSuccess ? "wrong! " : "right! "} They had ${this.countNumberOfThatRoll(results.calledPlayer.roll, results.claim.value)} ${results.claim.value}s.`;
    if (results.playerEliminated){
      message += " They are eliminated from the game.";
    }
    this.mainMessage = message;
  }

  processRoundStarted(roundSetup: RoundSetup){
    this.dice = roundSetup.participant.roll;
    if (roundSetup.startingPlayer){
      this.yourTurn = true;
      this.mainMessage = "It's your turn.  Make a claim.";
    }
    else{
      this.mainMessage = "It's someone else's turn.";
    }
  }

  processClaim(claim: Claim){
    const lastPlayer = this.players.find(player => player.userId === claim.playerId);
    let message: string = "";
    if (!claim.bangOn && !claim.cheat){
      message = lastPlayer.name + " claimed " + claim.quantity + " " + claim.value + "s.  It's ";
    }

    if (claim.nextPlayerId === this.playerId){
      message += "your turn.";
      this.yourTurn = true;
    }
    else{
      const nextPlayer = this.players.find(player => player.userId === claim.nextPlayerId);
      message += nextPlayer.name + "'s turn.";
      this.yourTurn = false;
    }

    this.mainMessage = message;
  }

  processPlayerJoined(participant: Participant){
    this.mainMessage = `${participant.name} has joined the game.`;
    this.players.push(participant);
  }

  processGameStarted(){
    this.gameStarted = true;
    this.mainMessage = "game has started.";
  }

  processGameOver(participant: Participant){
    this.mainMessage = `Congrats to ${participant.name}!  They win!`;
    this.gameStarted = false;
    this.gameId = null;
    this.players = [];
  }

  private processNextMessage(){
    console.log("started processing next message...");
    if (this.messageQueue.length > 0){
      const gameMessage = this.messageQueue.dequeue();
      console.log(`There's something in the queue: ${JSON.stringify(gameMessage)}`);
      switch (gameMessage.messageType){
        case MessageType.GameStarted:{
          this.processGameStarted();
          break;
        }
        case MessageType.RoundResults:{
          this.processRoundResults(gameMessage.message as RoundResults);
          break;
        }
        case MessageType.RoundStarted:{
          this.processRoundStarted(gameMessage.message as RoundSetup);
          break;
        }
        case MessageType.Claim:{
          this.processClaim(gameMessage.message as Claim);
          break;
        }
        case MessageType.PlayerJoined:{
          this.processPlayerJoined(gameMessage.message as Participant);
          break;
        }
        case MessageType.GameOver:{
          this.processGameOver(gameMessage.message as Participant);
          break;
        }
      }
      setTimeout(() => {
        // console.log("timeout expired.");
        this.processNextMessage();
      }, 5000);
    }
    else{
      console.log('no more messages to process.  clearing slowdown.');
      this.slowDown = false;
    }
  }

  processGameMessage(gameMessage: GameMessage){
    console.log('message received: ' + JSON.stringify(gameMessage));
    this.messages.push(gameMessage);
    this.messageQueue.enqueue(gameMessage);
    if (!this.slowDown){
      console.log("no message loop processing.  Kick it off.");
      this.slowDown = true;
      this.processNextMessage();
    }
    else{
      console.log("message loop running.  Wait for the right time.");
    }
  }

  private countNumberOfThatRoll(roll: number[], value: number){
    let count = 0;
    for(const die of roll){
        if(+die === +value){
            count++;
        }
    }
    return count;
  }
}