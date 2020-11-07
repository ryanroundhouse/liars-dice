import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LobbyService } from '../services/lobby.service';
import { NameGeneratorService } from '../services/name-generator.service';

@Component({
  selector: 'liar-join',
  templateUrl: './join.component.html',
  styleUrls: ['./join.component.scss'],
})
export class JoinComponent implements OnInit {
  gameId: string;

  errorMessage: string;

  constructor(
    private lobbyService: LobbyService,
    private route: ActivatedRoute,
    private router: Router,
    private nameGeneratorService: NameGeneratorService,
  ) {}

  ngOnInit(): void {
    console.log(`in join`);
    this.gameId = this.route.snapshot.params.gameId;
    this.lobbyService.login().subscribe(
      (loginResponse) => {
        console.log(`login result: ${JSON.stringify(loginResponse)}`);
        this.lobbyService.joinGame(this.gameId, this.nameGeneratorService.generateName()).subscribe(
          (joinResponse) => {
            console.log(`join game result: ${JSON.stringify(joinResponse)}`);
            this.router.navigate(['/lobby', this.gameId]);
          },
          (error) => {
            console.error(`got a join game error: ${error.error.message}`);
            this.errorMessage = "either game doesn't exist, it's full, or you just can't join it.";
          },
        );
      },
      (error) => {
        console.log(`got a login error: ${error.error.message}`);
        this.errorMessage = 'error encountered authorizing player.';
      },
    );
  }

  onClickGoToLobby() {
    this.router.navigate(['/']);
  }
}
