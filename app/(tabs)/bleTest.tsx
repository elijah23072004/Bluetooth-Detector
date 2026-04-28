import { handleAndroidPermissions } from "@/utils/permission";
import { Image } from "expo-image";
import { DeviceList } from "@/components/bluetooth/deviceList";
import {Button} from "react-native"

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform, Alert, Linking} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import BleManager, {
    Peripheral,
    BleScanMatchMode,
    BleScanCallbackType,
    BleScanMode,
} from "react-native-ble-manager";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { BluetoothDevice,BluetoothDeviceContainer,RssiReading } from "@/components/bluetooth/bluetoothDevice";
import { BluetoothDeviceList } from "@/components/bluetooth/bluetoothDeviceList";
import * as SQLite from "expo-sqlite"
import {addDeviceReadingToDatabase, DeviceEntity,DeviceReadingEntity,addDeviceToDatabase,getDatabase,isMacaddressInDatabase, Database_simplex}from "@/utils/database"

import { triggerTaskTest } from "@/utils/backgroundTask";

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

const SECONDS_TO_SCAN_FOR = 10;
const SERVICE_UUIDS: string[] = [];
const ALLOW_DUPLICATES = false;


function savePeriphal(peripheral:Peripheral,bluetoothDevices:BluetoothDeviceContainer, db?:SQLite.SQLiteDatabase){
        if (!peripheral.name) {
            peripheral.name = "NO NAME";
        }
        let macaddress=peripheral.id
        let deviceName=peripheral.name
        let lastReading=Date.now()
        let ignore=false
        let deviceType=""
        let dev = new DeviceEntity(macaddress, deviceName, lastReading, ignore, deviceType)
        let bleDevice = bluetoothDevices.getDevice(peripheral.id)
        let rssiReading = RssiReading.peripheralToRssiReading(peripheral)
        if(bleDevice == undefined){

            bleDevice = new BluetoothDevice(peripheral.id,peripheral.name, [])
            bleDevice.addRssiReading(rssiReading)
            //throw "bleDevice undefined in savePeriphal when should never be undefined"
        }

        let reading = new DeviceReadingEntity(macaddress, rssiReading.timestamp, rssiReading.rssi, bleDevice.getRecentDistance(), rssiReading.tx_power)

        saveDeviceToDatabase(dev,db)
        saveDeviceReadingToDatabase(reading,db)
   
}


async function enableBluetooth(){
        try {
            console.debug("[enableBluetooth]");
            await BleManager.enableBluetooth();
        } catch (error) {
            console.error("[enableBluetooth] thrown", error);
        }

}
async function saveDeviceToDatabase(device:DeviceEntity,db?:SQLite.SQLiteDatabase){
    let closeDB=false
    if(db == undefined){
        closeDB=true
        db=getDatabase()    
    }
    if(!isMacaddressInDatabase(db,device.macaddress)){
        
        addDeviceToDatabase(db,device)
    }
    if(closeDB){
        db.closeSync()    
    }

}

async function saveDeviceReadingToDatabase(reading:DeviceReadingEntity, db?:SQLite.SQLiteDatabase){
    if(db == undefined){
        db=getDatabase()    
    }
        
    await addDeviceReadingToDatabase(db,reading)

}

