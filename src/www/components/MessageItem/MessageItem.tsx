import React, { useEffect, useState } from 'react';
import { Button, Input, Avatar } from 'antd';
import * as cyfs from 'cyfs-sdk';
import { MessageOutlined, UserOutlined } from '@ant-design/icons';
import styles from './MessageItem.module.less';
import { MessageItem, CommentItem as CommentItemObject } from '@www/types/common';
import dayjs from 'dayjs';
import { publishComment, listCommentsByPage } from '@www/apis/comment';
import CommentItem from '@www/components/CommentItem/CommentItem';

interface Props {
    messageObject: MessageItem;
}
export default function MessageItem({ messageObject }: Props) {
    const [comment, setComment] = useState('');
    const [commentList, setCommentList] = useState<CommentItemObject[]>([]);
    const [showCommentInput, setShowCommentInput] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    useEffect(() => {
        setTimeout(() => {
            queryCommentsFromMessage();
        }, 2000);
    }, []);

    const queryCommentsFromMessage = async () => {
        const list = await listCommentsByPage(messageObject.id, 0);
        setCommentList(list);
        console.log('comment list: ', list);
    };

    const handlePublishComment = async () => {
        setSubmitLoading(true);
        const r = await publishComment(
            cyfs.ObjectId.from_base_58(messageObject.id).unwrap(),
            comment
        );
        console.log('publish comment result: ', r);
        await queryCommentsFromMessage();
        handleCancelCommentInput();
        setSubmitLoading(false);
    };

    const handleCancelCommentInput = () => {
        setShowCommentInput(false);
        setComment('');
    };

    const handleDeleteComment = async () => {
        await queryCommentsFromMessage();
    };
    return (
        <div className={styles.msgItem}>
            <div className={styles.iconBox}>
                <Avatar style={{ backgroundColor: '#f56a00' }} icon={<UserOutlined />} />
            </div>
            <div className={styles.contentBox}>
                <div className={styles.nameAndTime}>
                    <div className={styles.name}>{messageObject.name}</div>
                    <div className={styles.time}>
                        {dayjs(messageObject.time).format('YYYY-MM-DD HH:mm:ss')}
                    </div>
                </div>
                <div className={styles.message}>{messageObject.content}</div>
                <div className={styles.operationBox}>
                    {!showCommentInput ? (
                        <Button
                            icon={<MessageOutlined />}
                            type="primary"
                            onClick={() => setShowCommentInput(!showCommentInput)}
                        >
                            Reply
                        </Button>
                    ) : (
                        <div className={styles.commentInputBox}>
                            <Input value={comment} onChange={(e) => setComment(e.target.value)} />
                            <Button
                                type="primary"
                                onClick={handlePublishComment}
                                loading={submitLoading}
                            >
                                Submit
                            </Button>
                            <Button
                                type="primary"
                                style={{ marginLeft: '10px' }}
                                onClick={handleCancelCommentInput}
                            >
                                Cancel
                            </Button>
                        </div>
                    )}
                </div>
                {commentList.length > 0 && (
                    <div className={styles.comments}>
                        {commentList.map((comment) => {
                            return (
                                <CommentItem
                                    key={comment.id}
                                    commentObject={comment}
                                    onHandleDeleteComment={handleDeleteComment}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
