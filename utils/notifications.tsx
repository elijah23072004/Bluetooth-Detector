import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound:true,
        shouldSetBadge:true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});


export  async function sendNotification(title:string, body?:string){
    const res = await Notifications.requestPermissionsAsync();
    console.log("Permissions reponse:",res)
    console.log("sending notification:"+title+" body:"+body)
    Notifications.scheduleNotificationAsync({
        content: {
            title: title,
            body: body,
        },
        trigger: null,
    });
}
