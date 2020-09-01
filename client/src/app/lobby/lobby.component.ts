import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'liar-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss']
})
export class LobbyComponent implements OnInit {

  constructor(private http: HttpClient) {
    this.http.post('http://localhost:3000/login', {}).subscribe(data => {console.log(data)});
  }

  ngOnInit(): void {
  }

}
