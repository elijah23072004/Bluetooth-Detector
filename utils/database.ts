import { readConfigFromFile } from "@/components/utils";
import * as SQLite from "expo-sqlite"
import { get } from "react-native/Libraries/NativeComponent/NativeComponentRegistry";
import { Float } from "react-native/Libraries/Types/CodegenTypes";

const DB_NAME = "bluetoothDeviceReadings"
export class DeviceEntity{
    macaddress:string;
    deviceName:string;
    lastReading?:number;
    ignore?:boolean;
    deviceType?:string;
    numberOfDeviceReadings?:number;
    distance?:number;
    manufacturerKey?:string
    constructor(macaddress:string, deviceName:string, lastReading?:number, ignore?:boolean, deviceType?:string, numberOfDeviceReadings?:number,manufacturerKey?:string){
        this.macaddress=macaddress
        this.deviceName=deviceName
        this.lastReading=lastReading
        this.ignore=ignore
        this.deviceType=deviceType
        this.numberOfDeviceReadings=numberOfDeviceReadings
        this.manufacturerKey=manufacturerKey
    }
}

export class Database_simplex{
    static db:SQLite.SQLiteDatabase
    static get_database(){
        return Database_simplex.db
        
    }
    static load_database(){
        const db = SQLite.openDatabaseSync(DB_NAME)
        //{useNewConnection:true})
        createTablesIfNotExist(db)
        if(db == null){
            throw "getdatabase returned null which should never happen" 
        }
        Database_simplex.db = db
    }
    static reload_database(){
        try{
        Database_simplex.db.closeSync()
        }finally{
            Database_simplex.load_database()
        }
        console.log("Database reloaded!")
    }
}

export function deviceEntiyToString(device:DeviceEntity){
    let out =device.deviceName + " macaddress:" + device.macaddress  
    if (device.lastReading != undefined){
        out+=" last reading: " +convertTimestampToDateString(device.lastReading)
    }
    if(device.numberOfDeviceReadings != undefined){
        out += " number of readings:" + device.numberOfDeviceReadings.toString()
    }
    return out 
}

export class DeviceReadingEntity{
    macaddress:string;
    timestamp:number;
    rssi: Float;
    txPower?:number;
    serviceInfo?:string;
    estimatedDistance:Float
    constructor(macaddress:string, timestamp:number, rssi:Float, estimatedDistance:Float,txPower?:number, serviceInfo?:string){
        this.macaddress=macaddress
        this.timestamp=timestamp
        this.rssi=rssi
        this.txPower=txPower
        this.serviceInfo=serviceInfo
        this.estimatedDistance=estimatedDistance
    }

}

export function deviceReadingEntityToString(reading:DeviceReadingEntity): string{
    return reading.macaddress+" timestamp:" + convertTimestampToDateString(reading.timestamp) + ":" + "rssi reading:"+reading.rssi.toString()+ " txPower:"+reading.txPower + " estimatedDistance:"+ reading.estimatedDistance.toString() + " serviceInfo:" + reading.serviceInfo
}



export function createTablesIfNotExist(db:SQLite.SQLiteDatabase){
    let query = "CREATE TABLE IF NOT EXISTS devices (macaddress TEXT PRIMARY KEY, deviceName TEXT NOT NULL, lastReading TIMESTAMP, ignore BOOL, deviceType TEXT, manufacturerKey TEXT);\n"
    query +=  "CREATE TABLE IF NOT EXISTS deviceReadings ( timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, macaddress TEXT NOT NULL, rssi FLOAT NOT NULL, txPower INT, ServiceInfo TEXT, estimatedDistance FLOAT, PRIMARY KEY(timestamp, macaddress), FOREIGN KEY(macaddress) REFERENCES devices(macaddress));"
    db.execSync(query)
}

export function getDatabase(){
    return Database_simplex.get_database()
}


