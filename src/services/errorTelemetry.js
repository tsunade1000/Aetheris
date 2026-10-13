import { EmbedBuilder } from 'discord.js';

export function initializeTelemetry(client) {
    const sendTelemetry = async (title, error) => {
        try {
            console.error(`[TELEMETRY] ${title}:`, error);
            const channels = client.channels.cache.filter(c => c.name === '├─✦-📋・télémétrie-et-crashs');

            for (const [id, channel] of channels) {
                const stackTrace = error && error.stack ? error.stack.substring(0, 4000) : String(error);
                const embed = new EmbedBuilder()
                    .setColor('#FF007A')
                    .setTitle(`🚨 ${title}`)
                    .setDescription(`\`\`\`js\n${stackTrace}\n\`\`\``)
                    .setTimestamp()
                    .setFooter({ text: 'Aetheris Telemetry' });

                await channel.send({ embeds: [embed] }).catch(() => {});
            }
        } catch (err) {
            console.error('Erreur fatale de télémétrie:', err);
        }
    };

    process.on('unhandledRejection', (reason, promise) => {
        sendTelemetry('Unhandled Rejection', reason);
    });

    process.on('uncaughtException', (error) => {
        sendTelemetry('Uncaught Exception', error);
    });

    client.on('error', (error) => {
        sendTelemetry('Discord Client Error', error);
    });
}
