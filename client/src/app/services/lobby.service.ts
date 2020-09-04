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
    return this.http.post<LiarInterface.Result<string>>('http://localhost:3000/login', {}, {withCredentials: true});
  }

  logout(): Observable<LiarInterface.Result<string>>{
    return this.http.delete<LiarInterface.Result<string>>('http://localhost:3000/logout', {withCredentials: true});
  }
}
