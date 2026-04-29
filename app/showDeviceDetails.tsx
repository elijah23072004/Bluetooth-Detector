import { useLocalSearchParams} from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { updateIgnoreDevice, getDeviceInfomation, getDatabase, getDeviceReadingsString, getDevice, updateDeviceName } from '@/utils/database';
import { useState } from 'react';
import {Button, TextInputChangeEvent} from 'react-native';
import { ThemedTextInput } from '@/components/themed-textInput';
import { StyleSheet } from 'react-native';
import { ScanForDevice } from '@/components/bluetooth/scanForDevice';

function convert_timestamp_to_string(timestamp:number){
    return new Date(timestamp).toUTCString()
}

function fetch_device(macaddress:string){
    let db = getDatabase()
    let device= getDevice(db,macaddress)
    if (device == undefined){
        throw "no device in database with macaddress:"+macaddress
    }
    if(device.deviceName == undefined || device.deviceName == ""){
        device.deviceName="No Name Found"
    }
    if(device.ignore == undefined){
        device.ignore=false
    }
    if(device.manufacturer == undefined){
        device.manufacturer = "Unknown manufacturer"
    }
    return device
}

export default function showDeviceDetails(){
    const { macaddress} = useLocalSearchParams();
    console.log("macAddress:",macaddress)
    const [device , setDevice] = useState(fetch_device(macaddress))
    const [deviceName, setDeviceName] = useState(device.deviceName)
    const [device_info,set_device_info] = useState(getDeviceInfomation(getDatabase(), macaddress))
    let ignore:boolean=false
    if(device.ignore){
        ignore=true
    }
    const [ ignoreDevice, setIgnoreDevice] =useState(ignore)
    console.log("ignore device:",device.ignore)
    let manufacturer = device.manufacturerKey
    let timesScanned = device.numberOfDeviceReadings
    let mostRecentScanTime = convert_timestamp_to_string(device_info.mostRecentReadingTime)
    let firstReadingTime = convert_timestamp_to_string(device_info.firstReadingTime)
    let mostRecentDistance = device_info.mostRecentReadingDistance.toString()
    let ignoreText
    if(ignoreDevice){
        ignoreText="Ignore device"
    }
    else{
        ignoreText="Stop ignoring device"
    }
    return (
    <ThemedView style={styles.stepContainer}>
        <ThemedView>
            <Button onPress= { () => {
                let db = getDatabase()
                updateDeviceName(db,macaddress,deviceName.trim())
                alert("Saved Device Name")
                setDeviceName(deviceName.trim())
            }} title="Set custom name for device"/>
            <Button onPress= { () => { 
                let db = getDatabase()
                updateIgnoreDevice(db, macaddress,!ignoreDevice)
                let endSection = "not ignored"
                if(!ignoreDevice){
                    endSection = "ignored"
                    
                }
                alert("Device is now "+ endSection)
                setIgnoreDevice(!ignoreDevice)
            }} title={ignoreText}/>
        </ThemedView>
        <ThemedTextInput value={deviceName} onChange= { (event:TextInputChangeEvent) => {
            setDeviceName(event.nativeEvent.text)
        }}/>
        <ThemedText> {manufacturer} </ThemedText>
        <ThemedText> {mostRecentDistance} m away at last scan</ThemedText>
        <ThemedText> Device Scanned {timesScanned} Times</ThemedText>
        <ThemedText> Last Scan at: {mostRecentScanTime} </ThemedText>
        <ThemedText> First Scan at: {firstReadingTime} </ThemedText>
        <ThemedText> macaddress of device: {macaddress} </ThemedText>
        <ScanForDevice macaddress={macaddress}/>
    </ThemedView>
    );
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
})
