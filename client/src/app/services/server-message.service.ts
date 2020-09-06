import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { GameMessage } from '@ryanroundhouse/liars-dice-interface';
import { WebsocketService } from './websocket.service';

const WS_URL = "ws://localhost:3000";

@Injectable({
  providedIn: 'root'
})
export class ServerMessageService {
  public messages: Subject<GameMessage>;

  constructor(private wsService: WebsocketService) {
    this.messages = <Subject<GameMessage>>wsService.connect(WS_URL).pipe(
      map((response: MessageEvent): GameMessage => {
        let data = JSON.parse(response.data);
        return {
          messageType: data.messageType,
          message: data.message
        }
      })
    );
  }
}
