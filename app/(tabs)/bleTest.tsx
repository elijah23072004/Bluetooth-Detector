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

const SECONDS_TO_SCAN_FOR = 10;
const SERVICE_UUIDS: string[] = [];
const ALLOW_DUPLICATES = true;


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
        db=await getDatabase()    
    }
    if(!isMacaddressInDatabase(db,device.macaddress)){
        
        await addDeviceToDatabase(db,device)
    }
    if(closeDB){
        db.closeSync()    
    }

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

const BluetoothDemoScreen: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [peripherals, setPeripherals] = useState(
        new Map<Peripheral["id"], Peripheral>()
    );
    const [bluetoothDevices, setBluetoothDevices] = useState( 
        new BluetoothDeviceContainer([]))
    const [showUnnamed,setShowUnnamed] = useState(true)
    const [db, setDB] = useState<SQLite.SQLiteDatabase>()
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
        setBluetoothDevices((container) => {
            container.addDevice(bleDevice)
            return new BluetoothDeviceContainer(container.namedDevices,container.unNamedDevices)
        });
        if (!peripheral.name) {
            peripheral.name = "NO NAME";
        }
        let macaddress=peripheral.id
        let deviceName=peripheral.name
        let lastReading=Date.now()
        let ignore=false
        let deviceType=""
        let dev = new DeviceEntity(macaddress, deviceName, lastReading, ignore, deviceType)
        let reading = new DeviceReadingEntity(macaddress, rssiReading.timestamp, rssiReading.rssi, bleDevice.getRecentDistance(), rssiReading.tx_power)
        saveDeviceToDatabase(dev,db)
        saveDeviceReadingToDatabase(reading,db)
        setPeripherals((map) => {
            return new Map(map.set(peripheral.id, peripheral));
        });
    };

    const handleStopScan = () => {
        setIsScanning(false);
        console.debug("[handleStopScan] scan is stopped.");
        if (db != undefined){
            db.closeSync()
            setDB(undefined)
        }
    };
    const startScan = async () => {
        if (db == undefined){
            setDB(await getDatabase())    
        }
        const state = await BleManager.checkState();

        console.log(state);

        if (state === "off") {
            await enableBluetooth();
        }
        if (!isScanning) {
            setPeripherals(new Map<Peripheral["id"], Peripheral>());
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
