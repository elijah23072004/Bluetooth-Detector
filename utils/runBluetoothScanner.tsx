import { handleAndroidPermissions } from "@/utils/permission";
import BleManager, {
    Peripheral,
    BleScanMatchMode,
    BleScanCallbackType,
    BleScanMode,
} from "react-native-ble-manager";
import { BluetoothDevice,BluetoothDeviceContainer,RssiReading } from "@/components/bluetooth/bluetoothDevice";
import * as SQLite from "expo-sqlite"
import {addDeviceReadingToDatabase, DeviceEntity,DeviceReadingEntity,addDeviceToDatabase,getDatabase}from "@/utils/database"

const DEBUGBLE = false 
const SECONDS_TO_SCAN_FOR = 30;
const SERVICE_UUIDS: string[] = [];
const ALLOW_DUPLICATES = true;
const SLEEPTIME=2000
function onDiscoverDebug(peripheral:Peripheral){
    console.log("Discovered periheral:",peripheral)
    
}


function saveBleDevice(bleDevice:BluetoothDevice, db:SQLite.SQLiteDatabase){
        if(bleDevice == undefined){
            throw "bleDevice undefined in savePeriphal when should never be undefined"
        }
        let macaddress=bleDevice.id
        let deviceName=bleDevice.name
        if(deviceName == undefined){
            deviceName = "NO NAME"
        }
        let lastReading=Date.now()
        let ignore=false
        let deviceType=""
        let dev = new DeviceEntity(macaddress, deviceName, lastReading, ignore, deviceType)
        let timestamp = Date.now()

        let reading = new DeviceReadingEntity(macaddress, timestamp, bleDevice.get_average_rssi(), bleDevice.get_average_distance(), bleDevice.get_TX_POWER())

        saveDeviceToDatabase(dev,db)
        saveDeviceReadingToDatabase(reading,db)
   
}

function peripheralArrayToBleContainer(peripherals:Peripheral[]){
    let bluetoothDevices = new BluetoothDeviceContainer([])
    for(let peripheral of peripherals){
        let bleDevice = bluetoothDevices.getDevice(peripheral.id) 
        let name = peripheral.name
        if (bleDevice == undefined){
            if(name == undefined){
                name=""
            }
            bleDevice = new BluetoothDevice(peripheral.id,name, [])
        }
        let rssiReading = RssiReading.peripheralToRssiReading(peripheral)
        bleDevice.addRssiReading(rssiReading)
        bluetoothDevices.addDevice(bleDevice)
    }
    return bluetoothDevices
    
}

async function handleScannedPeripherals(peripherals:Peripheral[]){
    let db = getDatabase()
    let bluetoothDevices = peripheralArrayToBleContainer(peripherals)
    console.log(bluetoothDevices.length(), " scanned devices")
    for(let device of bluetoothDevices.namedDevices){
        saveBleDevice(device,db)
    }
    for(let device of bluetoothDevices.unNamedDevices){
        saveBleDevice(device,db)
    }

    return bluetoothDevices.length()
}
async function enableBluetooth(){
        try {
            console.debug("[enableBluetooth]");
            await BleManager.enableBluetooth();
        } catch (error) {
            console.error("[enableBluetooth] thrown", error);
        }

}
async function saveDeviceToDatabase(device:DeviceEntity,db:SQLite.SQLiteDatabase){
    addDeviceToDatabase(db,device)
}

async function saveDeviceReadingToDatabase(reading:DeviceReadingEntity, db?:SQLite.SQLiteDatabase){
    if(db == undefined){
        db=getDatabase()    
    }
    await addDeviceReadingToDatabase(db,reading)
}

export async function startBleManager(){
    await BleManager.start({ showAlert: false })
        .then(() => console.debug("BleManager started."))
        .catch((error: any) =>
        console.error("BeManager could not be started.", error)
    );
}

async function initialiseBluetooth(){
    handleAndroidPermissions();
    //if (!BleManager.isStarted()){
    console.log("Blemanager isStarted():",BleManager.isStarted())
    //}
    const state = await BleManager.checkState();
    console.log(state);
    if (state === "off") {
        await enableBluetooth();
    }
    
}

async function handleFinishedScan(){
    console.debug("[handleStopScan] scan is stopped.");
    //save found devices 
    let peripherals = await BleManager.getDiscoveredPeripherals()
    let out = await handleScannedPeripherals(peripherals)
    console.log("Peripherals done saving")
    return out
}

export async function runBluetoothScan(){
    let noScanned:number = -1;
    let resolver: ( () => void) | null;
    const promise = new Promise<void>((resolve) => {
        resolver=resolve;
    });

    await initialiseBluetooth()
    let listeners = []  
    let finished=false
    /*let waitForEnded = async () => {
        while(!finished){
            await new Promise(r => setTimeout(r,SLEEPTIME))
            
        }
    }*/

    let onStopScan = async () => { 
        noScanned =await  handleFinishedScan()
        for(let listener of listeners){
            listener.remove()
        }
        finished=true
        if(resolver){
            resolver()
        }
        
    }
    listeners.push( BleManager.onStopScan(onStopScan))
    if(DEBUGBLE){
        listeners.push( BleManager.onDiscoverPeripheral(onDiscoverDebug))
    }

    try {
        console.debug("[startScan] starting scan...");
        await BleManager.scan({
            seconds:SECONDS_TO_SCAN_FOR,
            matchMode: BleScanMatchMode.Sticky,
            scanMode: BleScanMode.LowLatency,
            callbackType: BleScanCallbackType.AllMatches,
            allowDuplicates:ALLOW_DUPLICATES,
            serviceUUIDs:SERVICE_UUIDS,
        })
        console.debug("[startScan] scan promise returned successfully.");
    } catch (error) {
        console.error("[startScan] ble scan error thrown", error);
    } 
    await promise
    console.log("Scan finished")
    return noScanned
}
