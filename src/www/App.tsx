import React, { useEffect } from 'react';
import styles from './App.module.less';
import { init } from '@www/initialize';
import MessageBoard from '@src/www/pages/MessageBoard/MessageBoard';
import { BrowserRouter } from 'react-router-dom';

export default function App() {
    useEffect(() => {
        init();
    }, []);
    return (
        <BrowserRouter>
            <div className={styles.app}>
                <MessageBoard />
            </div>
        </BrowserRouter>
    );
}