export async function clearDatabase(db:SQLite.SQLiteDatabase){
    //deletes all values in the datbase
    //let query = "DELETE from devices;"
    //query +="DELETE from deviceReadings;"
    let query = "DROP TABLE IF EXISTS deviceReadings;"
    query+="DROP TABLE IF EXISTS devices;"
    await db.execAsync(query)
    console.log("Database cleared")
    createTablesIfNotExist(db)
}
export async function deleteDatabase(){
    getDatabase().closeSync()
    SQLite.deleteDatabaseSync(DB_NAME)
}

export function getDevice(db:SQLite.SQLiteDatabase, macAddress:string){
    const device = db.getFirstSync<DeviceEntity>("SELECT * FROM devices WHERE macaddress = ?",macAddress);
    console.log(device?.manufacturerKey)
    if (device){
        device.numberOfDeviceReadings =getNumberOfDeviceReadings(db,device.macaddress)
        device.distance = get_most_recent_distance(db,device.macaddress)
        return device
    }
    return null
}
export function isMacaddressInDatabase(db:SQLite.SQLiteDatabase, macAddress:string){
    return getDevice(db,macAddress) != null
}


export function getNumberOfDeviceReadings(db:SQLite.SQLiteDatabase, macAddress:string){
    let query = "SELECT COUNT(*) FROM deviceReadings WHERE macaddress = ?"
    //console.log(query)
    //console.log(macAddress)
    let res = db.getFirstSync(query, macAddress)
    //console.log(res)
    if (res == undefined){
        return 0
    }
    if (res['COUNT(*)'] == undefined){
        return 0    
    }
    return res['COUNT(*)']
}

export async function getDeviceReadings(db:SQLite.SQLiteDatabase, macaddress:string){
    let query = "SELECT * FROM deviceReadings WHERE macaddress = ? ORDER BY timestamp DESC"
    let output = []
    for await (const reading of db.getEachAsync<DeviceReadingEntity>(query,macaddress)){
        output.push(reading as DeviceReadingEntity)
    }
    return output
}

export async function getDeviceReadingsString(macaddress:string, db?:SQLite.SQLiteDatabase){
    if(db==undefined){
        db=getDatabase()
    }
    let readings = await getDeviceReadings(db,macaddress)
    let out = ""
    for (let reading of readings){
        //console.log(reading)
        out+= deviceReadingEntityToString(reading)+"\n"
    
    }
    return out
}
export async function getAllDeviceReadingStrings(devices:DeviceEntity[], db?:SQLite.SQLiteDatabase){
    if(db==undefined){
        db=getDatabase()
    }
    let out:Record<string,string> = {}
    for (let device of devices){
        out[device.macaddress] = await getDeviceReadingsString(device.macaddress, db)
    }
    return out
}



