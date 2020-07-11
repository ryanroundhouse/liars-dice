import { Participant } from "./participant";
import { GameMessage } from "./game-message";

export interface Game{
    participants: Participant[],
    started: boolean,
    gameMessageLog: GameMessage[],
}