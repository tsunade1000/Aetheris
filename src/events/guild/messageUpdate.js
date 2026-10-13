import { Events, EmbedBuilder } from 'discord.js';
import { statements } from '../../utils/database.js';

export default {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
        // Ignore les messages de bots, partiels ou non modifiés
        if (oldMessage.partial || oldMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return;
        if (!oldMessage.guild) return;

        const config = statements.getConfig.get(oldMessage.guild.id);
        if (!config || !config.log_channel_id) return;

        const logChannel = oldMessage.guild.channels.cache.get(config.log_channel_id);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor('#7852FF')
            .setTitle('✏️ Message Modifié')
            .addFields(
                { name: 'Auteur', value: `${oldMessage.author.tag} (${oldMessage.author.id})`, inline: true },
                { name: 'Salon', value: `<#${oldMessage.channel.id}>`, inline: true },
                { name: 'Avant', value: oldMessage.content ? (oldMessage.content.length > 1024 ? oldMessage.content.slice(0, 1021) + '...' : oldMessage.content) : '*(Aucun contenu)*' },
                { name: 'Après', value: newMessage.content ? (newMessage.content.length > 1024 ? newMessage.content.slice(0, 1021) + '...' : newMessage.content) : '*(Aucun contenu)*' }
            )
            .setTimestamp()
            .setFooter({ text: 'Aetheris', iconURL: oldMessage.client.user.displayAvatarURL() });

        try {
            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            if (error.code !== 50013) {
                console.error('Erreur lors de l\'envoi du log messageUpdate:', error);
            }
        }
    },
};
