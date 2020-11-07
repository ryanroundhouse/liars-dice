import { Component, OnInit, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { Claim } from '@ryanroundhouse/liars-dice-interface';
import {
  faPlus,
  faMinus,
  faArrowUp,
  faArrowDown,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'liar-selection',
  templateUrl: './selection.component.html',
  styleUrls: ['./selection.component.scss'],
})
export class SelectionComponent implements OnInit, OnChanges {
  @Input() minQuantity: number;

  @Output() claim = new EventEmitter<Claim>();

  quantity = 3;

  value = 3;

  dice: number[] = [];

  faPlus: IconDefinition = faPlus;

  faMinus: IconDefinition = faMinus;

  faArrowUp: IconDefinition = faArrowUp;

  faArrowDown: IconDefinition = faArrowDown;

  ngOnChanges(): void {
    this.dice = this.counter(this.minQuantity);
    this.quantity = this.minQuantity;
  }

  ngOnInit(): void {}

  regenerateDice() {
    console.log(`generating ${this.quantity} ${this.value}s`);
    this.dice = Array.from({ length: this.quantity }, () => this.value);
    console.log(`generated ${JSON.stringify(this.dice)}`);
  }

  onClickUp() {
    this.value += 1;
    if (this.value > 6) {
      this.value = 1;
    }
    this.regenerateDice();
  }

  onClickDown() {
    this.value -= 1;
    if (this.value < 1) {
      this.value = 6;
    }
    this.regenerateDice();
  }

  onClickLess() {
    console.log(`hrm ${this.quantity} vs ${this.minQuantity}`);
    if (this.quantity > this.minQuantity) {
      this.quantity -= 1;
      this.regenerateDice();
    }
  }

  onClickBangOn() {
    const bangOnClaim: Claim = {
      quantity: null,
      value: null,
      bangOn: true,
      cheat: false,
    };
    this.claim.next(bangOnClaim);
  }

  onClickCheat() {
    const cheatClaim: Claim = {
      quantity: null,
      value: null,
      bangOn: false,
      cheat: true,
    };
    this.claim.next(cheatClaim);
  }

  onClickClaim() {
    const claim: Claim = {
      quantity: this.quantity,
      value: this.value,
      bangOn: false,
      cheat: false,
    };
    this.claim.next(claim);
  }

  onClickMore() {
    this.quantity += 1;
    this.regenerateDice();
  }

  counter(i: number) {
    return new Array(i);
  }
}
