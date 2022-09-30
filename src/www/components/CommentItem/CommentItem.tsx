import React, { useState } from 'react';
import { Button, Avatar } from 'antd';
import { DeleteOutlined, UserOutlined } from '@ant-design/icons';
import styles from './CommentItem.module.less';
import { CommentItem } from '@www/types/common';
import dayjs from 'dayjs';
import { deleteComment } from '@www/apis/comment';

interface Props {
    commentObject: CommentItem;
    onHandleDeleteComment: (comment: CommentItem) => void;
}
export default function CommentItem({ commentObject, onHandleDeleteComment }: Props) {
    const [deleteLoading, setDeleteLoading] = useState(false);
    const handleDeleteComment = async () => {
        setDeleteLoading(true);
        const r = await deleteComment(commentObject);
        console.log('delete comment result: ', r);
        onHandleDeleteComment(commentObject);
        setDeleteLoading(false);
    };
    return (
        <div
            className={styles.msgItem}
            style={{ backgroundColor: commentObject.isDeleted ? '#ff4d4f' : '#fff' }}
        >
            <div className={styles.iconBox}>
                <Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} />
            </div>
            <div className={styles.contentBox}>
                <div className={styles.nameAndTime}>
                    <div className={styles.name}>{commentObject.name}</div>
                    <div className={styles.time}>
                        {dayjs(commentObject.time).format('YYYY-MM-DD HH:mm:ss')}
                    </div>
                </div>
                <div className={styles.message}>
                    {commentObject.isDeleted ? 'Comment deleted.' : commentObject.content}
                </div>
                {commentObject.isSelf && !commentObject.isDeleted && (
                    <div className={styles.operationBox}>
                        <Button
                            icon={<DeleteOutlined />}
                            danger
                            type="primary"
                            onClick={handleDeleteComment}
                            loading={deleteLoading}
                        >
                            Delete
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
