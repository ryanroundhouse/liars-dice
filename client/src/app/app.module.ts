import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import AppRoutingModule from './app-routing.module';
import AppComponent from './app.component';
import { LobbyComponent } from './lobby/lobby.component';

import { InterceptorService } from './services/interceptor.service';
import { JoinComponent } from './join/join.component';
import { RollComponent } from './lobby/roll/roll.component';
import { SelectionComponent } from './lobby/selection/selection.component';
import { ClaimComponent } from './lobby/claim/claim.component';
import { PlayersComponent } from './lobby/players/players.component';
import SplashComponent from './splash/splash.component';

@NgModule({
  declarations: [
    AppComponent,
    LobbyComponent,
    JoinComponent,
    RollComponent,
    SelectionComponent,
    ClaimComponent,
    PlayersComponent,
    SplashComponent,
  ],
  imports: [BrowserModule, HttpClientModule, AppRoutingModule, FormsModule, FontAwesomeModule],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: InterceptorService,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
class AppModule {}
export { AppModule as default };
