import { ThemedView } from "../themed-view";
import { Pressable, StyleSheet } from "react-native";
import { ThemedText } from "../themed-text";
import {router} from 'expo-router'
import { sort_devices, split_devices_into_high_and_normal_risk, DeviceEntity, deviceEntiyToString, DeviceReadingEntity, getDatabase, getDeviceList, getDeviceReadingsString, get_most_recent_distance } from "@/utils/database";
import DropDownPicker from 'react-native-dropdown-picker'
import { Picker } from "@react-native-picker/picker";
import { useState } from "react";
import {Button} from 'react-native';
import { useColorScheme } from "react-native";
import { foregroundStyle, font } from "@expo/ui/swift-ui/modifiers";
import { Host,Text} from '@expo/ui/swift-ui';
import { useScrollToTop } from "@react-navigation/native";
import { setShouldAnimateExitingForTag } from "react-native-reanimated/lib/typescript/core";

interface DeviceListProps{
    devices:DeviceEntity[];
}
function get_device_view_styles(colorScheme:string){
    let backgroundColor
    let border_color
    const colors = {light: '#A1CEDC', dark: '#1D3D47' }
    if (colorScheme == "light"){
        backgroundColor = colors.light
        border_color = colors.dark
    }
    else{
        backgroundColor = colors.dark
        border_color = colors.light
    }

    const device_stylesheet = StyleSheet.create({
        container: {
        flex: 1,
        backgroundColor:backgroundColor,
        borderColor: border_color,
        borderWidth: 5,
        padding:10,
        margin:5,
        alignItems: 'center',
        justifyContent: 'center',
        textAlign:'center',
    },
    })
    return device_stylesheet
}
function device_to_view(device:DeviceEntity, is_high_risk_device:boolean,colorScheme:string){
    let device_stylesheet = get_device_view_styles(colorScheme)
    let name = device.deviceName
    if(name == undefined || name==""){
        name="Unknown Name"
    }
    let distance = device.distance
    if(distance != undefined){
        distance = Math.round(distance*100)/100
    }
    else{
        distance=50
    }

    if(device.distance == undefined){
        distance = get_most_recent_distance(getDatabase(),device.macaddress)
    }
    let manufacturerComp
    if(device.manufacturerKey){
        manufacturerComp=(<ThemedText style={{textAlign:"center"}}>{device.manufacturerKey}</ThemedText>)
        
    }
    
    let view = (
        <ThemedView key={device.macaddress} style={device_stylesheet.container}>
        <Pressable onPress={() => router.push({ pathname:'/showDeviceDetails', params:{macaddress:device.macaddress}} ) }>
        <ThemedText style={{textAlign:"center",fontSize:20, fontWeight:'bold'}}>{name}</ThemedText>
        {manufacturerComp}
        <ThemedText style={{textAlign:"center"}}>{distance?.toString()} m</ThemedText>
        <ThemedText style={{textAlign:"center"}}>{device.numberOfDeviceReadings} Times Scanned</ThemedText>
        <ThemedText style={{textAlign:"center", fontSize:14,fontWeight:"200"}}>{device.macaddress}</ThemedText>
        <ThemedText style={{textAlign:"center", fontSize:14, fontWeight:"100"}}>Last Scanned {(new Date(device.lastReading).toUTCString())}</ThemedText>
        </Pressable>
        </ThemedView>)
    return view

}
const MINIMUM_NUMBER_OF_DEVICE_READINGS =2
function filter_device(device:DeviceEntity,showHidden:boolean){
    if(!showHidden){
        if(!device.ignore){
            return true
        }
    }
    else{
        if(device.ignore){
            return true
        }
    }
    if( device.numberOfDeviceReadings == undefined || device.numberOfDeviceReadings < MINIMUM_NUMBER_OF_DEVICE_READINGS) {
        return true 
    }
    return false 
    
}

function filter_devices(devices:DeviceEntity[],showHidden:boolean){
    let out = []
    for(let device of devices){
        if(filter_device(device, showHidden)){
            continue
        }
        out.push(device)
    }
    return out 
}

export function DeviceList(props:DeviceListProps){
    const [showHidden, setShowHidden] = useState(false)
    const [open, setOpen] = useState(false)
    const [ sortBy , setSortBy] = useState("Time")
    const colorScheme = useColorScheme() ?? 'light';
    //stores id of selected device
    /* const [selected,setSelected] = useState("")
    const [selectedText, setSelectedText] = useState("")
    let getSelectedElem = async (macaddress:string) => {
    setSelectedText(await getDeviceReadingsString(macaddress))
    }*/
    let device_elements = []
    let devices = sort_devices(props.devices,sortBy)
    devices = filter_devices(devices,showHidden)
    let device_risks  = split_devices_into_high_and_normal_risk(devices)
    if(device_risks.high_risk.length!=0){
        device_elements.push( ( <ThemedView key="high risk heading"><ThemedText>{device_risks.high_risk.length} High Risk Devices</ThemedText></ThemedView>))
    }
    else{
         device_elements.push( ( <ThemedView key="high risk heading"><ThemedText>No High Risk Devices Found</ThemedText></ThemedView>))
    }
    for(let device of device_risks.high_risk){
        device_elements.push(device_to_view(device,true,colorScheme))

    }
    if(device_risks.low_risk.length !=0){
        device_elements.push( ( <ThemedView key="low risk heading"><ThemedText>{device_risks.low_risk.length} Low Risk Devices</ThemedText></ThemedView>))
    }
    
    for(let device of device_risks.low_risk){
        device_elements.push(device_to_view(device,false,colorScheme))

    }
    let hiddenButtonText = "Show Hidden\n Devies"
    if(showHidden){
        hiddenButtonText="Hide Hidden\n Devices"
    }
    let data = [ { value: "Time" , label:'Time of Scan'}, 
        { value: "Frequency", label:"Number of Times Scanned"}, 
        { value:"Distance", label: "Distance of Last Scan"}]

    return (
        <ThemedView style={styles.stepContainer}>
            <ThemedView style={styles.fixToText}>
                <ThemedView>
                <DropDownPicker
                    value= {sortBy}
                    items = { data}
                    setValue={setSortBy}
                    setOpen={setOpen}
                    open={open}
                    placeholder="Select order to sort"
                    listMode="SCROLLVIEW"
                    style={{borderColor:'#ccc', width:"65%"}}/>
                </ThemedView>
                <Button onPress={ () => {setShowHidden(!showHidden)}} title={hiddenButtonText}/>
            </ThemedView>

            <ThemedView>
                {device_elements}
            </ThemedView>
        </ThemedView>
    )
}




const styles = StyleSheet.create({
fixToText:{
flexDirection: 'row',
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
