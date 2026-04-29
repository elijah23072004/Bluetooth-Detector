import { Alert, StyleSheet, TextInputChangeEvent} from 'react-native';
import * as React from 'react';
import {File, Paths, Directory} from 'expo-file-system';

import {readConfigFromFile, ConfigData, saveConfigData} from '@/components/utils'

import { useState } from 'react';


import { ThemedTextInput} from '@/components/themed-textInput'
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { ThemedButton } from './themed-button';
import { Button} from 'react-native';
import { getDatabase, clearDatabase } from '@/utils/database';
import { IsBackgroundProcessingEnabled } from './bluetooth/enableBackgroundScanning';
import { runBluetoothScan } from '@/utils/runBluetoothScanner';
import { View } from 'react-native';


export function SettingsComponent(){ 

    let [configData, setConfigData] = useState<ConfigData>(readConfigFromFile())
    let config = configData
    let styles = StyleSheet.create({
        container:{
            margin:10,
            flex:1,
            justifyContent: 'center',
        }
    })
    let showConfirmDialiog = () => {
        return Alert.alert ( 
            "Are you sure?",
            "Are you sure you want to delete all records from the database?",
        [ 
            {
                text:"No",
            },
            {
                text:"Yes",
                onPress: async () => {
                    await clearDatabase(getDatabase())
                },
            },
        ],
    )};
    return (
        <ThemedView style={styles.container}>
            <View>
            <IsBackgroundProcessingEnabled/>
            </View>
            <View>
            <Button onPress={ async () => alert((await runBluetoothScan()).toString() + " Scanned Devices")} title={"Run scan now"}/>
            </View>
            <ThemedText type="subtitle"> How often in minutes to scan for bluetooth devices: </ThemedText>
            <ThemedTextInput onChange={(event:TextInputChangeEvent) => {
                let text = event.nativeEvent.text
                let num = Number(text)
                setConfigData((prev) => ({...prev, scan_frequency:num}))
            }} placeholder="How often in minutes to scan for bluetooth devices" value={config.scan_frequency.toString()}/>
            <ThemedText type="subtitle"> How long to scan for devices in seconds: </ThemedText>
            <ThemedTextInput value = {config.scan_duration.toString()} onChange={(event:TextInputChangeEvent) => {
                let text = event.nativeEvent.text
                let num = Number(text)
                setConfigData((prev) => ({...prev, scan_frequency:num}))
            }} placeholder="Scan time for devices in seconds:"/>
            <ThemedText type="subtitle"> Max Scanned Distance to be included in scan: </ThemedText>
            <ThemedTextInput onChange={(event:TextInputChangeEvent) => {
                let text = event.nativeEvent.text
                let num = Number(text)
                setConfigData((prev) => ({...prev, maximum_scan_distance:num}))
            }} placeholder="Max scanned distance to be included in scan:" value={config.scan_frequency.toString()}/>
            <ThemedText type="subtitle"> Minimum number of times a device is scanned to be flagged as a suspicious device: </ThemedText>
            <ThemedTextInput value = {config.scan_duration.toString()} onChange={(event:TextInputChangeEvent) => {
                let text = event.nativeEvent.text
                let num = Number(text)
                setConfigData((prev) => ({...prev, threshold_for_suspicius_device:num}))
            }} placeholder="Minimum number of times a device is scanned to be flagged as a suspicious device:"/>
            <ThemedButton onPress={() =>saveConfigData(configData)} color='#841584' title='Save Settings'/>
            <Button onPress= { async () => {
                showConfirmDialiog()
            }} title={"Clear db"}/>
        </ThemedView>
    )
}

