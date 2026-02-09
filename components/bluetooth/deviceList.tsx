import {View, Text} from 'react-native';
import React from 'react';

import {CustomAdvertisingData, Peripheral} from 'react-native-ble-manager';

type DeviceListProps = { peripheral:Peripheral}
var MINPOWERLEVEL=-100
var MAXPOWERLEVEL=100
var DEFAULTPOWER=8

function calculateRssiDistanceSimple(rssi:number,txPowerLevel:number,n:number=3){
    //n ranges from 2 to 4
    //return Math.pow(10, (txPowerLevel - rssi)/(10*n))
    txPowerLevel=-70
    return Math.pow(10,(txPowerLevel-rssi)/(10*n))
}

function getRssiDistance(rssi?:number, txPowerLevel?:number){
    if (txPowerLevel == undefined || txPowerLevel < MINPOWERLEVEL || txPowerLevel > MAXPOWERLEVEL){
        txPowerLevel=DEFAULTPOWER
    }
    if(rssi ==undefined){
        return undefined
    }
    return calculateRssiDistanceSimple(rssi,txPowerLevel)
    


}
//takes number in range 0-255
function unsignedToSignedByte(num:number){
    if(num>=128){
        return num-256
    }
    return num
    
}

function getTxData(rawData?:CustomAdvertisingData){
    console.log(JSON.stringify(rawData))

    let txPowerCode = 10 //0x0A
    if(rawData==undefined){
        return null
    }
    for(let i=0; i<rawData.bytes.length;i+=2){
        if(rawData.bytes[i]==txPowerCode){
            return unsignedToSignedByte(rawData.bytes[i+1])
            //return rawData.bytes[i+1]
        }
    }
    return null

}


function filterDevice(peripheral:Peripheral){
    if(peripheral.name == "NO NAME"){return true}
    return false

}

export const DeviceList : React.FC<DeviceListProps> = ( {peripheral}  ) => {
    const {name,rssi,connected,advertising} = peripheral;
    const {isConnectable, serviceUUIDs, manufacturerData, serviceData, txPowerLevel,rawData} = advertising;
    //let txPower = peripheral.advertising.txPowerLevel
    let txPower = getTxData(rawData)
    if(txPowerLevel != txPower){
        console.log("TX Power Diff")
        if(txPower == null){
            console.log("TxPower is null")
        
        }
        if (txPowerLevel == undefined){
            console.log("txPowerLevel is undefined")
        }
        if(txPowerLevel !=undefined && txPower != null) {
             console.log("Orig:"+txPowerLevel.toString()+" Other:"+txPower.toString)
        }
    }
    
    if (filterDevice(peripheral)){
        return;
    }

    let estimatedDistance = getRssiDistance(rssi,txPowerLevel)
    //manufacturerData and serviceData are binary json stuff
    let isConn = "false"
    if (connected){
        isConn="true"
    }
    return (
        <View>
            <Text>{name}, RSSI:{rssi}, Connected:{isConn}</Text>
            <Text>Advertising data, isConnectable: {isConnectable}, serviceUUIDs: {serviceUUIDs}, txPowerLevel: {txPowerLevel}, estimated distance: {estimatedDistance}m </Text>
        </View>
    );

}
