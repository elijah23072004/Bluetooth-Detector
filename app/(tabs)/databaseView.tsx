import * as SQLite from 'expo-sqlite';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useState } from 'react';


interface device{
    macaddress:string;
    deviceName:string;

}


async function createTablesIfNotExist(db:SQLite.SQLiteDatabase){
    let query = "CREATE TABLE IF NOT EXISTS devices (macaddress TEXT PRIMARY KEY, deviceName TEXT NOT NULL);"
    console.log(query)
    await db.execAsync(query)
}
async function addDeviceToDatabase(db:SQLite.SQLiteDatabase,mac:string, name:string){
    //sanitise name and make sure mac is valid 
    await db.runAsync("INSERT INTO devices (macaddress, deviceName) VALUES (?, ?);",mac,name)

}

async function getDatabase(name:string){

    const db = await SQLite.openDatabaseAsync(name)
    console.log("creating tables")
    await createTablesIfNotExist(db)
    console.log("created tables")
    return db
}


async function printDatabaseStuff(){

    const db = await getDatabase("bluetoothDeviceReadings")
    const randomId = Math.random()
    await addDeviceToDatabase(db,randomId.toString(),"test")

    let text=""
    for await (const row of db.getEachAsync<device>('SELECT * from devices')){
        console.log(row.macaddress, row.deviceName)
        text+=row.macaddress.toString() + "," + row.deviceName.toString() + "\n";
    }
    return text
}

const databaseTest = ()  =>{
    const [ deviceList, setDeviceList] = useState<string>();
    printDatabaseStuff().then( (text) =>{
        setDeviceList(text)
    })
    return (
        <ThemedView>
            <ThemedText>Text should be outputted on debug console</ThemedText>
            <ThemedText>{ deviceList } </ThemedText>
        </ThemedView>
    )
}

export default databaseTest

