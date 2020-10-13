import { Component } from '@angular/core';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { faTwitter, faLinkedin, faGithub, faDocker } from '@fortawesome/free-brands-svg-icons';

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
