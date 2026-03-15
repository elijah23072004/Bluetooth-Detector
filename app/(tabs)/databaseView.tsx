import * as SQLite from 'expo-sqlite';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useState } from 'react';
import { Button } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { Image } from 'expo-image';
import { Device, addDeviceToDatabase, getDatabase, clearDatabase, deleteDatabase } from '@/utils/database';


async function printDatabaseStuff(db: SQLite.SQLiteDatabase){
    let text=""
    for await (const row of db.getEachAsync<Device>('SELECT * from devices')){
        console.log(row.macaddress, row.deviceName)
        text+="mac:"+row.macaddress.toString() + ", device name:" + row.deviceName.toString()+ "\n";
    }
    return text
}

const databaseTest = ()  =>{
    const [ database, setDatabase] = useState<SQLite.SQLiteDatabase>();
    if( database == undefined){
        getDatabase().then( (database:SQLite.SQLiteDatabase) => { 
            setDatabase(database); 
        });
    }
    let updateDeviceList = () => {
        if ( database != undefined){
            printDatabaseStuff(database).then( (text) =>{
                setDeviceList(text)
            })
        }
    }
    updateDeviceList()
    const [ deviceList, setDeviceList] = useState<string>("");
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
                if(database != undefined){
                    const randomId = Math.random();
                    let dev = new Device(randomId.toString(), "test",undefined, true, undefined) 
                    await addDeviceToDatabase(database, dev)
                    setDeviceList("a")
                }
            }} title={"Add to db"}/>
            <Button onPress= { async () => {
                if (database != undefined){
                    await clearDatabase(database);
                    setDeviceList("")
                }
            }} title={"Clear db"}/>
            <Button onPress= { () => {
                    if(database != undefined){
                        database.closeSync(); 
                        setDatabase(undefined)
                    
                    }
                    deleteDatabase()
            }} title={"Delete db"}/>
            <ThemedText>{ deviceList } </ThemedText>
        </ThemedView>
        </ParallaxScrollView>
    )
}

export default databaseTest

