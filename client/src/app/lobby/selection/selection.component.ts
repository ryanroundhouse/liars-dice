import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { Claim } from '@ryanroundhouse/liars-dice-interface';

@Component({
  selector: 'liar-selection',
  templateUrl: './selection.component.html',
  styleUrls: ['./selection.component.scss']
})
export class SelectionComponent implements OnInit, OnChanges {
  @Input() minQuantity: number;
  @Output() claim = new EventEmitter<Claim>();
  quantity: number = 3;
  value: number = 3;
  dice: number[] = [];
  
  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    this.dice = this.counter(this.minQuantity);
    this.quantity = this.minQuantity;
  }

  ngOnInit(): void {
  }

  regenerateDice(){
    console.log(`generating ${this.quantity} ${this.value}s`)
    this.dice = Array.from({length: this.quantity}, () => this.value);
    console.log(`generated ${JSON.stringify(this.dice)}`);
  }

  onClickUp(){
    this.value = ++this.value;
    if (this.value > 6){
      this.value = 1;
    }
    this.regenerateDice();
  }

  onClickDown(){
    this.value = --this.value;
    if (this.value < 1){
      this.value = 6;
    }
    this.regenerateDice();
  }

  onClickLess(){
    console.log(`hrm ${this.quantity} vs ${this.minQuantity}`);
    if (this.quantity > this.minQuantity){
      --this.quantity;
      this.regenerateDice();
    }
  }

  onClickBangOn(){
    const bangOnClaim: Claim = {
      quantity: null,
      value: null,
      bangOn: true,
      cheat: false
    }
    this.claim.next(bangOnClaim);
  }

  onClickCheat(){
    const cheatClaim: Claim = {
      quantity: null,
      value: null,
      bangOn: false,
      cheat: true
    }
    this.claim.next(cheatClaim);
  }

  onClickClaim(){
    const claim: Claim = {
      quantity: this.quantity,
      value: this.value,
      bangOn: false,
      cheat: false
    }
    this.claim.next(claim);
  }

  onClickMore(){
    ++this.quantity;
    this.regenerateDice();
  }

  counter(i: number) {
    return new Array(i);
  }

}
