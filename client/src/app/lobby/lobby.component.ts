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
  gameStarted: boolean = false;
  dice: number[] = [];
  players: Participant[] = [];
  messages: GameMessage[] = [{messageType: 1, message: 'so'}];

  constructor(private lobbyService: LobbyService, private messageService: ServerMessageService) {
  }

  onClickLogout(){
    this.lobbyService.logout().subscribe(success => this.loggedIn = false, error => console.log(error.error.message));
    this.lobbyService.includeCredentials = false;
    window.location.reload();
  }

  onClickLogin(){
    this.lobbyService.login().subscribe(success => {
        this.loggedIn = true;
        this.lobbyService.includeCredentials = true;
        this.messageService.openWebSocket();
        this.messageService.messages.subscribe(msg => this.processGameMessage);
      }, 
      error => console.log(error.error.message));
  }

  onClickJoinGame(){
    this.lobbyService.joinGame(this.gameId).subscribe(success => console.log(success), error => console.log(error.error.message));
  }

  onClickCreateGame(){
    this.lobbyService.createGame().subscribe(success => {
        this.gameId = success.value;
        console.log(success);
      }, 
      error => console.log(error));
  }

  onClickStartGame(){
    this.lobbyService.startGame(this.gameId).subscribe(success => this.gameStarted = true, error => console.log(error.error.message));
  }

  processGameMessage(gameMessage: GameMessage){
    console.log('message received: ' + JSON.stringify(gameMessage));
    this.messages.push(gameMessage);
    switch (gameMessage.messageType){
      case MessageType.GameStarted:{
        break;
      }
      case MessageType.RoundStarted:{
        const roundSetup = gameMessage.message as RoundSetup;
        this.dice = roundSetup.participant.roll;
      }
      case MessageType.PlayerJoined:{
        const newParticipants = gameMessage.message as Participant[];
        newParticipants.forEach(participant => this.players.push(participant));
        break;
      }
    }
  }

  ngOnInit(): void {
  }

}