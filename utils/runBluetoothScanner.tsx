import { handleAndroidPermissions } from "@/utils/permission";
import BleManager, {
    Peripheral,
    BleScanMatchMode,
    BleScanCallbackType,
    BleScanMode,
} from "react-native-ble-manager";
import { BluetoothDevice,BluetoothDeviceContainer,RssiReading } from "@/components/bluetooth/bluetoothDevice";
import * as SQLite from "expo-sqlite"
import {addDeviceReadingToDatabase, DeviceEntity,DeviceReadingEntity,addDeviceToDatabase,getDatabase,isMacaddressInDatabase}from "@/utils/database"

/*const requestPermissions = async () => {
    if (Platform.OS === 'android') {
        // Android 12+ (API 31) requires these
        if (Platform.Version >= 31) {
            const granted = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ]);
            return (
                granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
                    granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
            );
        } 
        // Older Android versions mainly need Location for scanning
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    // iOS permissions are handled by the library/Info.plist
    return true; 
};*/

const SECONDS_TO_SCAN_FOR = 30;
const SERVICE_UUIDS: string[] = [];
const ALLOW_DUPLICATES = true;


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
    let db = await getDatabase()
    let bluetoothDevices = peripheralArrayToBleContainer(peripherals)
    for(let device of bluetoothDevices.namedDevices){
        saveBleDevice(device,db)
    }
    for(let device of bluetoothDevices.unNamedDevices){
        saveBleDevice(device,db)
    }

    setTimeout( () => {db.closeSync()}, 5000)
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
    let closeDB=false
    if(db == undefined){
        closeDB=true
        db=await getDatabase()    
    }
        
    await addDeviceReadingToDatabase(db,reading)
    if(closeDB){
        db.closeSync()    
    }

}


async function initialiseBluetooth(){
    handleAndroidPermissions();
    BleManager.start({ showAlert: false })
        .then(() => console.debug("BleManager started."))
        .catch((error: any) =>
        console.error("BeManager could not be started.", error)
    );
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
    await handleScannedPeripherals(peripherals)
    console.log("Peripherals done saving")
}

export async function runBluetoothScan(){
    await initialiseBluetooth()
    let listeners = []  
    let onStopScan = () => { 
        handleFinishedScan()
        for(let listener of listeners){
            listener.remove()
        }
        
    }
    listeners.push( BleManager.onStopScan(onStopScan))

    try {
        console.debug("[startScan] starting scan...");
        BleManager.scan({
            seconds:SECONDS_TO_SCAN_FOR,
            matchMode: BleScanMatchMode.Sticky,
            scanMode: BleScanMode.LowLatency,
            callbackType: BleScanCallbackType.AllMatches,
            allowDuplicates:ALLOW_DUPLICATES,
            serviceUUIDs:SERVICE_UUIDS,
        })
        .then(async () => {
            console.debug("[startScan] scan promise returned successfully.");
        }).catch((err: any) => {
            console.error("[startScan] ble scan returned in error", err);
        });
    } catch (error) {
        console.error("[startScan] ble scan error thrown", error);
    }
       
}
