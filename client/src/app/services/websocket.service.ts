import { Injectable } from '@angular/core';
import { Subject, Observable, Observer } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private subject: Subject<MessageEvent>;

  private ws: WebSocket;

  public disconnect() {
    if (this.subject && !this.subject.closed) {
      this.subject.unsubscribe();
      console.log('unsubscribed from socket messages');
    }
  }

  public connect(url: string): Subject<MessageEvent> {
    if (!this.subject || this.subject.closed) {
      this.subject = this.create(url);
      console.log(`Successfully connected to ${url}`);
    }
    return this.subject;
  }

  public create(url: string): Subject<MessageEvent> {
    this.ws = new WebSocket(url);

    const observable = Observable.create((obs: Observer<MessageEvent>) => {
      this.ws.onmessage = obs.next.bind(obs);
      this.ws.onerror = obs.error.bind(obs);
      this.ws.onclose = obs.complete.bind(obs);
      return this.ws.close.bind(this.ws);
    });

    const observer = {
      next: (data: Object) => {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(data));
        }
      },
    };

    return Subject.create(observer, observable);
  }
}
