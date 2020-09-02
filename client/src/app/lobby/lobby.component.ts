import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as LiarInterface from '@ryanroundhouse/liars-dice-interface';

@Component({
  selector: 'liar-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss']
})
export class LobbyComponent implements OnInit {
  sessionId: string;

  constructor(private http: HttpClient) {
    this.http.post<LiarInterface.Result<string>>('http://localhost:3000/login', {result: true}).subscribe(data => {
      console.log(`sessionId: ${JSON.stringify(data)}`);
      this.sessionId = data.message;
    });
  }

  ngOnInit(): void {
  }

}
