import { RouterArray } from '../types';
import { publishMessageRouter } from './publish_message';
import { publishMessageReqRouter } from './publish_message_req';
import { updateMessageRouter } from './update_message';
import { updateMessageReqRouter } from './update_message_req';
import { deleteMessageRouter } from './delete_message';
import { deleteMessageReqRouter } from './delete_message_req';
import { publisCommentRouter } from './publish_comment';
import { publishCommentReqRouter } from './publish_comment_req';
import { ROUTER_PATHS } from '@src/common/routers';

export const routers: RouterArray = [
    {
        reqPath: ROUTER_PATHS.PUBLISH_MESSAGE,
        router: publishMessageRouter
    },
    {
        reqPath: ROUTER_PATHS.PUBLISH_MESSAGE_REQ,
        router: publishMessageReqRouter
    },
    {
        reqPath: ROUTER_PATHS.UPDATE_MESSAGE,
        router: updateMessageRouter
    },
    {
        reqPath: ROUTER_PATHS.UPDATE_MESSAGE_REQ,
        router: updateMessageReqRouter
    },
    {
        reqPath: ROUTER_PATHS.DELETE_MESSAGE,
        router: deleteMessageRouter
    },
    {
        reqPath: ROUTER_PATHS.DELETE_MESSAGE_REQ,
        router: deleteMessageReqRouter
    },

    {
        reqPath: ROUTER_PATHS.PUBLISH_COMMENT,
        router: publisCommentRouter
    },
    {
        reqPath: ROUTER_PATHS.PUBLISH_COMMENT_REQ,
        router: publishCommentReqRouter
    }
];
