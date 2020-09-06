import { Injectable } from '@angular/core';
import { Subject, Observable, Observer } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private subject: Subject<MessageEvent>;

  constructor() { }

  public connect(url: string): Subject<MessageEvent>{
    if (!this.subject){
      this.subject = this.create(url);
      console.log("Successfully connected to " + url);
    }
    return this.subject;
  }

  public create(url: string): Subject<MessageEvent>{
    let ws = new WebSocket(url);

    let observable = Observable.create((obs: Observer<MessageEvent>) => {
      ws.onmessage = obs.next.bind(obs);
      ws.onerror = obs.error.bind(obs);
      ws.onclose = obs.complete.bind(obs);
      return ws.close.bind(ws);
    });

    let observer = {
      next: (data: Object) => {
        if (ws.readyState === WebSocket.OPEN){
          ws.send(JSON.stringify(data));
        }
      }
    };

    return Subject.create(observer, observable);
  }
}
