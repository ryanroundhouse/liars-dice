import { Participant } from "./participant";

export interface Claim{
    quantity: number,
    value: number,
    cheat: boolean,
    nextPlayerId?: string,
    playerId?: string
}