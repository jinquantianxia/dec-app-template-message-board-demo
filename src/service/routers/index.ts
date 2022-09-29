import { RouterArray } from '../types';
import { publishMessageRouter } from './publish_message';
import { publishMessageReqRouter } from './publish_message_req';
import { publisCommentRouter } from './publish_comment';
import { publishCommentReqRouter } from './publish_comment_req';
import { DeleteCommentRouter } from './delete_comment';
import { DeleteCommentReqRouter } from './delete_comment_req';
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
        reqPath: ROUTER_PATHS.PUBLISH_COMMENT,
        router: publisCommentRouter
    },
    {
        reqPath: ROUTER_PATHS.PUBLISH_COMMENT_REQ,
        router: publishCommentReqRouter
    },
    {
        reqPath: ROUTER_PATHS.DELETE_COMMENT,
        router: DeleteCommentRouter
    },
    {
        reqPath: ROUTER_PATHS.DELETE_COMMENT_REQ,
        router: DeleteCommentReqRouter
    }
];
