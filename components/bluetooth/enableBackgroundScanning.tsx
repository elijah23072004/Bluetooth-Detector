import React, { useState } from 'react';
import { isTaskRegistered, registerBackgroundTaskAsync, unregisterBackgroundTaskAsync } from '@/utils/backgroundTask';
import { StyleSheet } from 'react-native';
import { ThemedView } from '../themed-view';
import {Button} from 'react-native'
import { ThemedText } from '../themed-text';

export function IsBackgroundProcessingEnabled(){
    const [isScanningEnabled,setIsScanningEnabled] = useState(false)
    const [isFirstRun, setIsFirstRun] = useState(true)
    if(isFirstRun){
        isTaskRegistered().then( res => setIsScanningEnabled(res))
        setIsFirstRun(false)
    }
    let text = "Background scanning of devices is not enabled:\npress to enable"
    if (isScanningEnabled){
        text = "Automatic background scanning of devices is enabled:\npress to disable"
    }
    
    return (
        <ThemedView>
            <Button onPress={async() => {
                if (isScanningEnabled){
                    await unregisterBackgroundTaskAsync()
                    setIsScanningEnabled(false)
                }
                else{
                    await registerBackgroundTaskAsync()
                    setIsScanningEnabled(true)
                }
                }}
                title={text}
                color='#841584'/>
        </ThemedView>
    )
}
