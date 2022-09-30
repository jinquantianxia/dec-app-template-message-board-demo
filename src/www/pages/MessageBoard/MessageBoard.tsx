import React, { useEffect, useState } from 'react';
import styles from './MessageBoard.module.less';
import { Button, Input, Spin } from 'antd';
const { TextArea } = Input;
import MessageItem from '@www/components/MessageItem/MessageItem';
import { publishMessage, listMessagesByPage } from '@www/apis/message';
import { MessageItem as MessageItemObject } from '@www/types/common';

export default function Welcome() {
    const [message, setMessage] = useState('');
    const [spinning, setSpinning] = useState(false);
    const [publishLoading, setPublishLoading] = useState(false);
    const [messageList, setMessageList] = useState<MessageItemObject[]>([]);
    useEffect(() => {
        setTimeout(() => {
            queryMessageRecords();
        }, 2000);
    }, []);

    const queryMessageRecords = async () => {
        setSpinning(true);
        const list = await listMessagesByPage(0);
        setMessageList(list);
        console.log('messages: ', list);
        setSpinning(false);
    };
    const handlePublishMessage = async (message: string) => {
        setPublishLoading(true);
        const r = await publishMessage(message);
        console.log('publish message result: ', r);
        await queryMessageRecords();
        setPublishLoading(false);
    };
    return (
        <div className={styles.box}>
            <div className={styles.messageBoard}>
                <div className={styles.publishBox}>
                    <TextArea
                        rows={4}
                        onChange={(e) => setMessage(e.target.value)}
                        value={message}
                    />
                    <div className={styles.publishBtnBox}>
                        <Button
                            type="primary"
                            onClick={() => handlePublishMessage(message)}
                            loading={publishLoading}
                        >
                            Leave A Message
                        </Button>
                    </div>
                </div>
                <h2 className={styles.title}>Message Board</h2>

                <div className={styles.messageBoardContent}>
                    <Spin tip="loading" spinning={spinning}>
                        {messageList.map((message) => {
                            return <MessageItem key={message.id} messageObject={message} />;
                        })}
                    </Spin>
                </div>
            </div>
        </div>
    );
}
