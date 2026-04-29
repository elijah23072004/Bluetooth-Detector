import React, { useEffect, useState } from 'react';
import { isTaskRegistered, registerBackgroundTaskAsync, unregisterBackgroundTaskAsync } from '@/utils/backgroundTask';
import { StyleSheet } from 'react-native';
import { ThemedView } from '../themed-view';
import {Button} from 'react-native'
import { ThemedText } from '../themed-text';

export class IsBackgroundProcessingEnabledProps {
    onlyShowIfNotEnabled:boolean = false
}

export const IsBackgroundProcessingEnabled: React.FC<IsBackgroundProcessingEnabledProps> = (props:IsBackgroundProcessingEnabledProps)=> {
    const [isScanningEnabled,setIsScanningEnabled] = useState(false)
    useEffect(() => {
        isTaskRegistered().then( res => { setIsScanningEnabled(res)})
    })
    let text = "Background scanning of devices is not enabled:\npress to enable"
    if (isScanningEnabled){
        text = "Automatic background scanning of devices is enabled:\npress to disable"
    }
    if( props.onlyShowIfNotEnabled && isScanningEnabled){
        return
    }
    return  ( <ThemedView>
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
        </ThemedView>)
    
}
