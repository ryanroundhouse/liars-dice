import { Component, Input, OnInit } from '@angular/core';
import { Participant } from '@ryanroundhouse/liars-dice-interface';

@Component({
  selector: 'liar-players',
  templateUrl: './players.component.html',
  styleUrls: ['./players.component.scss']
})
export class PlayersComponent implements OnInit {
  @Input() players: Participant[];
  @Input() selectedPlayer: string;
  
  constructor() { }

  ngOnInit(): void {
  }

}
