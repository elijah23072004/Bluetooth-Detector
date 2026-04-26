import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound:false,
        shouldSetBadge:false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});


export function sendNotification(title:string, body?:string){
    Notifications.scheduleNotificationAsync({
        content: {
            title: title,
            body: body,
        },
        trigger: null,
    });
}
