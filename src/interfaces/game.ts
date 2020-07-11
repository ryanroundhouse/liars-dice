import { Participant } from "./participant";

export interface Game{
    participants: Participant[],
    started: boolean
}