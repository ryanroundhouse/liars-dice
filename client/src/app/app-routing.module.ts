import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LobbyComponent } from './lobby/lobby.component';
import { JoinComponent } from './join/join.component';

const routes: Routes = [
  {
    path: 'join/:gameId',
    component: JoinComponent
  },
  {
    path: 'lobby/:gameId',
    component: LobbyComponent
  },
  {
    path: '**',
    component: LobbyComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
