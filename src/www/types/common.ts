export const enum CommentType {
    NEW = 0,
    DELETE = 1
}

export interface MessageItem {
    id: string;
    name: string;
    time: number;
    content: string;
    isSelf: boolean;
}

export interface CommentItem {
    id: string;
    msgId: string;
    name: string;
    time: number;
    type: CommentType;
    content: string;
    isDeleted: boolean;
    isSelf: boolean;
    ref?: string;
}
