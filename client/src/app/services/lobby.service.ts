import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import * as LiarInterface from '@ryanroundhouse/liars-dice-interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LobbyService {

  constructor(private http: HttpClient) { }

  login(): Observable<LiarInterface.Result<LiarInterface.Login>>{
    return this.http.get<LiarInterface.Result<LiarInterface.Login>>(`https://liar.ryangraham.ca/login`, {withCredentials: true});
  }

  logout(): Observable<LiarInterface.Result<string>>{
    return this.http.delete<LiarInterface.Result<string>>(`https://liar.ryangraham.ca/logout`, {withCredentials: true});
  }
  
  createGame(): Observable<LiarInterface.Result<string>>{
    return this.http.get<LiarInterface.Result<string>>(`https://liar.ryangraham.ca/game/create`, {withCredentials: true});
  }
  
  startGame(gameId: string): Observable<LiarInterface.Result<string>>{
    return this.http.get<LiarInterface.Result<string>>(`https://liar.ryangraham.ca/game/${gameId}/start`, {withCredentials: true});
  }
  
  getGameState(gameId: string): Observable<LiarInterface.Result<LiarInterface.GameMessage[]>>{
    return this.http.get<LiarInterface.Result<LiarInterface.GameMessage[]>>(`https://liar.ryangraham.ca/game/${gameId}`, {withCredentials: true});
  }
  
  joinGame(gameId: string, name: string): Observable<LiarInterface.Result<LiarInterface.Participant[]>>{
    return this.http.post<LiarInterface.Result<LiarInterface.Participant[]>>(`https://liar.ryangraham.ca/game/${gameId}/join`, { name: name }, {withCredentials: true});
  }

  setName(gameId: string, name: string): Observable<LiarInterface.Result<string>>{
    return this.http.put<LiarInterface.Result<string>>(`https://liar.ryangraham.ca/player`, { name: name, gameId: gameId}, {withCredentials: true});
  }

  claim(gameId: string, quantity: number, value: number, bangOn: boolean, cheat: boolean): Observable<LiarInterface.Result<string>>{
    const claim: LiarInterface.Claim = {
      quantity: quantity,
      value: value,
      cheat: cheat,
      bangOn: bangOn
    };
    const message: LiarInterface.GameMessage = {
      messageType: LiarInterface.MessageType.Claim,
      message: claim
    }
    return this.http.post<LiarInterface.Result<string>>(`https://liar.ryangraham.ca/game/${gameId}/claim`, message, {withCredentials: true});
  }
}