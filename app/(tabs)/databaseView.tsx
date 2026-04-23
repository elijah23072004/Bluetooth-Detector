import * as SQLite from 'expo-sqlite';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useState } from 'react';
import { Button } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { Image } from 'expo-image';
import { getAllDeviceReadingStrings, getNumberOfDeviceReadings, DeviceEntity, addDeviceToDatabase, getDatabase, clearDatabase, deleteDatabase, getDeviceList } from '@/utils/database';

import { DeviceList } from '@/components/bluetooth/deviceEntityList'; 



async function getDevices(db?:SQLite.SQLiteDatabase){
    let closeDb=false
    if(db == undefined){
        db = await getDatabase() 
        closeDb=true
    }
    let devices = await getDeviceList(db)
    if(closeDb){
        db.closeSync()
    }
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
    let getData = async () => {
        let db = await getDatabase()
        let devices = await getDevices(db)
        //let readings = await getAllDeviceReadingStrings(devices,db) 
        setFirstRun(false)
        setDeviceView(devices)
        //setDeviceReadings(readings)
        
    }
    if(firstRun == true){

        getData()
    }
    

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
            headerImage={ 
                <Image
                    source={require('@/assets/images/partial-react-logo.png')}
                />
            }>
        <ThemedView>
            <Button onPress= { async () => { 
                let db = await getDatabase()
                const randomId = Math.random();
                let dev = new DeviceEntity(randomId.toString(), "test",undefined, true, undefined) 
                await addDeviceToDatabase(db, dev)
                //setDeviceList("a")
                db.closeSync()
                
            }} title={"Add to db"}/>
            <Button onPress= { async () => {
                let db = await getDatabase()
                await clearDatabase(db);
                db.closeSync()
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

