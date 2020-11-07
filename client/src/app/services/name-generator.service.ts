import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NameGeneratorService {
  nameList: string[] = [
    'Maverick',
    'Jonesy',
    'Tex',
    'Longarm',
    'Logan',
    'Mercedes',
    'Deadeye',
    'Doc',
    'Patches',
    'Snow',
  ];

  static getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
  }

  generateName(): string {
    return this.nameList[NameGeneratorService.getRandomInt(this.nameList.length)];
  }
}