export function addDeviceToDatabase(db:SQLite.SQLiteDatabase, device:DeviceEntity){
    if (isMacaddressInDatabase(db,device.macaddress)){
        //console.log(device.macaddress + " already in database")
        return 
    }
    

    let firstHalf= "INSERT INTO devices ( macaddress, deviceName"
    let secondHalf = ") VALUES (?, ?"
    let args = [device.macaddress, device.deviceName]
    console.log(device.manufacturerKey)
    if(device.lastReading != undefined){
        secondHalf+=", ?"
        firstHalf+=", lastReading"
        args.push(device.lastReading.toString())
    }
    if(device.manufacturerKey != undefined){
        secondHalf+=", ?"
        firstHalf+=", manufacturerKey"
        args.push(device.manufacturerKey)
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
    //console.log(query)
    //console.log(args)
    
    //await db.runAsync("INSERT INTO devices (macaddress, deviceName) VALUES (?, ?);",device.macaddress,device.deviceName)
    try{
        db.runSync(query, args)
    }catch(e){
        console.error(e)

    }

}
export async function addDeviceReadingToDatabase(db:SQLite.SQLiteDatabase, reading:DeviceReadingEntity){
    let firstHalf = "INSERT INTO deviceReadings ( macaddress, rssi, estimatedDistance"
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
    //console.log(query)
    await db.runAsync(query, args)
    query = "UPDATE devices SET lastReading = ? WHERE macaddress = ?"
    let lastReading = db.getFirstSync("SELECT timestamp FROM deviceReadings WHERE macaddress = ? ORDER BY timestamp DESC", reading.macaddress) 
    //console.log(lastReading.timestamp)
    db.runSync(query,lastReading.timestamp, reading.macaddress)


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
function compare_device_entites(a:DeviceEntity, b:DeviceEntity):number{
    if (a.lastReading == undefined){
        if(b.lastReading == undefined){
            return 0    
        }
        return -1
    }
    if (b.lastReading == undefined){
        return 1 
    }
    return b.lastReading - a.lastReading
}
function sort_device_list(device_list:DeviceEntity[], comp_fn: (a:DeviceEntity, b:DeviceEntity) => number = compare_device_entites){
    let output = device_list 
    output.sort(comp_fn)
    output.reverse()
    //bubble sort for now
    return output 
}
export async function getDeviceList(db:SQLite.SQLiteDatabase,sort_list:boolean=true){
    let device_list :DeviceEntity[]= [];
    for await (const device of getDeviceListIterator(db)){
        device.numberOfDeviceReadings= getNumberOfDeviceReadings(db,device.macaddress)
        device.distance = get_most_recent_distance(db,device.macaddress)
        console.log(device.manufacturerKey)
        device_list.push(device)
    }
    if(sort_list){
        device_list = sort_device_list(device_list)
    }
    return device_list
}


export async function getDeviceInfomation(db:SQLite.SQLiteDatabase, macaddress:string){
    let readings = await getDeviceReadings(db,macaddress)
    let device = getDevice(db,macaddress)
    if(readings.length == 0){
        console.error("No device readings for macaddress:"+macaddress)
        throw "Readings array in getDeviceInfomation is empty"
    }
    let mostRecentReadingTime= readings[0].timestamp
    let firstReadingTime = readings[readings.length-1].timestamp
    let numberOfDeviceReadings = readings.length
    let mostRecentReadingDistance = readings[0].estimatedDistance
    return {device:device,mostRecentReadingTime:mostRecentReadingTime, firstReadingTime:firstReadingTime, numberOfDeviceReadings:numberOfDeviceReadings, mostRecentReadingDistance:mostRecentReadingDistance, serviceInfo:readings[0].serviceInfo}
}


export function convertTimestampToDateString(timestamp:number){
        let date = new Date(timestamp)
        return date.toUTCString()
}

export function is_high_risk_device(device:DeviceEntity,db:SQLite.SQLiteDatabase,threshold_for_suspicious_device:number ){
    if(device.numberOfDeviceReadings == undefined){
        device.numberOfDeviceReadings = getNumberOfDeviceReadings(db,device.macaddress)
    }
    if(device.numberOfDeviceReadings != undefined && device.numberOfDeviceReadings > threshold_for_suspicious_device){
        return true
    }
    return false
}



export function split_devices_into_high_and_normal_risk(devices:DeviceEntity[]){
    let high_risk = []
    let low_risk = []
    let db = SQLite.openDatabaseSync(DB_NAME)
    let config = readConfigFromFile()
    for (let device of devices){
        if(is_high_risk_device(device,db,config.threshold_for_suspicius_device)){
            high_risk.push(device)
        }
        else{
            low_risk.push(device)
        }
    }
    return {high_risk:high_risk, low_risk:low_risk};
    
    
}


export function get_most_recent_reading(db:SQLite.SQLiteDatabase, macaddress:string){
    let query = "SELECT * FROM deviceReadings WHERE macaddress = ? ORDER BY timestamp DESC"
    

    let res = db.getFirstSync<DeviceReadingEntity>(query, macaddress)
    return res


}

export function get_most_recent_distance(db:SQLite.SQLiteDatabase, macaddress:string){
    let reading = get_most_recent_reading(db,macaddress)
    return reading?.estimatedDistance 
}
