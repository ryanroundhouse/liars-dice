import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import * as LiarInterface from '@ryanroundhouse/liars-dice-interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LobbyService {
  includeCredentials: boolean = false;

  constructor(private http: HttpClient) { }

  login(): Observable<LiarInterface.Result<string>>{
    return this.http.get<LiarInterface.Result<string>>('http://localhost:3000/login', {withCredentials: this.includeCredentials});
  }

  logout(): Observable<LiarInterface.Result<string>>{
    return this.http.delete<LiarInterface.Result<string>>('http://localhost:3000/logout', {withCredentials: this.includeCredentials});
  }
  
  createGame(): Observable<LiarInterface.Result<string>>{
    return this.http.get<LiarInterface.Result<string>>('http://localhost:3000/game/create', {withCredentials: this.includeCredentials});
  }
  
  startGame(gameId: string): Observable<LiarInterface.Result<string>>{
    return this.http.get<LiarInterface.Result<string>>(`http://localhost:3000/game/${gameId}/start`, {withCredentials: this.includeCredentials});
  }
  
  joinGame(gameId: string): Observable<LiarInterface.Result<string>>{
    return this.http.post<LiarInterface.Result<string>>(`http://localhost:3000/game/${gameId}/join`, { name: 'test' }, {withCredentials: this.includeCredentials});
  }
}
