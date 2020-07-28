import { Participant } from "./participant";
import { GameMessage } from "./game-message";

export interface GameInterface{
    participants: Participant[],
    started: boolean,
    finished: boolean,
    gameMessageLog: GameMessage[],
}