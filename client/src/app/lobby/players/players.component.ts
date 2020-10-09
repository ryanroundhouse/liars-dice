import { Component, Input, OnInit } from '@angular/core';
import { Claim, Participant } from '@ryanroundhouse/liars-dice-interface';

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
  
  constructor() { }

  ngOnInit(): void {
  }

}
