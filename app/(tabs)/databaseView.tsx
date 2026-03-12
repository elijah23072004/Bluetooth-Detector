import * as SQLite from 'expo-sqlite';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';


interface device{
    macaddress:string;
    deviceName:string;

}


async function createTablesIfNotExist(db:SQLite.SQLiteDatabase){
    let query = "CREATE TABLE IF NOT EXISTS devices(macaddress TEXT PRIMARY KEY, deviceName TEXT NOT NULL;"
        + "INSERT INTO devices (macaddress, deviceName) VALUES ('AA:AA:AA', 'headphones');"

    await db.execAsync(query)
}
async function addDeviceToDatabase(db:SQLite.SQLiteDatabase,mac:string, name:string){
    //sanitise name and make sure mac is valid 
    await db.runAsync("INSERT INTO devices (macaddress, deviceName) VALUES (?, ?)",mac,name)

}

async function getDatabase(name:string){

    const db = await SQLite.openDatabaseAsync(name)
    await createTablesIfNotExist(db)
    return db
}

const databaseTest = async () =>{
    const db = await getDatabase("bluetoothDeviceReadings")
    const randomId = Math.random()
    await addDeviceToDatabase(db,randomId.toString(),"test")

    const allRows = await db.getAllAsync<device>('SELECT * FROM devices')
    for(const row of allRows){
        console.log(row.macaddress, row.deviceName)
    }
    let text=""
    for await (const row of db.getEachAsync<device>('SELECT * from devices')){
        console.log(row.macaddress, row.deviceName)
        text+=row.macaddress.toString() + "," + row.deviceName.toString() + "\n";
    }
    let databaseView = <ThemedText>{text}</ThemedText>
    return (
        <ThemedView>
            <ThemedText>Text should be outputted on debug console</ThemedText>
            {databaseView}
        </ThemedView>
    )
}

export default databaseTest

