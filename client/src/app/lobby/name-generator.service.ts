import { Injectable } from '@angular/core';
import { Game } from "../"

@Injectable({
  providedIn: 'root'
})
export class NameGeneratorService {

  constructor() { }

  generateName(){
    NameGeneratorService.getRandomInt(10);
  }

  static getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
  }
}