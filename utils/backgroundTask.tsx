import * as BackgroundTask from 'expo-background-task'
import * as TaskManager from 'expo-task-manager'
import { runBluetoothScan } from './runBluetoothScanner';
const BACKGROUND_TASK_IDENTIFIER = 'background-bluetooth-scan'
const TASK_FREQUENCY = 15 //minutes


TaskManager.defineTask(BACKGROUND_TASK_IDENTIFIER, async () => {
    const now = Date.now();
    try{
        console.log(`Got background task call at date: ${ new Date(now).toISOString()}`);
        runBluetoothScan()
    }catch (error) {
        console.error("Failed to execute background task:", error);
        return BackgroundTask.BackgroundTaskResult.Failed
    }
    console.log("Background task returned successfully")
    return BackgroundTask.BackgroundTaskResult.Success


});



export async function registerBackgroundTaskAsync(){
    return BackgroundTask.registerTaskAsync(BACKGROUND_TASK_IDENTIFIER, {minimumInterval:TASK_FREQUENCY});
}

export async function unregisterBackgroundTaskAsync(){
    return BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK_IDENTIFIER);
}

export async function isTaskRegistered(){
    return TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_IDENTIFIER); 
}
