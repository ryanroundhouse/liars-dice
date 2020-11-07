import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'liar-roll',
  templateUrl: './roll.component.html',
  styleUrls: ['./roll.component.scss'],
})
export class RollComponent implements OnInit {
  @Input() dice: number[];

  ngOnInit(): void {}
}
