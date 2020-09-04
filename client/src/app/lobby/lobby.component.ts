import { Component, OnInit } from '@angular/core';
import { LobbyService } from '../services/lobby.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'liar-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss']
})
export class LobbyComponent implements OnInit {
  loggedIn: boolean = false;
  loggedInEmitter = new BehaviorSubject<boolean>(this.loggedIn);

  constructor(private lobbyService: LobbyService) {
  }

  onClickLogout(){
    this.lobbyService.logout().subscribe(success => this.loggedIn = false, error => console.log(error), () => this.loggedInEmitter.next(this.loggedIn));
    window.location.reload();
  }

  ngOnInit(): void {
    this.lobbyService.login().subscribe(success => this.loggedIn = true, error => console.log(error), () => this.loggedInEmitter.next(this.loggedIn));
  }

}