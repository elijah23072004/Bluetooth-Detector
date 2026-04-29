import { ThemedView } from "../themed-view";
import { Pressable, StyleSheet } from "react-native";
import { ThemedText } from "../themed-text";
import {router} from 'expo-router'
import { split_devices_into_high_and_normal_risk, DeviceEntity, deviceEntiyToString, DeviceReadingEntity, getDatabase, getDeviceList, getDeviceReadingsString, get_most_recent_distance } from "@/utils/database";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import {Button} from 'react-native';
import { useColorScheme } from "react-native";
import { BluetoothDevice, RssiReading } from "./bluetoothDevice";

import BleManager, {
    Peripheral,
    BleScanMatchMode,
    BleScanCallbackType,
    BleScanMode,
} from "react-native-ble-manager";
import { handleAndroidPermissions } from "@/utils/permission";
    
export interface ScanForDeviceProps{
    macaddress:string
}

async function stopBLEScan(){
    await BleManager.stopScan()
}
async function startBLEScan(){
    try{
        await BleManager.stopScan()
    }catch (e){
        console.error(e)
    }
    await BleManager.scan({
        scanMode: BleScanMode.LowLatency,
        callbackType: BleScanCallbackType.AllMatches,
        allowDuplicates:true,
    })
}

export const ScanForDevice: React.FC<ScanForDeviceProps> = (props:ScanForDeviceProps) => {
    const [scanning, setScanning] = useState(false)
    let macaddress = props.macaddress
    const [ scannedDevice, setScannedDevice] = useState(new BluetoothDevice(macaddress,"",[]))
    useEffect( () => {
        handleAndroidPermissions()
        const listeners : any[] = [
            BleManager.onDiscoverPeripheral(handleDiscoverPeripheral)
        ];
        return () => {
            for(const listener of listeners){
                listener.remove();
            }
        }
    })

    let handleDiscoverPeripheral= (periperal: Peripheral) => {
        if(periperal.id == macaddress){
            console.log(periperal.id)
            let rssiReading = RssiReading.peripheralToRssiReading(periperal)
            let bleDevice = new BluetoothDevice(macaddress, "", scannedDevice.rssiHistory)
            bleDevice.addRssiReading(rssiReading)
            setScannedDevice(bleDevice)
        }
    }

    let stopScan = ()  => {
        setScanning(false)
        stopBLEScan()
    }
    let startScan = () => {
        setScanning(true)
        setScannedDevice(new BluetoothDevice(macaddress,"",[]))
        startBLEScan()
    }
    if (!scanning){
        return (
            <ThemedView style={styles.stepContainer}>
                <Button onPress= { () =>startScan()} title={"Start Scaning for Device"}/>
            </ThemedView>
        )
    }
    if(scannedDevice.rssiHistory.length == 0){
        return(
            <ThemedView style={styles.stepContainer}>
                <ThemedText>Scanning...</ThemedText>
                <ThemedText> Device Not Found Yet</ThemedText>
                <Button onPress={ () => stopScan()} title={"Stop Scan"}/>
            </ThemedView>
        )
    }
    return (
        <ThemedView style={styles.stepContainer}>
            <ThemedText> Scanning...</ThemedText>
            <ThemedText> Device Found</ThemedText>
            <ThemedText> Device Distance { scannedDevice.getRecentDistance()}</ThemedText>
            <ThemedText> Device Rssi { scannedDevice.getRecentRssi()}</ThemedText>
            <ThemedText> Number of Packets Recieved: { scannedDevice.rssiHistory.length}</ThemedText>
            <Button onPress={ () => stopScan() } title={"Stop Scan"}/>
        </ThemedView>
    )
}




const styles = StyleSheet.create({
fixToText:{
flexDirection: 'row',
justifyContent: 'space-between',
},
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