const BluetoothDemoScreen: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
//const [peripherals, setPeripherals] = useState<Peripheral[]>(
//        []
 //   );
    const [bluetoothDevices, setBluetoothDevices] = useState( 
        new BluetoothDeviceContainer([]))
    const [showUnnamed,setShowUnnamed] = useState(true)
    useEffect(() => {
        handleAndroidPermissions();
        //requestPermissions();
        BleManager.start({ showAlert: false })
            .then(() => console.debug("BleManager started."))
            .catch((error: any) =>
                console.error("BeManager could not be started.", error)
            );

        const listeners: any[] = [
            //BleManager.onDiscoverPeripheral(handleDiscoverPeripheral),
            BleManager.onDiscoverPeripheral(handleDiscoverPeripheral),
            BleManager.onStopScan(handleStopScan),
        ];

        return () => {
            for (const listener of listeners) {
                listener.remove();
            }
        };
    }, []);
    const handleDiscoverPeripheral = (peripheral: Peripheral) => {
        //console.debug("[handleDiscoverPeripheral] new BLE peripheral=", peripheral);
        let rssiReading = RssiReading.peripheralToRssiReading(peripheral)
        let bleDevice = bluetoothDevices.getDevice(peripheral.id)
        let name = peripheral.name
        if(bleDevice == undefined){
            if(name == undefined){
                name=""
            }
            bleDevice = new BluetoothDevice(peripheral.id,name, [])
        }
        bleDevice.addRssiReading(rssiReading)


        if (!peripheral.name) {
            peripheral.name = "NO NAME";
        }
        let macaddress=peripheral.id
        let deviceName=peripheral.name
        let lastReading=Date.now()
        let ignore=false
        let deviceType=""
        let dev = new DeviceEntity(macaddress, deviceName, lastReading, ignore, deviceType)
        if(bleDevice == undefined){

            bleDevice = new BluetoothDevice(peripheral.id,peripheral.name, [])
            bleDevice.addRssiReading(rssiReading)
            //throw "bleDevice undefined in savePeriphal when should never be undefined"
        }

        let reading = new DeviceReadingEntity(macaddress, rssiReading.timestamp, rssiReading.rssi, bleDevice.getRecentDistance(), rssiReading.tx_power)

        //saveDeviceToDatabase(dev,db)
        //saveDeviceReadingToDatabase(reading,db)


        setBluetoothDevices((container) => {
            container.addDevice(bleDevice)
            return new BluetoothDeviceContainer(container.namedDevices,container.unNamedDevices)
        });
        //setPeripherals((arr) => {
        //    arr.push(peripheral)
            //return new Map(map)
        //    return arr
        //});

        //console.log(peripherals.length)
    };

    const handleStopScan = async () => {
        setIsScanning(false);
        console.debug("[handleStopScan] scan is stopped.");
        //save found devices 
        let peripherals = await BleManager.getDiscoveredPeripherals()
        for(let peripheral of peripherals){ 
            try{
                console.log(peripheral.id)
                savePeriphal(peripheral,bluetoothDevices,getDatabase()) 
            } catch (e){
                console.error(e)
            }
         }
        
        //if (db != undefined){
        //   db.closeSync()
        //    setDB(undefined)
        //}
        console.log("Peripherals done saving")
        alert("Scan finished")
    };
    const startScan = async () => {
        //setPeripherals([])
        setBluetoothDevices(new BluetoothDeviceContainer([]))
        const state = await BleManager.checkState();

        console.log(state);

        if (state === "off") {
            await enableBluetooth();
        }
        if (!isScanning) {
            //setPeripherals(new Map<Peripheral["id"], Peripheral>());
            try {
                console.debug("[startScan] starting scan...");
                setIsScanning(true);
                BleManager.scan({
                    seconds:SECONDS_TO_SCAN_FOR,
                    matchMode: BleScanMatchMode.Sticky,
                    scanMode: BleScanMode.LowLatency,
                    callbackType: BleScanCallbackType.AllMatches,
                    allowDuplicates:ALLOW_DUPLICATES,
                    serviceUUIDs:SERVICE_UUIDS,
                })
                    .then(() => {
                        console.debug("[startScan] scan promise returned successfully.");
                    })
                    .catch((err: any) => {
                        console.error("[startScan] ble scan returned in error", err);
                    });
            } catch (error) {
                console.error("[startScan] ble scan error thrown", error);
            }
        }
    };
    let titleText = "Start Scan"
    if(isScanning){
        titleText="Scanning..."
    }

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <Image
                    source={require('@/assets/images/partial-react-logo.png')}
                />
            }>

        <ThemedView style={styles.titleContainer}>
            <ThemedText type="title">Bluetooth Scanner</ThemedText>
        </ThemedView>
        <ThemedView style={styles.stepContainer}>
            <Button onPress={() => {triggerTaskTest()}} title="Trigger Background Tasks"/>
            <Button onPress={() => {setBluetoothDevices(new BluetoothDeviceContainer([]))}} title={"Clear Scanned Devices"}/>
            <Button onPress={ () => {setShowUnnamed(!showUnnamed)}} title={"Hide unnamed devices"}/>
            <Button onPress={startScan} title={titleText}/>
            <BluetoothDeviceList
                showUnnamed={showUnnamed}
                devices={bluetoothDevices}
            />

        </ThemedView>
        </ParallaxScrollView>
    );
};


const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
export default BluetoothDemoScreen;
