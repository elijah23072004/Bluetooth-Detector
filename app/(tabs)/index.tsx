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
import { Database_simplex } from '@/utils/database';
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
    if(resolver){
    useEffect( () => {
        Database_simplex.load_database()
        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            console.log("addNotificationResponseReceivedListener")
            console.log(response);
            if(response.notification.request.content.data?.url){
                const url = response.notification.request.content.data.url;
                router.replace(url);
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
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>

        <Button onPress={() => {triggerTaskTest()}} title="Trigger Background Tasks"/>

        {IsBackgroundProcessingEnabled()}
        <Button onPress={ async () => alert((await runBluetoothScan()).toString() + " Scanned Devices")} title={"Run scan"}/>
        <Button onPress= { async () => {
                let db = getDatabase()
                await clearDatabase(db);
        }} title={"Clear db"}/>
        <Button onPress= { () => {
                deleteDatabase()
        }} title={"Delete db"}/>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert('Share pressed')}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert('Delete pressed')}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
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
