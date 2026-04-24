import { BluetoothDevice,BluetoothDeviceContainer,RssiReading } from "@/components/bluetooth/bluetoothDevice";
import { ThemedView } from "../themed-view";
import { StyleSheet } from "react-native";
import { ThemedText } from "../themed-text";
import { useState } from "react";
import { Button } from "react-native";
import { DeviceEntity, deviceEntiyToString, DeviceReadingEntity, getDatabase, getDeviceList, getDeviceReadingsString } from "@/utils/database";
import { Link} from "expo-router";
interface DeviceListProps{
    devices:DeviceEntity[];
}

export function DeviceList(props:DeviceListProps){
    //stores id of selected device
    const [selected,setSelected] = useState("")
    const [selectedText, setSelectedText] = useState("")
    let getSelectedElem = async (macaddress:string) => {
        setSelectedText(await getDeviceReadingsString(macaddress))
    }
    //let namedDevicesElements = devices.getRssiSortedNamedDevices().map((val) => showBluetoothDevice(val))
    let namedDevicesElements = []
    for(let device of props.devices){
        let selectedElem = undefined
        let selectedId = device.macaddress
        if(device.macaddress == selected){
            if(selectedText == ""){
                getSelectedElem(device.macaddress)
            }
            else{
                selectedElem= <ThemedText>{selectedText}</ThemedText>
            }
            selectedId = ""
        }
        let view = (<ThemedView key={device.macaddress}>
                <ThemedText>{deviceEntiyToString(device)}</ThemedText>
                <Button onPress={() => {
                setSelected(selectedId)
                setSelectedText("")    
            }} title={"Select device"}/>
                <Link href={{
                    pathname:'/showDeviceDetails',
                    params: {macaddress:device.macaddress} 
                    }} >Show Device Details</Link>
                {selectedElem}
            </ThemedView>)
        namedDevicesElements.push(view)
    }
    return (
        <ThemedView style={styles.stepContainer}>
            <ThemedText>Devices</ThemedText>
            <ThemedView>
                {namedDevicesElements}
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
