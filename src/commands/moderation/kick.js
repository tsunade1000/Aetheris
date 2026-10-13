import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { logInfraction, statements } from '../../utils/database.js';

export default {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulse un membre du serveur.')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre à expulser.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('raison')
                .setDescription('La raison de l\'expulsion.')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .setDMPermission(false),

    async execute(interaction) {
        const target = interaction.options.getUser('membre');
        const reason = interaction.options.getString('raison') || 'Aucune raison spécifiée';
        const guildId = interaction.guildId;

        if (target.id === interaction.user.id || target.id === interaction.client.user.id) {
            return interaction.reply({ content: '❌ Vous ne pouvez pas expulser ce membre.', ephemeral: true });
        }

        const targetMember = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (!targetMember) {
            return interaction.reply({ content: '❌ Ce membre n\'est pas sur le serveur.', ephemeral: true });
        }

        // Vérification de la hiérarchie
        if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({ content: '❌ Vous ne pouvez pas expulser un membre ayant un rôle égal ou supérieur au vôtre.', ephemeral: true });
        }
        if (!targetMember.kickable) {
            return interaction.reply({ content: '❌ Je ne peux pas expulser ce membre (vérifiez mes permissions et ma position dans la hiérarchie des rôles).', ephemeral: true });
        }

        // --- Notification en MP (avant l'expulsion) ---
        let dmStatus = '*(MP désactivés ou inaccessibles)*';
        try {
            const dmEmbed = new EmbedBuilder()
                .setColor('#7852FF')
                .setTitle(`🚪 Vous avez été expulsé de ${interaction.guild.name}`)
                .addFields(
                    { name: 'Raison', value: reason },
                    { name: 'Modérateur', value: interaction.user.tag }
                )
                .setTimestamp()
                .setFooter({ text: 'Aetheris', iconURL: interaction.client.user.displayAvatarURL() });

            await target.send({ embeds: [dmEmbed] });
            dmStatus = '*(MP envoyé avec succès)*';
        } catch (error) {
            // Ignorer
        }

        try {
            await targetMember.kick(reason);

            // Log en base de données
            logInfraction({
                guild_id: guildId,
                user_id: target.id,
                moderator_id: interaction.user.id,
                action_type: 'KICK',
                reason: reason
            });

            // Log dans le channel d'audit
            const config = statements.getConfig.get(guildId);
            if (config && config.log_channel_id) {
                const logChannel = interaction.guild.channels.cache.get(config.log_channel_id);
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setColor('#7852FF')
                        .setTitle('👢 Membre Expulsé (Kick)')
                        .addFields(
                            { name: 'Membre', value: `${target.tag} (${target.id})`, inline: true },
                            { name: 'Modérateur', value: interaction.user.tag, inline: true },
                            { name: 'Raison', value: reason }
                        )
                        .setTimestamp()
                        .setFooter({ text: 'Aetheris', iconURL: interaction.client.user.displayAvatarURL() });

                    await logChannel.send({ embeds: [embed] }).catch(() => {});
                }
            }

            await interaction.reply({ content: `✅ **${target.tag}** a été expulsé avec succès. ${dmStatus}`, ephemeral: true });
        } catch (error) {
            if (error.code === 50013) {
                return interaction.reply({ content: '❌ Je n\'ai pas la permission d\'expulser des membres.', ephemeral: true });
            }
            console.error(error);
            await interaction.reply({ content: 'Une erreur est survenue lors de l\'expulsion.', ephemeral: true });
        }
    }
};
