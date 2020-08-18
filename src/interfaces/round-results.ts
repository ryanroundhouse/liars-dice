import { Participant } from "./participant";
import { Claim } from "./claim";

export interface RoundResults{
    callingPlayer: Participant,
    calledPlayer: Participant,
    claim: Claim,
    cheatSuccess: boolean,
    playerEliminated: boolean
}