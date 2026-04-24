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
    constructor(macaddress:string, deviceName:string, lastReading?:number, ignore?:boolean, deviceType?:string, numberOfDeviceReadings?:number){
        this.macaddress=macaddress
        this.deviceName=deviceName
        this.lastReading=lastReading
        this.ignore=ignore
        this.deviceType=deviceType
        this.numberOfDeviceReadings=numberOfDeviceReadings
    }
}

export function deviceEntiyToString(device:DeviceEntity){
    let out =device.deviceName + " macaddress:" + device.macaddress  
    if (device.lastReading != undefined){
        console.log(device.lastReading.valueOf())
        let date = new Date(device.lastReading)
        out+=" last reading: " + date.toUTCString()
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
    let date = new Date(reading.timestamp)
    return reading.macaddress+" timestamp:" + date.toUTCString() + ":" + "rssi reading:"+reading.rssi.toString()+ " txPower:"+reading.txPower + " estimatedDistance:"+ reading.estimatedDistance.toString() + " serviceInfo:" + reading.serviceInfo
}



export async function createTablesIfNotExist(db:SQLite.SQLiteDatabase){
    let query = "CREATE TABLE IF NOT EXISTS devices (macaddress TEXT PRIMARY KEY, deviceName TEXT NOT NULL, lastReading TIMESTAMP, ignore BOOL, deviceType TEXT);\n"
    query +=  "CREATE TABLE IF NOT EXISTS deviceReadings ( timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, macaddress TEXT NOT NULL, rssi FLOAT NOT NULL, txPower INT, ServiceInfo TEXT, estimatedDistance FLOAT, PRIMARY KEY(timestamp, macaddress), FOREIGN KEY(macaddress) REFERENCES devices(macaddress));"
    await db.execAsync(query)
}

export async function getDatabase(){

    const db = await SQLite.openDatabaseAsync(DB_NAME)
//{useNewConnection:true})
    await createTablesIfNotExist(db)

    if(db == null){
        throw "getdatabase returned null which should never happen" 
    }

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
    const device = db.getFirstSync<DeviceEntity>("SELECT * FROM devices WHERE macaddress = ?",macAddress);
    if (device){
        device.numberOfDeviceReadings =getNumberOfDeviceReadings(db,device.macaddress)
        return device
    }
    return null
}
export function isMacaddressInDatabase(db:SQLite.SQLiteDatabase, macAddress:string){
    return getDevice(db,macAddress) != null
}


export function getNumberOfDeviceReadings(db:SQLite.SQLiteDatabase, macAddress:string){
    let query = "SELECT COUNT(*) FROM deviceReadings WHERE macaddress = ?"
    console.log(query)
    console.log(macAddress)
    let res = db.getFirstSync(query, macAddress)
    console.log(res)
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
        db=await getDatabase()
    }
    let readings = await getDeviceReadings(db,macaddress)
    let out = ""
    for (let reading of readings){
        console.log(reading)
        console.log(typeof(reading))
        out+= deviceReadingEntityToString(reading)+"\n"
    
    }
    return out
}
export async function getAllDeviceReadingStrings(devices:DeviceEntity[], db?:SQLite.SQLiteDatabase){
    if(db==undefined){
        db=await getDatabase()
    }
    let out:Record<string,string> = {}
    for (let device of devices){
        out[device.macaddress] = await getDeviceReadingsString(device.macaddress, db)
    }
    return out
}



export function addDeviceToDatabase(db:SQLite.SQLiteDatabase, device:DeviceEntity){
    if (isMacaddressInDatabase(db,device.macaddress)){
        console.log(device.macaddress + " already in database")
        return 
    }
    

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
    console.log(args)
    
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
    console.log(query)
    await db.runAsync(query, args)
    query = "UPDATE devices SET lastReading = ? WHERE macaddress = ?"
    let lastReading = db.getFirstSync("SELECT timestamp FROM deviceReadings WHERE macaddress = ? ORDER BY timestamp ASC", reading.macaddress) 
    console.log(lastReading.timestamp)
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
        return 1
    }
    if (b.lastReading == undefined){
        return -1    
    }
    return b.lastReading - a.lastReading
}
function sort_device_list(device_list:DeviceEntity[], comp_fn: (a:DeviceEntity, b:DeviceEntity) => number = compare_device_entites){
    let output = device_list 
    output.sort(comp_fn)
    //bubble sort for now
    return output 
}
export async function getDeviceList(db:SQLite.SQLiteDatabase,sort_list:boolean=true){
    let device_list :DeviceEntity[]= [];
    for await (const device of getDeviceListIterator(db)){
        device.numberOfDeviceReadings= getNumberOfDeviceReadings(db,device.macaddress)
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

    let mostRecentReadingTime= readings[0].timestamp
    let firstReadingTime = readings[readings.length-1].timestamp
    let numberOfDeviceReadings = readings.length
    let mostRecentReadingDistance = readings[0].estimatedDistance
    return {device:device,mostRecentReadingTime:mostRecentReadingTime, firstReadingTime:firstReadingTime, numberOfDeviceReadings:numberOfDeviceReadings, mostRecentReadingDistance:mostRecentReadingDistance, serviceInfo:readings[0].serviceInfo}
}
