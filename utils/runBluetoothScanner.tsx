import { handleAndroidPermissions } from "@/utils/permission";
import BleManager, {
    Peripheral,
    BleScanMatchMode,
    BleScanCallbackType,
    BleScanMode,
} from "react-native-ble-manager";
import { BluetoothDevice,BluetoothDeviceContainer,RssiReading } from "@/components/bluetooth/bluetoothDevice";
import * as SQLite from "expo-sqlite"
import {addDeviceReadingToDatabase, DeviceEntity,DeviceReadingEntity,addDeviceToDatabase,getDatabase, is_high_risk_device, getNumberOfDeviceReadings, getDevice}from "@/utils/database"
import { sendNotification } from "./notifications";

const DEBUGBLE = false 
const SECONDS_TO_SCAN_FOR = 30;
const SERVICE_UUIDS: string[] = [];
const ALLOW_DUPLICATES = true;
const SLEEPTIME=2000
function onDiscoverDebug(peripheral:Peripheral){
    console.log("Discovered periheral:",peripheral)
    
}

function saveBleDevice(bleDevice:BluetoothDevice, db:SQLite.SQLiteDatabase, timestamp:number){
        if(bleDevice == undefined){
            throw "bleDevice undefined in savePeriphal when should never be undefined"
        }
        let macaddress=bleDevice.id
        let deviceName=bleDevice.name
        if(deviceName == undefined){
            deviceName = "NO NAME"
        }
        let lastReading=timestamp
        let ignore=false
        let deviceType=""
        let dev = new DeviceEntity(macaddress, deviceName, lastReading, ignore, deviceType)

        let reading = new DeviceReadingEntity(macaddress, timestamp, bleDevice.get_average_rssi(), bleDevice.get_average_distance(), bleDevice.get_TX_POWER())

        addDeviceToDatabase(db,dev)
        addDeviceReadingToDatabase(db,reading)
   
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

function checkSuspiciousDevice(device:BluetoothDevice){
    let db = getDatabase()
    let device_entity = getDevice(db,device.id)
    if(device_entity == null){
        console.error("checkSuspiciousDevice got device from database which returned null")
        return
    }
    if(is_high_risk_device(device_entity,db)){
        let title="Bluetooth scan has found a suspicious device";
        let body;
        if(device.name){
            body= device.name + " has being scanned: " + device_entity.numberOfDeviceReadings?.toString() + " times in the last 24 hours"
        }
        else{
            body = device.id + " device with no name has being scanned:" + device_entity.numberOfDeviceReadings?.toString() + " times in the last 24 hours"
        }
        sendNotification(title,body)
    }
}

async function handleScannedPeripherals(peripherals:Peripheral[]){
    let db = getDatabase()
    let bluetoothDevices = peripheralArrayToBleContainer(peripherals)
    console.log(bluetoothDevices.length(), " scanned devices")
    let timestamp = Date.now()
    for(let device of bluetoothDevices.namedDevices){
        saveBleDevice(device,db,timestamp)
        checkSuspiciousDevice(device)
    }
    for(let device of bluetoothDevices.unNamedDevices){
        saveBleDevice(device,db,timestamp)
        checkSuspiciousDevice(device) 
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

