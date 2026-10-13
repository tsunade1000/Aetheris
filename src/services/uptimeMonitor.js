import { EmbedBuilder, version } from 'discord.js';
import os from 'node:os';
import fs from 'node:fs';
import { dbPath, db } from '../utils/database.js';

export function startUptimeMonitor(client) {
    setInterval(async () => {
        try {
            // Recherche du channel dans tous les serveurs (ou sur le serveur principal)
            // Dans ce contexte, on cherche par le nom du salon généré par le setup
            const channels = client.channels.cache.filter(c => c.name === '├─✦-📊・statut-uptime');

            for (const [id, channel] of channels) {
                // Formatting Uptime
                const totalSeconds = Math.floor(client.uptime / 1000);
                const days = Math.floor(totalSeconds / 86400);
                const hours = Math.floor((totalSeconds % 86400) / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = Math.floor(totalSeconds % 60);
                const uptimeString = `${days}j ${hours}h ${minutes}m ${seconds}s`;

                // RAM Usage
                const memoryUsage = process.memoryUsage();
                const heapUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
                const heapTotal = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);

                // SQLite Info
                let dbSize = 'Inconnue';
                let isWalActive = false;
                if (fs.existsSync(dbPath)) {
                    const stats = fs.statSync(dbPath);
                    dbSize = (stats.size / 1024).toFixed(2) + ' KB';
                    const pragma = db.pragma('journal_mode', { simple: true });
                    if (pragma.toLowerCase() === 'wal') isWalActive = true;
                }

                // Check DB integrity
                const integrity = db.pragma('integrity_check', { simple: true });
                const dbStatus = integrity === 'ok' ? '✅ Sain' : '❌ Corrompu';

                const embed = new EmbedBuilder()
                    .setColor(client.ws.ping < 100 ? '#00FFA3' : '#FF4500')
                    .setTitle('📊 Live Monitor : Statut & Uptime')
                    .setDescription('Ce panneau est actualisé automatiquement toutes les 60 secondes.')
                    .addFields(
                        { name: '🔌 Statut Opérationnel', value: client.ws.ping < 100 ? '✅ En ligne et Stable' : '⚠️ Dégradé', inline: false },
                        { name: '⏱️ Uptime', value: `\`${uptimeString}\``, inline: true },
                        { name: '🌐 Latence (WS)', value: `\`${client.ws.ping}ms\``, inline: true },
                        { name: '💻 Consommation RAM', value: `\`${heapUsed} MB / ${heapTotal} MB\``, inline: false },
                        { name: '🗄️ Métriques SQLite', value: `Taille : \`${dbSize}\`\nMode WAL : ${isWalActive ? '✅' : '❌'}\nIntégrité : ${dbStatus}`, inline: false }
                    )
                    .setFooter({ text: `Dernière actualisation : ${new Date().toLocaleTimeString('fr-FR')}`, iconURL: client.user.displayAvatarURL() });

                // Chercher l'ancien message
                const messages = await channel.messages.fetch({ limit: 10 }).catch(() => null);
                if (messages) {
                    const existingMessage = messages.find(m => m.author.id === client.user.id);
                    if (existingMessage) {
                        await existingMessage.edit({ embeds: [embed] }).catch(() => {});
                        continue;
                    }
                }

                await channel.send({ embeds: [embed] }).catch(() => {});
            }
        } catch (error) {
            console.error('Erreur dans UptimeMonitor:', error);
        }
    }, 60000);
}
