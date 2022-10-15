import React, { useEffect, useState } from 'react';
import * as cyfs from 'cyfs-sdk';
import styles from './MessageBoard.module.less';
import { Button, Input, Spin } from 'antd';
const { TextArea } = Input;
import MessageItem from '@www/components/MessageItem/MessageItem';
import { publishMessage, listMessagesByPage } from '@www/apis/message';
import { MessageItem as MessageItemObject } from '@www/types/common';

export default function MessageBoard() {
    const [message, setMessage] = useState('');
    const [spinning, setSpinning] = useState(false);
    const [publishLoading, setPublishLoading] = useState(false);
    const [messageList, setMessageList] = useState<MessageItemObject[]>([]);
    const [showInput, setShowInput] = useState(true);

    useEffect(() => {
        if (location.search.includes('peopleid=')) setShowInput(false);
        setTimeout(() => {
            queryMessageRecords();
        }, 2000);
    }, []);

    // const extractPeopleIdFromSearch = () => {
    //     let target = 'self';
    //     if (location.search.includes('peopleid=')) {
    //         target = location.search.substring(10);
    //     }
    //     console.log('target: ', target);
    //     return target;
    // };

    const queryMessageRecords = async () => {
        setSpinning(true);
        // const target = extractPeopleIdFromSearch();
        // const to = target === 'self' ? undefined : cyfs.ObjectId.from_base_58(target).unwrap();
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
        setMessage('');
    };
    return (
        <div className={styles.box}>
            <div className={styles.messageBoard}>
                {showInput && (
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
                )}
                <h2 className={styles.title}>Message Board</h2>

                <div className={styles.messageBoardContent}>
                    <Spin tip="loading" spinning={spinning}>
                        {messageList.map((message) => {
                            return (
                                <MessageItem
                                    key={message.key}
                                    messageObject={message}
                                    onHandleModifyMessageSuccess={queryMessageRecords}
                                    onHandleDeleteMessageSuccess={queryMessageRecords}
                                />
                            );
                        })}
                    </Spin>
                </div>
            </div>
        </div>
    );
}
