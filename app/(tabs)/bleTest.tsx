import { handleAndroidPermissions } from "@/utils/permission";
import { DeviceList } from "@/components/bluetooth/deviceList";
import {Button} from "react-native"

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform, Alert, Linking} from "react-native";
import BleManager, {
    Peripheral,
    BleScanMatchMode,
    BleScanCallbackType,
    BleScanMode,
} from "react-native-ble-manager";
import { FlatList } from "react-native";



/*const requestPermissions = async () => {
    if (Platform.OS === 'android') {
        // Android 12+ (API 31) requires these
        if (Platform.Version >= 31) {
            const granted = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ]);
            return (
                granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
                    granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
            );
        } 
        // Older Android versions mainly need Location for scanning
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    // iOS permissions are handled by the library/Info.plist
    return true; 
};*/

const SECONDS_TO_SCAN_FOR = 5;
const SERVICE_UUIDS: string[] = [];
const ALLOW_DUPLICATES = true;


const BluetoothDemoScreen: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [peripherals, setPeripherals] = useState(
        new Map<Peripheral["id"], Peripheral>()
    );

    useEffect(() => {
        BleManager.start({ showAlert: false })
            .then(() => console.debug("BleManager started."))
            .catch((error: any) =>
                console.error("BeManager could not be started.", error)
            );

        const listeners: any[] = [
            //BleManager.onDiscoverPeripheral(handleDiscoverPeripheral),
            BleManager.onDiscoverPeripheral(handleDiscoverPeripheral),
            BleManager.onStopScan(handleStopScan),
        ];
        //requestPermissions();
        handleAndroidPermissions();

        return () => {
            for (const listener of listeners) {
                listener.remove();
            }
        };
    }, []);
    const handleDiscoverPeripheral = (peripheral: Peripheral) => {
        console.debug("[handleDiscoverPeripheral] new BLE peripheral=", peripheral);
        if (!peripheral.name) {
            peripheral.name = "NO NAME";
        }
        setPeripherals((map) => {
            return new Map(map.set(peripheral.id, peripheral));
        });
    };

    const handleStopScan = () => {
        setIsScanning(false);
        console.debug("[handleStopScan] scan is stopped.");
    };
    const enableBluetooth = async () => {
        try {
            console.debug("[enableBluetooth]");
            await BleManager.enableBluetooth();
        } catch (error) {
            console.error("[enableBluetooth] thrown", error);
        }
    };

    const startScan = async () => {
        const state = await BleManager.checkState();

        console.log(state);

        if (state === "off") {
            if (Platform.OS == "ios") {
                Alert.alert(
                    "Enable Bluetooth",
                    "Please enable Bluetooth in Settings to continue.",
                    [
                        { text: "Cancel", style: "cancel" },
                        {
                            text: "Open Settings",
                            onPress: () => {
                                Linking.openURL("App-Prefs:Bluetooth");
                            },
                        },
                    ]
                );
            } else {
                enableBluetooth();
            }
        }
        if (!isScanning) {
            setPeripherals(new Map<Peripheral["id"], Peripheral>());
            try {
                console.debug("[startScan] starting scan...");
                setIsScanning(true);
                BleManager.scan({
                    seconds:SECONDS_TO_SCAN_FOR,
                    matchMode: BleScanMatchMode.Sticky,
                    scanMode: BleScanMode.LowLatency,
                    callbackType: BleScanCallbackType.AllMatches,
                    allowDuplicates:ALLOW_DUPLICATES,
                    serviceUUIDs:SERVICE_UUIDS,
                })
                    .then(() => {
                        console.debug("[startScan] scan promise returned successfully.");
                    })
                    .catch((err: any) => {
                        console.error("[startScan] ble scan returned in error", err);
                    });
            } catch (error) {
                console.error("[startScan] ble scan error thrown", error);
            }
        }
    };
    let titleText = "Start Scan"
    if(isScanning){
        titleText="Scanning..."
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Bluetooth Demo</Text>
            <Button onPress={startScan} title={titleText}/>
            <FlatList 
                data={Array.from(peripherals)}
                renderItem={({item}) => <DeviceList peripheral={item[1]}/>}

            />

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
        paddingVertical: "10%",
        paddingHorizontal: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 16,
        color: "#333",
    },
});

export default BluetoothDemoScreen;
