import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Claim, Participant } from '@ryanroundhouse/liars-dice-interface';

@Component({
  selector: 'liar-claim',
  templateUrl: './claim.component.html',
  styleUrls: ['./claim.component.scss']
})
export class ClaimComponent implements OnInit, OnChanges {
  private _claim: Claim;
  @Input() set claim(value: Claim) {
    this._claim = value;
    console.log(`new claim made ${JSON.stringify(this._claim)} - ${JSON.stringify(this.players)} - ${JSON.stringify(this.playerId)}`);
  }
  get claim(): Claim {

    return this._claim;

  }

  private _players: Participant[];
  @Input() set players(value: Participant[]){
    console.log(`players set: ${JSON.stringify(value)}`);
    this._players = value;
  }
  get players(): Participant[]{
    return this._players;
  }

  @Input() playerId: string;
  claimDescription: string;
  dice: number[] = [];

  constructor() { }
  ngOnChanges(changes: SimpleChanges): void {
    this.renderClaim(this._claim);
    this.regenerateDice(this._claim);
  }

  ngOnInit(): void {
  }

  regenerateDice(claim: Claim) {
    if (!claim) {
      this.dice = null;
    }
    else {
      console.log(`generating ${claim.quantity} ${claim.value}s`)
      this.dice = Array.from({ length: claim.quantity }, () => claim.value);
      console.log(`generated ${JSON.stringify(this.dice)}`);
    }
  }

  renderClaim(claim: Claim) {
    if (!claim) {
      this.claimDescription = null;
    }
    else if (!claim.bangOn && !claim.cheat) {
      console.log(`players: ${JSON.stringify(this.players)} - ${JSON.stringify(claim)}`);
      const claimer = this.players.find(p => p.userId === claim.playerId);
      const claimerName = claimer.userId === this.playerId ? "You" : claimer.name;
      this.claimDescription = `${claimerName} claimed ${claim.quantity} ${claim.value}${claim.quantity > 1 ? 's' : ''}.`;
    }
    else if (claim.bangOn) {
      this.claimDescription = 'bang';
    }
    else if (claim.cheat) {
      this.claimDescription = 'cheat';
    }
    else {
      this.claimDescription = 'what?';
    }
  }

}
