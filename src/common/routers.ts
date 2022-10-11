import { Message } from './objs/message_object';
import { Comment } from './objs/comment_object';
import { ResponseObject } from './objs/response_object';

export const enum ROUTER_PATHS {
    PUBLISH_MESSAGE = '/messages/publish',
    PUBLISH_MESSAGE_REQ = '/messages/publish_req',
    RETRIEVE_MESSAGE = '/messages/retrieve',
    UPDATE_MESSAGE = '/messages/update',
    UPDATE_MESSAGE_REQ = '/messages/update_req',
    DELETE_MESSAGE = '/messages/delete',
    DELETE_MESSAGE_REQ = '/messages/delete_req',
    PUBLISH_COMMENT = '/comments/publish',
    PUBLISH_COMMENT_REQ = '/comments/publish_req'
}

// /message/publish request and response params
export type PublishMessageRequestParam = Message;
export type PublishMessageResponseParam = ResponseObject;

// /message/publish_req request and response params
export type PublishMessageReqRequestParam = Message;
export type PublishMessageReqResponseParam = ResponseObject;

// /message/retrieve request and response params
export type RetrieveMessageRequestParam = Message;
export type RetrieveMessageResponseParam = Message;

// /message/update request and response params
export type UpdateMessageRequestParam = Message;
export type UpdateMessageResponseParam = ResponseObject;

// /message/update_req request and response params
export type UpdateMessageReqRequestParam = Message;
export type UpdateMessageReqResponseParam = ResponseObject;

// /message/delete request and response params
export type DeleteMessageRequestParam = Message;
export type DeleteMessageResponseParam = ResponseObject;

// /message/delete_req request and response params
export type DeleteMessageReqRequestParam = Message;
export type DeleteMessageReqResponseParam = ResponseObject;

// /comment/publish request and response params
export type PublishCommentRequestParam = Comment;
export type PublishCommentResponseParam = ResponseObject;

// /comment/publish_req request and response params
export type PublishCommentReqRequestParam = Comment;
export type PublishCommentReqResponseParam = ResponseObject;
