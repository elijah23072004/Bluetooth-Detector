import { BluetoothDevice,BluetoothDeviceContainer,RssiReading } from "@/components/bluetooth/bluetoothDevice";
import { ThemedView } from "../themed-view";
import { StyleSheet } from "react-native";
import { ThemedText } from "../themed-text";
import { useState } from "react";
import {router} from 'expo-router'
import { Button } from "react-native";
import { split_devices_into_high_and_normal_risk, DeviceEntity, deviceEntiyToString, DeviceReadingEntity, getDatabase, getDeviceList, getDeviceReadingsString } from "@/utils/database";

import { Link} from "expo-router";
interface DeviceListProps{
    devices:DeviceEntity[];
}

function device_to_view(device:DeviceEntity, is_high_risk_device:boolean){
    let view = (<ThemedView key={device.macaddress}>
        <ThemedText>{deviceEntiyToString(device)}</ThemedText>
        <Button onPress={ () => router.push(
            {pathname:'/showDeviceDetails', 
            params:{macaddress:device.macaddress}}
        )}
        title="Show Device Details"/>

        <Link href={{
        pathname:'/showDeviceDetails',
        params: {macaddress:device.macaddress} 
        }} >Show Device Details</Link>
        </ThemedView>)
    return view

}
const MINIMUM_NUMBER_OF_DEVICE_READINGS = 2
function filter_device(device:DeviceEntity){
    if(device.numberOfDeviceReadings == undefined || device.numberOfDeviceReadings < MINIMUM_NUMBER_OF_DEVICE_READINGS){
        return true 
    }
    return false 
    
}

function filter_devices(devices:DeviceEntity[]){
    let out = []
    for(let device of devices){
        if(filter_device(device)){
            continue
        }
        out.push(device)
    }
    return out 
}

export function DeviceList(props:DeviceListProps){
    //stores id of selected device
    /* const [selected,setSelected] = useState("")
    const [selectedText, setSelectedText] = useState("")
    let getSelectedElem = async (macaddress:string) => {
    setSelectedText(await getDeviceReadingsString(macaddress))
    }*/
    let device_elements = []
    let devices = filter_devices(props.devices)
    let device_risks  = split_devices_into_high_and_normal_risk(devices)
    for(let device of device_risks.high_risk){
        device_elements.push(device_to_view(device,true))

    }
    for(let device of device_risks.low_risk){
        device_elements.push(device_to_view(device,false))

    }
    return (
        <ThemedView style={styles.stepContainer}>

            <ThemedText>{devices.length} Devices Scanned:</ThemedText>
            <ThemedText>{device_risks.high_risk.length} High Risk Devices, {device_risks.low_risk.length} Low Risk Devicesi</ThemedText>
            <ThemedView>
                {device_elements}
            </ThemedView>
        </ThemedView>
    )
}




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
