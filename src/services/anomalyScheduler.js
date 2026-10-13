import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export function startAnomalyScheduler(client) {
    // Exécuter à intervalles aléatoires entre 30 et 120 minutes
    const scheduleNext = () => {
        const randomDelay = Math.floor(Math.random() * (7200000 - 1800000 + 1)) + 1800000;

        setTimeout(async () => {
            try {
                const channels = client.channels.cache.filter(c => c.name === '├─✦-🌌・anomalies-spatiales');

                for (const [id, channel] of channels) {
                    const embed = new EmbedBuilder()
                        .setColor('#FF007A')
                        .setTitle('🌌 ALERTE : Faille Cosmique Détectée !')
                        .setDescription('Une anomalie temporelle vient de s\'ouvrir dans ce secteur. Soyez le premier Gardien ou Citoyen à stabiliser la faille pour récupérer de l\'énergie stellaire !')
                        .setImage('https://i.imgur.com/example_anomaly.gif') // Optionnel, URL fictive pour l'exemple
                        .setFooter({ text: 'Aetheris Anomaly System' });

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('btn_anomaly_capture').setLabel('Capturer la brèche').setStyle(ButtonStyle.Primary).setEmoji('🪤'),
                        new ButtonBuilder().setCustomId('btn_anomaly_channel').setLabel('Canaliser l\'énergie').setStyle(ButtonStyle.Success).setEmoji('⚡')
                    );

                    await channel.send({ embeds: [embed], components: [row] }).catch(() => {});
                }
            } catch (error) {
                console.error('Anomaly Scheduler Error:', error);
            }
            // Reprogramme la prochaine
            scheduleNext();
        }, randomDelay);
    };

    scheduleNext();
}
