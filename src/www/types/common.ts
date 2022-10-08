export const enum MessageType {
    NEW = 0,
    DELETE = 1,
    UPDATE = 2
}

export interface MessageItem {
    key: string;
    name: string;
    time: number;
    content: string;
    isSelf: boolean;
}

export interface CommentItem {
    key: string;
    msgId: string;
    name: string;
    time: number;
    content: string;
    isSelf: boolean;
}
