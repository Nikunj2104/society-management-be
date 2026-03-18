import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

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
) => {
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
    const tickets = [];

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
