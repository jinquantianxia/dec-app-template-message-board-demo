import React, { useState } from 'react';
import { Button, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import styles from './CommentItem.module.less';
import { CommentItem } from '@www/types/common';
import dayjs from 'dayjs';

interface Props {
    commentObject: CommentItem;
}
export default function CommentItem({ commentObject }: Props) {
    return (
        <div className={styles.msgItem}>
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
                <div className={styles.message}>{commentObject.content}</div>
            </div>
        </div>
    );
}
