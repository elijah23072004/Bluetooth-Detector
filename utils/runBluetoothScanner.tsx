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


import company_identifiers from '@/assets/company_identifiers.json'
import { maybeAddSuffix } from "react-native-reanimated/lib/typescript/common";
import { ConfigData, readConfigFromFile } from "@/components/utils";


const DEBUGBLE = false 
const SERVICE_UUIDS: string[] = [];
const ALLOW_DUPLICATES = true;
const SLEEPTIME=2000



function onDiscoverDebug(peripheral:Peripheral){
    console.log("Discovered periheral:",peripheral)
    
}


function should_save_device(reading:DeviceReadingEntity, max_distance:number){
    if(reading.estimatedDistance > max_distance){
        return false
    }
    return true
}

function saveBleDevice(bleDevice:BluetoothDevice, db:SQLite.SQLiteDatabase, timestamp:number,max_distance:number){
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
        let manufacturerKey = bleDevice.manufacturerKey
        let dev = new DeviceEntity(macaddress, deviceName, lastReading, ignore, deviceType,0,manufacturerKey)
        console.log("device entity:",dev.manufacturerKey,"bleDevice:",bleDevice.manufacturerKey)

        let reading = new DeviceReadingEntity(macaddress, timestamp, bleDevice.get_average_rssi(), bleDevice.get_average_distance(), bleDevice.get_TX_POWER())
        if(should_save_device(reading,max_distance)){
            try{
                addDeviceToDatabase(db,dev)
                addDeviceReadingToDatabase(db,reading)
            }catch(e){
                console.error("Error from saveBleDevice:",e)
            }
            return true
        }
        else{
            console.log(macaddress+" has to high distance to be counted as nearby object so not saved in database with distance:"+reading.estimatedDistance)
            return false
        }
   
}

function peripheralArrayToBleContainer(peripherals:Peripheral[]){
    let bluetoothDevices = new BluetoothDeviceContainer([])
    for(let peripheral of peripherals){
        console.log("Peripheral advertisiing name same as reg name:",peripheral.advertising.localName == peripheral.name)
        console.log("Entire peripheral:",peripheral)
        console.log("manufacturerData:",peripheral.advertising.manufacturerData)
        let manufacturerData = peripheral.advertising.manufacturerData
        let manufacturer 
        if(manufacturerData){
            let manufacturerKey = Number("0x"+(Object.keys(manufacturerData))[0])
            if( !Number.isFinite(manufacturerKey) || manufacturerKey == undefined || manufacturerKey < 0 || manufacturerKey > company_identifiers.company_identifiers.length){
                console.log("manufacturerKey of:"+manufacturerKey+" not in json file")
            }
            else{
                console.log(manufacturerKey)
                if(company_identifiers.company_identifiers[manufacturerKey].value != manufacturerKey){
                    console.log("Item at index:"+manufacturerKey.toString() + " not equal to value:"+company_identifiers.company_identifiers[manufacturerKey].value.toString())
                }
                manufacturer=company_identifiers.company_identifiers[manufacturerKey].name
            }
            console.log("Manufacturer:",manufacturer)
        }

        let bleDevice = bluetoothDevices.getDevice(peripheral.id) 
        let name = peripheral.name
        if (bleDevice == undefined){
            if(name == undefined){
                name=""
            }
            bleDevice = new BluetoothDevice(peripheral.id,name,[],manufacturer)
        }
        let rssiReading = RssiReading.peripheralToRssiReading(peripheral)
        bleDevice.addRssiReading(rssiReading)
        bluetoothDevices.addDevice(bleDevice)
    }
    return bluetoothDevices
    
}

function checkSuspiciousDevice(device:BluetoothDevice, threshold_for_suspicius_device:number){
    let db = getDatabase()
    let device_entity = getDevice(db,device.id)
    if(device_entity?.ignore){
        console.log("suspicious device with name:"+device.name+ " and macaddress:"+device.id+" is ignored")
        return
    }
    if(device_entity == null){
        console.error("checkSuspiciousDevice got device from database which returned null, could be due to device not getting saved from scan")
        return
    }
    if(is_high_risk_device(device_entity,db,threshold_for_suspicius_device)){
        let title="Bluetooth scan has found a suspicious device";
        let body;
        if(device.name){
            body= device.name + " has being scanned: " + device_entity.numberOfDeviceReadings?.toString() + " times in the last 24 hours"
        }
        else{
            body = device.id + " device with no name has being scanned:" + device_entity.numberOfDeviceReadings?.toString() + " times in the last 24 hours"
        }
        let route = "/showDeviceDetails?macaddress="+device.id
        sendNotification(title,body,route)
    }
}

async function handleScannedPeripherals(peripherals:Peripheral[],config:ConfigData){
    let db = getDatabase()
    let bluetoothDevices = peripheralArrayToBleContainer(peripherals)
    console.log(bluetoothDevices.length(), " scanned devices")
    let timestamp = Date.now()
    let count=0
    for(let device of bluetoothDevices.namedDevices){
        if(saveBleDevice(device,db,timestamp,config.maximum_scan_distance)){
            checkSuspiciousDevice(device,config.threshold_for_suspicius_device)
            count+=1
        }
    }
    for(let device of bluetoothDevices.unNamedDevices){
        if(saveBleDevice(device,db,timestamp,config.maximum_scan_distance)){
            checkSuspiciousDevice(device,config.threshold_for_suspicius_device) 
            count+=1
        }
    }
    console.log((bluetoothDevices.length() - count).toString() + " devices skipped")
    return count 
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

async function handleFinishedScan(config:ConfigData){
    console.debug("[handleStopScan] scan is stopped.");
    //save found devices 
    let peripherals = await BleManager.getDiscoveredPeripherals()
    let out = await handleScannedPeripherals(peripherals,config)
    console.log("Peripherals done saving")
    return out
}

export async function runBluetoothScan(){
    let noScanned:number = -1;
    let config = readConfigFromFile()
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
        noScanned =await  handleFinishedScan(config)
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
            seconds:config.scan_duration,
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

