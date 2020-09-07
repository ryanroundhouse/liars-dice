import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import * as LiarInterface from '@ryanroundhouse/liars-dice-interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LobbyService {

  constructor(private http: HttpClient) { }

  login(): Observable<LiarInterface.Result<string>>{
    return this.http.get<LiarInterface.Result<string>>('http://localhost:3000/login', {withCredentials: true});
  }

  logout(): Observable<LiarInterface.Result<string>>{
    return this.http.delete<LiarInterface.Result<string>>('http://localhost:3000/logout', {withCredentials: true});
  }
  
  createGame(): Observable<LiarInterface.Result<string>>{
    return this.http.get<LiarInterface.Result<string>>('http://localhost:3000/game/create', {withCredentials: true});
  }
  
  startGame(gameId: string): Observable<LiarInterface.Result<string>>{
    return this.http.get<LiarInterface.Result<string>>(`http://localhost:3000/game/${gameId}/start`, {withCredentials: true});
  }
  
  joinGame(gameId: string, name: string): Observable<LiarInterface.Result<LiarInterface.Participant[]>>{
    return this.http.post<LiarInterface.Result<LiarInterface.Participant[]>>(`http://localhost:3000/game/${gameId}/join`, { name: name }, {withCredentials: true});
  }
}
