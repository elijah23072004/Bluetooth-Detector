import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link, router, useRouter } from 'expo-router';
import {Button} from 'react-native'
import { initializeBackgroundTask, triggerTaskTest } from '@/utils/backgroundTask';
import { IsBackgroundProcessingEnabled } from '@/components/bluetooth/enableBackgroundScanning';
import { useEffect } from 'react';
import { Database_simplex, exportDatabase, importDatabase } from '@/utils/database';
import { runBluetoothScan, startBleManager } from '@/utils/runBluetoothScanner';
import * as Notifications from 'expo-notifications'
import { Linking } from 'react-native';
import { getDatabase, deleteDatabase, clearDatabase } from '@/utils/database';
//declare a var to store the resolver function
let resolver: ( () => void) | null;
const promise = new Promise<void>((resolve) => {
    resolver = resolve;
});
initializeBackgroundTask(promise)


export default function HomeScreen() {
    Database_simplex.reload_database()
    if(resolver){
    useEffect( () => {
        Database_simplex.load_database()
        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            console.log("addNotificationResponseReceivedListener")
            console.log(response);
            if(response.notification.request.content.data?.url){
                const url = response.notification.request.content.data.url;
                router.push(url);
            }
        });
        //const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        //    console.log("addNotificationReceivedListener")
        //    console.log(notification);
        //});
        startBleManager()
        
        resolver();
        
        console.log("Resolver called")
        return () => {
            responseListener.remove()
            //notificationListener.remove()
        }
        }, []);
    }
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Bluetooth Scanner</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText> An app which automatically scans for nearby bluetooth devices.</ThemedText>
        <ThemedText> Which will warn a user if specific devices are repeatedly found. </ThemedText>
        <ThemedText>With the intention of finding unauthorised item finder devices such as airtags, used to facilitate harasment or coercive control</ThemedText>
        <ThemedText> The app will scan devices automatically and these devices can be viewed in teh scanned device tab on the bottom of the screen</ThemedText>
        <ThemedText> The devices in this screen can be pressed to go to a more detailed page which can allow for scanning just for that device to help try to find the device</ThemedText>

        <Button onPress= { () => router.push("./Scanned Devices")} title={"View Devices in database"}/>
        <Button onPress= { () => router.push("./Settings")} title={"Settings"}/>
        <Button onPress={ async () => alert((await runBluetoothScan()).toString() + " Scanned Devices")} title={"Run bluetooth scan now"}/>


    </ThemedView>
    </ParallaxScrollView>
  );
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
