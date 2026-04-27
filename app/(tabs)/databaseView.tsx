import * as SQLite from 'expo-sqlite';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRef, useState } from 'react';
import { AppState, AppStateStatus, Button } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { Image } from 'expo-image';
import { getAllDeviceReadingStrings, getNumberOfDeviceReadings, DeviceEntity, addDeviceToDatabase, getDatabase, clearDatabase, deleteDatabase, getDeviceList } from '@/utils/database';
import React from 'react'
import { DeviceList } from '@/components/bluetooth/deviceEntityList'; 
import { IsBackgroundProcessingEnabled } from '@/components/bluetooth/enableBackgroundScanning';
import { taskNotEnabledNotifcation } from '@/utils/backgroundTask';
import { addNotificationReceivedListener } from 'expo-notifications';
import { useFocusEffect } from 'expo-router';



async function getDevices(db?:SQLite.SQLiteDatabase){
    if(db == undefined){
        db = getDatabase() 
    }
    let devices = await getDeviceList(db)
    return devices
}

const databaseTest = ()  =>{
    //const [ deviceList, setDeviceList] = useState<string>("");
    //let updateDeviceList = () => {
    //    printDatabaseStuff().then( (text) =>{
    //        setDeviceList(text)
    //    })
    //}
    //updateDeviceList()
    const [deviceView, setDeviceView] = useState<DeviceEntity[]>([])
   // const [deviceReadings, setDeviceReadings] = useState<Record<string,string>>({})
    const [firstRun, setFirstRun] = useState<boolean>(true)
    const appState = useRef(AppState.currentState);
    let getData = async () => {
        let db =getDatabase()
        let devices = await getDevices(db)
        setDeviceView(devices)
        
    }
    if(firstRun == true){
        setFirstRun(false)
        taskNotEnabledNotifcation()
        //getData()
    }
    useFocusEffect( React.useCallback( () => { 
        console.log("Screen got focus")
        getData()
    }, [])
    );
    React.useEffect(() => {
        const appStateSubscription = AppState.addEventListener( "change",
            (nextAppState: AppStateStatus) => {
            if( appState.current.match(/inactive|background/)&& nextAppState === "active"){
                //App has come to foreground
                console.log("App has come to foreground")
                getData()
            }
            if(appState.current.match(/active/) && nextAppState === "background"){
                console.log("App has gone to the background!")
            }
            appState.current = nextAppState
        })
        const subscription = addNotificationReceivedListener( notification => {
            console.log(notification)
            getData()
        })
        return () => {
            subscription.remove()
            appStateSubscription.remove()
        }
    }, []);
    

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
            headerImage={ 
                <Image
                    source={require('@/assets/images/partial-react-logo.png')}
                />
            }>
        <ThemedView>
            {IsBackgroundProcessingEnabled()}
            <Button onPress= { async () => {
                let db = getDatabase()
                await clearDatabase(db);
            }} title={"Clear db"}/>
            <Button onPress= { () => {
                deleteDatabase()
            }} title={"Delete db"}/>
            <DeviceList devices={deviceView} />
        </ThemedView>
        </ParallaxScrollView>
    )
//<ThemedText>{ deviceList } </ThemedText>
}

export default databaseTest

