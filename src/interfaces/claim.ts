import { Participant } from "./participant";

export interface Claim{
    quantity: number,
    value: number,
    cheat: boolean,
    bangOn: boolean,
    nextPlayerId?: string,
    playerId?: string
}