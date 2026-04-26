import type { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

let expoInstance: any;
let ExpoModule: any;

const getExpo = async () => {
    if (!expoInstance) {
        // Use a dynamic import to avoid ERR_REQUIRE_ESM in CommonJS environment.
        // The Function constructor prevents TypeScript from transpiling this to require().
        const module = await (new Function('return import("expo-server-sdk")')());
        ExpoModule = module.Expo;
        expoInstance = new ExpoModule();
    }
    return { expo: expoInstance, Expo: ExpoModule };
};

/**
 * Sends a push notification to one or more Expo push tokens.
 * @param tokens - Array of Expo push tokens or a single token string
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Optional data object to send with the notification
 */
export const sendPushNotification = async (
    tokens: string | string[],
    title: string,
    body: string,
    data: Record<string, any> = {}
): Promise<ExpoPushTicket[]> => {
    const { expo, Expo } = await getExpo();
    const pushTokens = Array.isArray(tokens) ? tokens : [tokens];
    const messages: ExpoPushMessage[] = [];

    for (const pushToken of pushTokens) {
        if (!Expo.isExpoPushToken(pushToken)) {
            console.error(`Push token ${pushToken} is not a valid Expo push token`);
            continue;
        }

        messages.push({
            to: pushToken,
            sound: 'default',
            title,
            body,
            data,
        });
    }

    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        } catch (error) {
            console.error('Error sending push notification chunk:', error);
        }
    }

    return tickets;
};

