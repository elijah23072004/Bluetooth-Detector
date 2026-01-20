import {View, Text} from 'react-native';
import React from 'react';

import {Peripheral} from 'react-native-ble-manager';

type DeviceListProps = { peripheral:Peripheral}

export const DeviceList : React.FC<DeviceListProps> = ( {peripheral}  ) => {
    const {name,rssi,connected,advertising} = peripheral;
    const {isConnectable, serviceUUIDs, manufacturerData, serviceData, txPowerLevel,rawData} = advertising;
    //manufacturerData and serviceData are binary json stuff
    let isConn = "false"
    if (connected){
        isConn="true"
    }
    return (
        <View>
            <Text>{name}, RSSI:{rssi}, Connected:{isConn}</Text>
            <Text>Advertising data, isConnectable: {isConnectable}, serviceUUIDs: {serviceUUIDs}, txPowerLevel: {txPowerLevel}  </Text>
        </View>
    );

}
