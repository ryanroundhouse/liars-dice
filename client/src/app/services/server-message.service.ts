import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { GameMessage, Result } from '@ryanroundhouse/liars-dice-interface';
import { WebsocketService } from './websocket.service';

const WS_URL = "ws://localhost:3000";

@Injectable({
  providedIn: 'root'
})
export class ServerMessageService {
  public messages: Subject<GameMessage>;

  constructor(private wsService: WebsocketService) {
    
  }

  openWebSocket(): Result<string>{
    this.messages = <Subject<GameMessage>>this.wsService.connect(WS_URL).pipe(
      map((response: MessageEvent): GameMessage => {
        let data = JSON.parse(response.data);
        return {
          messageType: data.messageType,
          message: data.message
        }
      })
    );
    const result: Result<string> = {
      ok: true,
      message: 'web socket opened.'
    }
    return result;
  }
}
