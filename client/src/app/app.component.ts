import { Component } from '@angular/core';
import { faSignOutAlt, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { faTwitter, faLinkedin, faGithub, faDocker } from '@fortawesome/free-brands-svg-icons';
import { LobbyService } from './services/lobby.service';
import { ServerMessageService } from './services/server-message.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  title = 'client';
  faTwitter: IconDefinition = faTwitter;
  faLinkedIn: IconDefinition = faLinkedin;
  faGithub: IconDefinition = faGithub;
  faDocker: IconDefinition = faDocker;
}
