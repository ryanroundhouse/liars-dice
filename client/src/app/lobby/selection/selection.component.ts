import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'liar-selection',
  templateUrl: './selection.component.html',
  styleUrls: ['./selection.component.scss']
})
export class SelectionComponent implements OnInit, OnChanges {
  @Input() minQuantity: number;
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

  onClickMore(){
    ++this.quantity;
    this.regenerateDice();
  }

  counter(i: number) {
    return new Array(i);
  }

}
