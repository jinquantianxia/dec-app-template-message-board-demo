import React, { useEffect, useState } from 'react';
import { Button, Input, Avatar } from 'antd';
import * as cyfs from 'cyfs-sdk';
import { MessageOutlined, UserOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import styles from './MessageItem.module.less';
import { MessageItem, CommentItem as CommentItemObject } from '@www/types/common';
import dayjs from 'dayjs';
import { publishComment, listCommentsByPage } from '@www/apis/comment';
import CommentItem from '@www/components/CommentItem/CommentItem';
import { deleteMessage, updateMessage } from '@www/apis/message';

interface Props {
    messageObject: MessageItem;
    onHandleModifyMessageSuccess: () => void;
    onHandleDeleteMessageSuccess: () => void;
}
export default function MessageItem({
    messageObject,
    onHandleModifyMessageSuccess,
    onHandleDeleteMessageSuccess
}: Props) {
    const [inputValue, setInputValue] = useState('');
    const [isModifyMessage, setIsModifyMessage] = useState(true);
    const [commentList, setCommentList] = useState<CommentItemObject[]>([]);
    const [showInput, setShowInput] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    useEffect(() => {
        setTimeout(() => {
            // queryCommentsFromMessage();
        }, 2000);
    }, []);

    const handleReplyClick = () => {
        setShowInput(true);
        setIsModifyMessage(false);
    };

    const handleModifyMessageClick = () => {
        setIsModifyMessage(true);
        setShowInput(true);
    };

    const handleDeleteMessageClick = async () => {
        setDeleteLoading(true);
        const r = await deleteMessage(messageObject.key);
        console.log('delete message result: ', r);
        onHandleDeleteMessageSuccess();
        setDeleteLoading(false);
    };

    const queryCommentsFromMessage = async () => {
        const list = await listCommentsByPage(messageObject.key, 0);
        setCommentList(list);
        console.log('comment list: ', list);
    };

    const handleSubmitClick = async () => {
        setSubmitLoading(true);
        if (isModifyMessage) {
            const r = await updateMessage(messageObject.key, inputValue);
            console.log('modify message result: ', r);
            onHandleModifyMessageSuccess();
        } else {
            const r = await publishComment(
                cyfs.ObjectId.from_base_58(messageObject.key).unwrap(),
                inputValue
            );
            console.log('publish comment result: ', r);
        }

        // await queryCommentsFromMessage();
        handleCancelCommentInput();
        setSubmitLoading(false);
    };

    const handleCancelCommentInput = () => {
        setShowInput(false);
        setInputValue('');
    };

    const handleDeleteComment = async () => {
        // await queryCommentsFromMessage();
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
                    {!showInput ? (
                        <Button icon={<MessageOutlined />} onClick={handleReplyClick}>
                            Reply
                        </Button>
                    ) : (
                        <div className={styles.commentInputBox}>
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            />
                            <Button
                                type="primary"
                                onClick={handleSubmitClick}
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
                    {messageObject.isSelf && (
                        <div className={styles.selfControlBox}>
                            <Button
                                icon={<EditOutlined />}
                                onClick={handleModifyMessageClick}
                                style={{ marginLeft: '10px', marginRight: '10px' }}
                            >
                                Modify
                            </Button>
                            <Button
                                icon={<DeleteOutlined />}
                                type="primary"
                                danger
                                onClick={handleDeleteMessageClick}
                                loading={deleteLoading}
                            >
                                Delete
                            </Button>
                        </div>
                    )}
                </div>
                {commentList.length > 0 && (
                    <div className={styles.comments}>
                        {commentList.map((comment) => {
                            return (
                                <CommentItem
                                    key={comment.key}
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
