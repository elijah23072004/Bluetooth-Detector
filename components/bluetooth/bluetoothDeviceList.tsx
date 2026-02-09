import { BluetoothDevice,BluetoothDeviceContainer,RssiReading } from "@/components/bluetooth/bluetoothDevice";
import { ThemedView } from "../themed-view";
import { StyleSheet } from "react-native";
import { ThemedText } from "../themed-text";
import { useState } from "react";
import { Button } from "react-native";
function showBluetoothDevice(device:BluetoothDevice){

   //return <ThemedView key={device.id}
   //     <ThemedText dwkey={device.id}>{device.toString()}</ThemedText> 
    //</ThemedView>
}

interface BluetoothDeviceListProps{
    devices:BluetoothDeviceContainer;
    showUnnamed:boolean;
}

export function BluetoothDeviceList(props:BluetoothDeviceListProps){
    //stores id of selected device
    const [selected,setSelected] = useState("")

    let devices = props.devices
    //let namedDevicesElements = devices.getRssiSortedNamedDevices().map((val) => showBluetoothDevice(val))
    let namedDevicesElements = []
    for(let device of devices.getRssiSortedNamedDevices()){
        let selectedElem = undefined
        let selectedId = device.id
        if(device.id == selected){
            selectedElem= <ThemedText>{device.getRssiHistoryString()}</ThemedText>
            selectedId = ""
        }
        let view = (<ThemedView key={device.id}>
                <ThemedText>{device.toString()}</ThemedText>
                <Button onPress={() => {setSelected(selectedId)}} title={"Select device"}/>
                {selectedElem}
            </ThemedView>)
        namedDevicesElements.push(view)
    }
    let unnamedDevicesView = undefined
    if(props.showUnnamed){
        let unnamedDevicesElements=[]
        for(let device of devices.getRssiSortedUnNamedDevices()){
            let selectedElem=undefined
            let selectedId = device.id
            if(device.id == selected){
                selectedElem=<ThemedText>{device.getRssiHistoryString()}</ThemedText>
                selectedId=""
            }
            let view = (<ThemedView key={device.id}>
                <ThemedText>{device.toString()}</ThemedText>
                <Button onPress={() => {setSelected(selectedId)}} title={"Select device"}/>
                {selectedElem}
            </ThemedView>)
            unnamedDevicesElements.push(view)
            
        }
        unnamedDevicesView = 
            <ThemedView>
                <ThemedText>Unnamed Devices:</ThemedText>
                {unnamedDevicesElements}
            </ThemedView>
    }
    return (
        <ThemedView style={styles.stepContainer}>
            <ThemedText>Named Devices</ThemedText>
            <ThemedView>
                {namedDevicesElements}
            </ThemedView>
            {unnamedDevicesView}
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
