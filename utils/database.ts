import * as SQLite from "expo-sqlite"

const DB_NAME = "bluetoothDeviceReadings"
export class Device{
    macaddress:string;
    deviceName:string;
    lastReading?:number;
    ignore?:boolean;
    deviceType?:string;
    constructor(macaddress:string, deviceName:string, lastReading?:number, ignore?:boolean, deviceType?:string){
        this.macaddress=macaddress
        this.deviceName=deviceName
        this.lastReading=lastReading
        this.ignore=ignore
        this.deviceType=deviceType
    }
}


export async function createTablesIfNotExist(db:SQLite.SQLiteDatabase){
    let query = "CREATE TABLE IF NOT EXISTS devices (macaddress TEXT PRIMARY KEY, deviceName TEXT NOT NULL, lastReading TIMESTAMP, ignore BOOL, deviceType TEXT);\n"
    query +=  "CREATE TABLE IF NOT EXISTS deviceReadings ( deviceReadingID INT PRIMARY KEY, timestamp TIMESTAMP NOT NULL, macAddress TEXT NOT NULL, rssi FLOAT NOT NULL, txPower INT, ServiceInfo TEXT, estimatedDistance FLOAT, FOREIGN KEY(macAddress) REFERENCES devices(macaddress));"
    console.log(query)
    await db.execAsync(query)
    logDatabaseTableSchemas(db)
}

export async function getDatabase(){

    const db = await SQLite.openDatabaseAsync(DB_NAME)
    await createTablesIfNotExist(db)
    return db
}
export async function clearDatabase(db:SQLite.SQLiteDatabase){
    //deletes all values in the datbase
    let query = "DELETE from devices;"
    await db.execAsync(query)
}
export async function deleteDatabase(){

    SQLite.deleteDatabaseSync(DB_NAME)
}



export async function addDeviceToDatabase(db:SQLite.SQLiteDatabase, device:Device){
    let firstHalf= "INSERT INTO devices ( macaddress, deviceName"
    let secondHalf = ") VALUES (?, ?"
    let args = [device.macaddress, device.deviceName]
    if(device.lastReading != undefined){
        secondHalf+=", ?"
        firstHalf+=", lastReading"
        args.push(device.lastReading.toString())
    }
    if(device.ignore != undefined){
        secondHalf+=", ?"
        firstHalf+=", ignore"
        args.push(device.ignore.toString())
    }
    if(device.deviceType != undefined){
        secondHalf+=", ?"
        firstHalf+=", deviceType"
        args.push(device.deviceType)
    }
    let query = firstHalf + secondHalf + ");"
    console.log(query)
    
    //await db.runAsync("INSERT INTO devices (macaddress, deviceName) VALUES (?, ?);",device.macaddress,device.deviceName)
    await db.runAsync(query, args)

}


export async function logDatabaseTableSchemas(db:SQLite.SQLiteDatabase){
    let query = "SELECT tbl_name FROM sqlite_master WHERE type='table'";
    for await (const row of db.getEachAsync<string>(query)){
        console.log(row)
    }
    
}
