import { Events, EmbedBuilder } from 'discord.js';
import { statements } from '../../utils/database.js';

export default {
    name: Events.GuildMemberRemove,
    async execute(member) {
        const config = statements.getConfig.get(member.guild.id);
        if (!config || !config.log_channel_id) return;

        const logChannel = member.guild.channels.cache.get(config.log_channel_id);
        if (!logChannel) return;

        // Récupérer les rôles (en excluant le rôle @everyone)
        const roles = member.roles.cache.filter(r => r.id !== member.guild.id).map(r => `<@&${r.id}>`);
        const rolesString = roles.length > 0 ? roles.join(', ') : '*(Aucun rôle)*';

        const embed = new EmbedBuilder()
            .setColor('#7852FF')
            .setTitle('🚪 Départ d\'un membre')
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Membre', value: `${member.user.tag} (${member.id})`, inline: true },
                { name: 'Rôles perdus', value: rolesString, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'Aetheris', iconURL: member.client.user.displayAvatarURL() });

        try {
            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            if (error.code !== 50013) {
                console.error('Erreur lors de l\'envoi du log de départ:', error);
            }
        }
    },
};
