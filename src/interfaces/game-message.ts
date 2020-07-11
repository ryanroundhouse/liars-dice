import { MessageType } from "../enums/messageType";

export interface GameMessage{
    messageType: MessageType,
    message: any
}