import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LobbyService } from '../services/lobby.service';
import { NameGeneratorService } from '../services/name-generator.service';

@Component({
  selector: 'liar-splash',
  templateUrl: './splash.component.html',
  styleUrls: ['./splash.component.scss'],
})
class SplashComponent implements OnInit {
  constructor(
    private lobbyService: LobbyService,
    private nameGeneratorService: NameGeneratorService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.lobbyService.login().subscribe(
      (next) => {
        console.log(`login result: ${JSON.stringify(next)}`);
        if (next.value.gameId) {
          console.log(`in a game... send to lobby.`);
          this.router.navigate(['/lobby', next.value.gameId]);
        }
      },
      (error) => {
        console.log(`got a login error: ${error.error.message}`);
      },
    );
  }

  onClickCreateGame() {
    this.lobbyService.createGame().subscribe(
      (createGameResponse) => {
        this.lobbyService
          .joinGame(createGameResponse.value, this.nameGeneratorService.generateName())
          .subscribe(
            (next) => {
              console.log(`join game result: ${JSON.stringify(next)}`);
              this.router.navigate(['/lobby', createGameResponse.value]);
            },
            (error) => {
              console.error(`got a join game error: ${error.error.message}`);
            },
          );
      },
      (error) => {
        console.error(`got a create game error: ${error.error.message}`);
      },
    );
  }
}
export { SplashComponent as default };
