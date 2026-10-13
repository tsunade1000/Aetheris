import { Events, ActivityType } from 'discord.js';

export default {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`[AETHERIS] Prêt ! Connecté en tant que ${client.user.tag}`);

        // Définition de la Rich Presence
        client.user.setPresence({
            activities: [{ name: 'Aetheris | /help', type: ActivityType.Watching }],
            status: 'online',
        });
    },
};
