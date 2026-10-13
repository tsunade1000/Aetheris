import { Events, ActivityType } from 'discord.js';
import { startUptimeMonitor } from '../../services/uptimeMonitor.js';
import { startAnomalyScheduler } from '../../services/anomalyScheduler.js';

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

        // Lancement des services d'arrière-plan
        startUptimeMonitor(client);
        startAnomalyScheduler(client);
    },
};
