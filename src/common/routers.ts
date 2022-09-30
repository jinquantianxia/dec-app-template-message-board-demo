import { Message } from './objs/message_object';
import { Comment } from './objs/comment_object';
import { ResponseObject } from './objs/response_object';

export const enum ROUTER_PATHS {
    PUBLISH_MESSAGE = '/messages/publish',
    PUBLISH_MESSAGE_REQ = '/messages/publish_req',
    PUBLISH_COMMENT = '/comments/publish',
    PUBLISH_COMMENT_REQ = '/comments/publish_req',
    DELETE_COMMENT = '/comments/delete',
    DELETE_COMMENT_REQ = '/comments/delete_req'
}

// /message/publish request and response params
export type PublishMessageRequestParam = Message;
export type PublishMessageResponseParam = ResponseObject;

// /message/publish_req request and response params
export type PublishMessageReqRequestParam = Message;
export type PublishMessageReqResponseParam = ResponseObject;

// /comment/publish request and response params
export type PublishCommentRequestParam = Comment;
export type PublishCommentResponseParam = ResponseObject;

// /comment/publish_req request and response params
export type PublishCommentReqRequestParam = Comment;
export type PublishCommentReqResponseParam = ResponseObject;

// /comments/delete request and response params
export type DeleteCommentRequestParam = Comment;
export type DeleteCommentResponseParam = ResponseObject;

// /comments/delete_req request and response params
export type DeleteCommentReqRequestParam = Comment;
export type DeleteCommentReqResponseParam = ResponseObject;
