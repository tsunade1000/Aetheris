import { SlashCommandBuilder, EmbedBuilder, version } from 'discord.js';
import os from 'node:os';
import fs from 'node:fs';
import { dbPath, db } from '../../utils/database.js';

export default {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('Affiche des informations détaillées et statistiques sur Aetheris.'),

    async execute(interaction) {
        // Uptime formaté
        const totalSeconds = Math.floor(interaction.client.uptime / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        const uptimeString = `${days}j ${hours}h ${minutes}m ${seconds}s`;

        // RAM Usage
        const memoryUsage = process.memoryUsage();
        const heapUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
        const heapTotal = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);

        // Métriques Discord
        const totalGuilds = interaction.client.guilds.cache.size;
        const totalMembers = interaction.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const wsLatency = interaction.client.ws.ping;

        // Calcul du ping de l'API REST
        const sent = await interaction.reply({ content: 'Récupération des données en cours...', withResponse: true });
        const restLatency = sent.createdTimestamp - interaction.createdTimestamp;

        // SQLite Info
        let dbSize = 'Inconnue';
        let isWalActive = false;
        if (fs.existsSync(dbPath)) {
            const stats = fs.statSync(dbPath);
            dbSize = (stats.size / 1024).toFixed(2) + ' KB';
            // Vérification du mode WAL
            const pragma = db.pragma('journal_mode', { simple: true });
            if (pragma.toLowerCase() === 'wal') isWalActive = true;
        }

        const embed = new EmbedBuilder()
            .setColor('#7852FF')
            .setTitle('Aetheris | Informations Système')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                { name: '⏱️ Uptime', value: `\`${uptimeString}\``, inline: true },
                { name: '📦 Versions', value: `Node.js: \`${process.version}\`\nDiscord.js: \`v${version}\`\nAetheris: \`v1.1\``, inline: true },
                { name: '\u200B', value: '\u200B', inline: true }, // Empty field for alignment
                { name: '💻 Système', value: `OS: \`${os.type()} ${os.release()}\`\nArch: \`${os.arch()}\`\nRAM: \`${heapUsed} MB / ${heapTotal} MB\``, inline: true },
                { name: '🌐 Réseau', value: `WS Latence: \`${wsLatency}ms\`\nAPI Latence: \`${restLatency}ms\``, inline: true },
                { name: '\u200B', value: '\u200B', inline: true }, // Empty field for alignment
                { name: '📊 Statistiques', value: `Serveurs: \`${totalGuilds}\`\nMembres: \`${totalMembers}\``, inline: true },
                { name: '🗄️ Base de données', value: `Taille: \`${dbSize}\`\nMode WAL: ${isWalActive ? '✅ Actif' : '❌ Inactif'}`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Aetheris', iconURL: interaction.client.user.displayAvatarURL() });

        await interaction.editReply({ content: null, embeds: [embed] });
    },
};
