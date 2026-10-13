import { Events, EmbedBuilder } from 'discord.js';
import { statements } from '../../utils/database.js';

export default {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const config = statements.getConfig.get(member.guild.id);
        if (!config) return;

        // 1. Autorole
        if (config.autorole_id && !member.user.bot) {
            const role = member.guild.roles.cache.get(config.autorole_id);
            if (role) {
                try {
                    await member.roles.add(role);
                } catch (error) {
                    if (error.code !== 50013) {
                        console.error('Erreur lors de l\'attribution de l\'autorole:', error);
                    }
                }
            }
        }

        // 2. Welcome Channel (optional - if requested to separate log and welcome, but prompt says log channel for arrival note, wait: prompt says "send welcome notification in log channel? No, "welcome channel" was in config, but prompt says "Notification d'arrivée...". Let's check config.welcome_channel_id).
        // Actually, prompt says: "Notification d'arrivée (avatar, compte créé le, compteur de membres du serveur)."
        // Let's send it to the welcome_channel_id if it exists, or log_channel_id if it's considered an audit log. We'll use welcome_channel_id for welcome, or log_channel_id if welcome is not set but log is. Wait, the prompt says "Notification d'arrivée". Let's use welcome_channel_id, as it was specifically configured.

        const welcomeChannel = member.guild.channels.cache.get(config.welcome_channel_id) || member.guild.channels.cache.get(config.log_channel_id);

        if (welcomeChannel) {
            const embed = new EmbedBuilder()
                .setColor('#7852FF')
                .setTitle(`👋 Bienvenue sur ${member.guild.name} !`)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .addFields(
                    { name: 'Membre', value: `${member.user.tag} (${member.id})`, inline: true },
                    { name: 'Compte créé le', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:D>`, inline: true },
                    { name: 'Membres', value: `Nous sommes maintenant ${member.guild.memberCount} membres.`, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'Aetheris', iconURL: member.client.user.displayAvatarURL() });

            try {
                await welcomeChannel.send({ embeds: [embed] });
            } catch (error) {
                if (error.code !== 50013) {
                    console.error('Erreur lors de l\'envoi du message de bienvenue:', error);
                }
            }
        }
    },
};
