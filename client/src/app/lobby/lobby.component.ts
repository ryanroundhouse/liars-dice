import { Component, OnInit } from '@angular/core';
import { LobbyService } from '../services/lobby.service';
import { BehaviorSubject } from 'rxjs';

import { ServerMessageService } from '../services/server-message.service';

@Component({
  selector: 'liar-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss']
})
export class LobbyComponent implements OnInit {
  loggedIn: boolean = false;
  gameId: string;
  gameStarted: boolean = false;

  constructor(private lobbyService: LobbyService, private messageService: ServerMessageService) {
  }

  onClickLogout(){
    this.lobbyService.logout().subscribe(success => this.loggedIn = false, error => console.log(error.error.message));
    window.location.reload();
  }

  onClickLogin(){
    this.lobbyService.login().subscribe(success => this.loggedIn = true, error => console.log(error.error.message));
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

  ngOnInit(): void {
    this.lobbyService.login().subscribe(success => {
        this.loggedIn = true;
        this.messageService.openWebSocket();
        this.messageService.messages.subscribe(msg => {console.log('message received: ' + msg);});
      }, 
      error => console.log(error.error.message));
  }

}