import { Component, OnInit } from '@angular/core';
import { LobbyService } from '../services/lobby.service';

import { ServerMessageService } from '../services/server-message.service';
import { GameMessage, MessageType, RoundSetup, Participant } from '@ryanroundhouse/liars-dice-interface';

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
  dice: number[] = [];
  players: Participant[] = [];
  messages: GameMessage[] = [];

  constructor(private lobbyService: LobbyService, private messageService: ServerMessageService) {
  }

  onClickLogout(){
    this.lobbyService.logout().subscribe(next => this.loggedIn = false, error => console.log(error.error.message));
    this.messageService.disconnect();
  }

  onClickLogin(){
    this.lobbyService.login().subscribe(next => {
        this.loggedIn = true;
        this.messageService.connect().subscribe(next => this.processGameMessage(next));
      }, 
      error => console.log('got a login error: ' + error.error.message));
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

  processGameMessage(gameMessage: GameMessage){
    console.log('message received: ' + JSON.stringify(gameMessage));
    this.messages.push(gameMessage);
    switch (gameMessage.messageType){
      case MessageType.GameStarted:{
        this.gameStarted = true;
        break;
      }
      case MessageType.RoundStarted:{
        const roundSetup = gameMessage.message as RoundSetup;
        this.dice = roundSetup.participant.roll;
        break;
      }
      case MessageType.PlayerJoined:{
        const newParticipants = gameMessage.message as Participant;
        this.players.push(newParticipants);
        break;
      }
    }
  }

  ngOnInit(): void {
  }

}