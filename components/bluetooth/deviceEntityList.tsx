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

export function DeviceList(props:DeviceListProps){
    //stores id of selected device
    /* const [selected,setSelected] = useState("")
    const [selectedText, setSelectedText] = useState("")
    let getSelectedElem = async (macaddress:string) => {
    setSelectedText(await getDeviceReadingsString(macaddress))
    }*/
    let device_elements = []
    let device_risks  = split_devices_into_high_and_normal_risk(props.devices)
    for(let device of device_risks.high_risk){
        device_elements.push(device_to_view(device,true))

    }
    for(let device of device_risks.low_risk){
        device_elements.push(device_to_view(device,false))

    }
    return (
        <ThemedView style={styles.stepContainer}>

            <ThemedText>{props.devices.length} Devices Scanned:</ThemedText>
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
