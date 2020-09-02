export interface Participant{
    userId: string,
    name: string,
    numberOfDice: number,
    roll: number[],
    eliminated: boolean
}