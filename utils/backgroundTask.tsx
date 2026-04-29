import * as BackgroundTask from 'expo-background-task'
import * as TaskManager from 'expo-task-manager'
import { runBluetoothScan } from './runBluetoothScanner';
import { sendNotification } from './notifications';
import { Background } from '@react-navigation/elements';
import { readConfigFromFile } from '@/components/utils';
const BACKGROUND_TASK_IDENTIFIER = 'background_bluetooth_scan'

export function initializeBackgroundTask( innerAppMountedPromise : Promise<void>){

    TaskManager.defineTask(BACKGROUND_TASK_IDENTIFIER, async () => {
        console.log(new Date(Date.now()).toISOString())
        let body
        try{
            const now = Date.now();
            console.log(`Got background task call at date: ${ new Date(now).toISOString()}`);
            await innerAppMountedPromise
            console.log("App loaded, scan now starting")
            let noScanned = await runBluetoothScan()
            body=noScanned.toString() + " scanned devices. Finished at " + (new Date(now).toISOString())
        }catch (error) {
            console.error("Failed to execute background task:", error);
            //sendNotification("Scan failed:",error.toString())
            return BackgroundTask.BackgroundTaskResult.Failed
        }
        console.log("Background task returned successfully")
        //sendNotification("Scan Complete",body)
        return BackgroundTask.BackgroundTaskResult.Success
    });
}




async function checkBackgroundTaskStatus(){

    let res = await BackgroundTask.getStatusAsync()
    if( res==BackgroundTask.BackgroundTaskStatus.Available){
        console.log("Background task is Available")
    }
    else if (res == BackgroundTask.BackgroundTaskStatus.Restricted){
        console.log("Background task is Restricted")
    }
}

export async function registerBackgroundTaskAsync(){
    
    console.log("task enabled")
    return BackgroundTask.registerTaskAsync(BACKGROUND_TASK_IDENTIFIER,{minimumInterval:readConfigFromFile().scan_frequency});
}

export async function unregisterBackgroundTaskAsync(){
    console.log("task disabled")
    return BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK_IDENTIFIER);
}

export async function isTaskRegistered(){
    checkBackgroundTaskStatus()
    return TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_IDENTIFIER); 
}


export async function taskNotEnabledNotifcation(){
    if (!(await isTaskRegistered())){
        sendNotification("Background scanning is not enabled for bluetooth scanner", "please enable background processing in home page of application for bluetooth devices to be scanned")
        console.log("Notification sent")
    }
}

export async function triggerTaskTest(){
    console.log("Triggering testing tasks")
    console.log("Res:",await BackgroundTask.triggerTaskWorkerForTestingAsync())

}
