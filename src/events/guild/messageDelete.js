import { Events, EmbedBuilder } from 'discord.js';
import { statements } from '../../utils/database.js';

export default {
    name: Events.MessageDelete,
    async execute(message) {
        // Ignore les messages partiels ou les messages de bots
        if (message.partial || message.author?.bot) return;
        if (!message.guild) return;
        // Ignore si le message n'a ni contenu ni pièces jointes
        if (!message.content && message.attachments.size === 0) return;

        const config = statements.getConfig.get(message.guild.id);
        if (!config || !config.log_channel_id) return;

        const logChannel = message.guild.channels.cache.get(config.log_channel_id);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor('#7852FF')
            .setTitle('🗑️ Message Supprimé')
            .addFields(
                { name: 'Auteur', value: `${message.author.tag} (${message.author.id})`, inline: true },
                { name: 'Salon', value: `<#${message.channel.id}>`, inline: true },
                { name: 'Contenu', value: message.content ? (message.content.length > 1024 ? message.content.slice(0, 1021) + '...' : message.content) : '*(Aucun texte)*' }
            )
            .setTimestamp()
            .setFooter({ text: 'Aetheris', iconURL: message.client.user.displayAvatarURL() });

        if (message.attachments.size > 0) {
            embed.addFields({ name: 'Pièces jointes', value: `${message.attachments.size} fichier(s) attaché(s)` });
        }

        try {
            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            if (error.code !== 50013) {
                console.error('Erreur lors de l\'envoi du log messageDelete:', error);
            }
        }
    },
};
