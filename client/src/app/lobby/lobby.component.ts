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
  loggedInEmitter = new BehaviorSubject<boolean>(this.loggedIn);
  gameStartedEmitter = new BehaviorSubject<boolean>(this.gameStarted);
  gameIdEmitter = new BehaviorSubject<string>(this.gameId);

  constructor(private lobbyService: LobbyService, private messageService: ServerMessageService) {
  }

  onClickLogout(){
    this.lobbyService.logout().subscribe(success => this.loggedIn = false, error => console.log(error), () => this.loggedInEmitter.next(this.loggedIn));
    window.location.reload();
  }

  onClickLogin(){
    this.lobbyService.login().subscribe(success => this.loggedIn = true, error => console.log(error), () => this.loggedInEmitter.next(this.loggedIn));
  }

  onClickCreateGame(){
    this.lobbyService.createGame().subscribe(success => this.gameId = success.value, error => console.log(error), () => this.gameIdEmitter.next(this.gameId));
  }

  onClickStartGame(){
    this.lobbyService.startGame('100').subscribe(success => this.gameStarted = true, error => console.log(error), () => this.gameStartedEmitter.next(this.gameStarted));
  }

  ngOnInit(): void {
    this.lobbyService.login().subscribe(success => this.loggedIn = true, error => console.log(error), () => this.loggedInEmitter.next(this.loggedIn));
    this.messageService.messages.subscribe(msg => {console.log('message received: ' + msg);});
  }

}