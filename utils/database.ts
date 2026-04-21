import * as SQLite from "expo-sqlite"
import { Float } from "react-native/Libraries/Types/CodegenTypes";

const DB_NAME = "bluetoothDeviceReadings"
export class DeviceEntity{
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
export class DeviceReadingEntity{
    macaddress:string;
    timestamp:Number;
    rssi: Float;
    txPower?:Number;
    serviceInfo?:string;
    estimatedDistance:Float
    constructor(macaddress:string, timestamp:Number, rssi:Float, estimatedDistance:Float,txPower?:Number, serviceInfo?:string){
        this.macaddress=macaddress
        this.timestamp=timestamp
        this.rssi=rssi
        this.txPower=txPower
        this.serviceInfo=serviceInfo
        this.estimatedDistance=estimatedDistance
    }
}


export async function createTablesIfNotExist(db:SQLite.SQLiteDatabase){
    let query = "CREATE TABLE IF NOT EXISTS devices (macaddress TEXT PRIMARY KEY, deviceName TEXT NOT NULL, lastReading TIMESTAMP, ignore BOOL, deviceType TEXT);\n"
    query +=  "CREATE TABLE IF NOT EXISTS deviceReadings ( timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, macAddress TEXT NOT NULL, rssi FLOAT NOT NULL, txPower INT, ServiceInfo TEXT, estimatedDistance FLOAT, PRIMARY KEY(timestamp, macaddress), FOREIGN KEY(macAddress) REFERENCES devices(macaddress));"
    await db.execAsync(query)
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

export function getDevice(db:SQLite.SQLiteDatabase, macAddress:string){
    const device = db.getFirstSync<DeviceEntity>("SELECT * FROM devices WHERE macaddress = '?'",macAddress);
    if (device){
        return device
    }
    return null
}
export function isMacaddressInDatabase(db:SQLite.SQLiteDatabase, macAddress:string){
    return getDevice(db,macAddress) != null
}


export async function getNumberOfDeviceReadings(db:SQLite.SQLiteDatabase, macAddress:string){
    let query = "SELECT COUNT(*) FROM deviceReadings WHERE macAddress = ?"
    console.log(query)
    console.log(macAddress)
    let res = await db.getFirstAsync(query, macAddress)
    console.log(res)
    if (res == undefined){
        return 0
    }
    if (res['COUNT(*)'] == undefined){
        return 0    
    }
    return res['COUNT(*)']
}

export async function addDeviceToDatabase(db:SQLite.SQLiteDatabase, device:DeviceEntity){
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
export async function addDeviceReadingToDatabase(db:SQLite.SQLiteDatabase, reading:DeviceReadingEntity){
    let firstHalf = "INSERT INTO deviceReadings ( macAddress, rssi, estimatedDistance"
    let secondHalf = ") VALUES (?,  ?, ?"
    let args = [reading.macaddress, reading.rssi.toString(), reading.estimatedDistance.toString()]

    /*if (reading.txPower != undefined){
        firstHalf+=", txPower"
        secondHalf+=", ?"
        args.push(reading.txPower.toString())
    }
    if (reading.serviceInfo!= undefined){
        firstHalf+=", ServiceInfo"
        secondHalf+=", ?"
        args.push(reading.serviceInfo)
    }*/
    let query = firstHalf + secondHalf + ")";
    console.log(query)
    await db.runAsync(query, args)
    query = "UPDATE device SET lastReading = ? WHERE macaddress = ?"
    let lastReading = db.getFirstAsync("SELECT timestamp FROM deviceReadings WHERE macAddress = ? ORDER BY timestamp ASC", reading.macaddress) 
    await db.runAsync(query,lastReading.toString(), reading.macaddress)


}

export async function logDatabaseTableSchemas(db:SQLite.SQLiteDatabase){
    let query = "SELECT tbl_name FROM sqlite_master WHERE type='table'";
    for await (const row of db.getEachAsync<string>(query)){
        console.log(row)
    }
    
}

export function getDeviceListIterator(db:SQLite.SQLiteDatabase){
    let query = "SELECT * FROM devices";
    return db.getEachAsync<DeviceEntity>(query)

}
