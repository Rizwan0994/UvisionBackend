const admin = require("firebase-admin");

admin.initializeApp({
    credential: admin.credential.cert(require("../firebaseConfig/uvision-fcm-firebase-adminsdk.json"))
});

exports.SendFirebaseNotification = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let { notification, registerToken, profilePicture, chatId } = data;
            if(!registerToken.length) return;
            let icon =`https://dbvegu4yzhf6f.cloudfront.net/50x50/${profilePicture.split("/")[3]}`; 
            // console.log('icon :>> ', icon);
            const message = {
                notification,
                webpush: {
                    // headers: {
                    //     image: "http://192.168.1.241:3001/819810ad-1a10-45ef-9c45-34f9bd442d86.png"
                    // },
                    headers: {
                        Urgency: 'high',
                    },
                    notification: {
                        icon,
                        vibrate: [200, 100, 200],
                        actions: [
                          {
                            title: 'Learn More',
                            action: `${process.env.URL}/chats/${chatId}`,
                          },
                        ],
                    },
                    fcmOptions: {
                        link: `${process.env.URL}/chats/${chatId}`,
                    }
                },
                data: {
                    chat: `${chatId}`,
                    url :`${process.env.URL}/chats/${chatId}`
                },
                android: {
                    notification:   {
                      channelId: '1'
                    }
                },
                // apns: {
                //     payload: {
                //         aps: {
                //             sound: 'default',
                //         },
                //     },
                // },
                tokens: registerToken,
                topic: "U-Vision",
                collapse_key: "U-vision",
            };
            admin.messaging().sendMulticast(message)
                .then(function (res) {
                    resolve({ status: 1, message: "successfully sent message.", data: res });
                })
                .catch(function (error) {
                    console.log("error sending message ", error);
                    reject({ status: 0, message: "error sending message." });
                })
        } catch (error) {
            console.log(error);
            reject({ status: 0, message: "Something went wrong." });
        }
    })
}