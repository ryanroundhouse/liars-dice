import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NameGeneratorService {
  nameList: string[] = ["Maverick","Jonesy","Tex","Longarm","Logan","Mercedes","Deadeye","Doc","Patches","Snow"];
  constructor() { }

  generateName(): string{
    return this.nameList[NameGeneratorService.getRandomInt(this.nameList.length)];
  }

  static getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
  }
}