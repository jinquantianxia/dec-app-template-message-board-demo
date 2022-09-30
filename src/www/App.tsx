import React, { useEffect } from 'react';
import styles from './App.module.less';
import { init } from '@www/initialize';
import MessageBoard from '@src/www/pages/MessageBoard/MessageBoard';

export default function App() {
    useEffect(() => {
        init();
    }, []);
    return (
        <div className={styles.app}>
            <MessageBoard />
        </div>
    );
}
