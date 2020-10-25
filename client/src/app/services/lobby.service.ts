import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import * as LiarInterface from '@ryanroundhouse/liars-dice-interface';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LobbyService {

  constructor(private http: HttpClient) { }

  login(): Observable<LiarInterface.Result<LiarInterface.Login>>{
    return this.http.get<LiarInterface.Result<LiarInterface.Login>>(`${environment.ssl}://${environment.domainNameAndPort}/login`, {withCredentials: true});
  }

  logout(): Observable<LiarInterface.Result<string>>{
    return this.http.delete<LiarInterface.Result<string>>(`${environment.ssl}://${environment.domainNameAndPort}/logout`, {withCredentials: true});
  }
  
  createGame(): Observable<LiarInterface.Result<string>>{
    return this.http.get<LiarInterface.Result<string>>(`${environment.ssl}://${environment.domainNameAndPort}/game/create`, {withCredentials: true});
  }
  
  startGame(gameId: string): Observable<LiarInterface.Result<string>>{
    return this.http.get<LiarInterface.Result<string>>(`${environment.ssl}://${environment.domainNameAndPort}/game/${gameId}/start`, {withCredentials: true});
  }
  
  getGameState(gameId: string): Observable<LiarInterface.Result<LiarInterface.GameMessage[]>>{
    return this.http.get<LiarInterface.Result<LiarInterface.GameMessage[]>>(`${environment.ssl}://${environment.domainNameAndPort}/game/${gameId}`, {withCredentials: true});
  }
  
  joinGame(gameId: string, name: string): Observable<LiarInterface.Result<LiarInterface.Participant[]>>{
    return this.http.post<LiarInterface.Result<LiarInterface.Participant[]>>(`${environment.ssl}://${environment.domainNameAndPort}/game/${gameId}/join`, { name: name }, {withCredentials: true});
  }

  setName(gameId: string, name: string): Observable<LiarInterface.Result<string>>{
    return this.http.put<LiarInterface.Result<string>>(`${environment.ssl}://${environment.domainNameAndPort}/player`, { name: name, gameId: gameId}, {withCredentials: true});
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
    return this.http.post<LiarInterface.Result<string>>(`${environment.ssl}://${environment.domainNameAndPort}/game/${gameId}/claim`, message, {withCredentials: true});
  }
}