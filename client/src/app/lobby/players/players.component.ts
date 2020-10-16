import { Component, Input, OnInit } from '@angular/core';
import { Claim, Participant } from '@ryanroundhouse/liars-dice-interface';
import { LobbyService } from 'src/app/services/lobby.service';

@Component({
  selector: 'liar-players',
  templateUrl: './players.component.html',
  styleUrls: ['./players.component.scss']
})
export class PlayersComponent implements OnInit {
  @Input() players: Participant[];
  @Input() selectedPlayer: string;
  @Input() claim: Claim;
  @Input() playerId: string;
  @Input() gameStarted: boolean;
  @Input() gameId: string;
  @Input() name: string;
  
  constructor(private lobbyService: LobbyService) { }

  ngOnInit(): void {
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

}
