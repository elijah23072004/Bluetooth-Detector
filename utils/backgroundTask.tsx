import * as BackgroundTask from 'expo-background-task'
import * as TaskManager from 'expo-task-manager'
import { runBluetoothScan } from './runBluetoothScanner';
import { sendNotification } from './notifications';
const BACKGROUND_TASK_IDENTIFIER = 'background-bluetooth-scan'
const TASK_FREQUENCY = 15 //minutes


TaskManager.defineTask(BACKGROUND_TASK_IDENTIFIER, async () => {
    const now = Date.now();
    sendNotification("Scan started")
    try{
        console.log(`Got background task call at date: ${ new Date(now).toISOString()}`);
        runBluetoothScan()
    }catch (error) {
        console.error("Failed to execute background task:", error);
        sendNotification("Scan failed:",error.toString())
        return BackgroundTask.BackgroundTaskResult.Failed
    }
    console.log("Background task returned successfully")
    sendNotification("Scan Complete")
    return BackgroundTask.BackgroundTaskResult.Success


});



export async function registerBackgroundTaskAsync(){
    console.log("task enabled")
    return BackgroundTask.registerTaskAsync(BACKGROUND_TASK_IDENTIFIER, {minimumInterval:TASK_FREQUENCY});
}

export async function unregisterBackgroundTaskAsync(){
    console.log("task disabled")
    return BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK_IDENTIFIER);
}

export async function isTaskRegistered(){
    return TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_IDENTIFIER); 
}


export async function taskNotEnabledNotifcation(){
    if (!(await isTaskRegistered())){
        sendNotification("Background scanning is not enabled for bluetooth scanner", "please enable background processing in home page of application for bluetooth devices to be scanned")
        console.log("Notification sent")
    }
}
