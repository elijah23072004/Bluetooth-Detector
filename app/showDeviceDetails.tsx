import { useLocalSearchParams} from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getDeviceInfomation, getDatabase, getDeviceReadingsString } from '@/utils/database';
import { useState } from 'react';
export default function showDeviceDetails(){
    const { macaddress} = useLocalSearchParams();
    const [text, setText] = useState("")
    if (text == ""){
        getDatabase().then( db => {
            getDeviceInfomation(db,macaddress).then( async info => {
            let readingsString = await getDeviceReadingsString(macaddress,db)
            let out = "Device:"+info.device?.deviceName   
            out+="\n" 
            out+="macaddress:"+macaddress + "\n"
            out+="Most recent reading time:" + (new Date(info.mostRecentReadingTime)).toUTCString()+"\n"
            out+="Most recent deistance:"+ info.mostRecentReadingDistance.toString()+"\n"
            out+="First Reading Time:" + (new Date(info.firstReadingTime)).toUTCString() + "\n"
            out+="Number of totatl Readings:" + info.numberOfDeviceReadings.toString()+"\n"
            out+="All readings:\n"+readingsString
            setText(out)
            db.closeSync()
            })
        })
    }
    console.log(macaddress)
    return (
    <ThemedView>
        <ThemedText>{text} </ThemedText>
    </ThemedView>
    );
}
