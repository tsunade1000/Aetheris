import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { logInfraction, statements } from '../../utils/database.js';

export default {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Exclut temporairement un membre.')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre à exclure temporairement.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duree')
                .setDescription('La durée de l\'exclusion en minutes.')
                .setRequired(true)
                .setMinValue(1))
        .addStringOption(option =>
            option.setName('raison')
                .setDescription('La raison du timeout.')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),

    async execute(interaction) {
        const target = interaction.options.getUser('membre');
        const durationMinutes = interaction.options.getInteger('duree');
        const reason = interaction.options.getString('raison') || 'Aucune raison spécifiée';
        const guildId = interaction.guildId;

        if (target.id === interaction.user.id || target.id === interaction.client.user.id) {
            return interaction.reply({ content: '❌ Vous ne pouvez pas appliquer de timeout à vous-même ou au bot.', ephemeral: true });
        }

        const targetMember = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (!targetMember) {
            return interaction.reply({ content: '❌ Ce membre n\'est pas sur le serveur.', ephemeral: true });
        }

        // Vérification de la hiérarchie
        if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({ content: '❌ Vous ne pouvez pas sanctionner un membre ayant un rôle égal ou supérieur au vôtre.', ephemeral: true });
        }
        if (!targetMember.manageable) {
            return interaction.reply({ content: '❌ Je ne peux pas sanctionner ce membre (vérifiez mes permissions et ma position dans la hiérarchie des rôles).', ephemeral: true });
        }

        const durationMs = durationMinutes * 60 * 1000;

        try {
            await targetMember.timeout(durationMs, reason);

            // Log en base de données
            logInfraction({
                guild_id: guildId,
                user_id: target.id,
                moderator_id: interaction.user.id,
                action_type: 'TIMEOUT',
                reason: reason
            });

            // Log dans le channel d'audit
            const config = statements.getConfig.get(guildId);
            if (config && config.log_channel_id) {
                const logChannel = interaction.guild.channels.cache.get(config.log_channel_id);
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setColor('#7852FF')
                        .setTitle('⏳ Membre mis en Timeout')
                        .addFields(
                            { name: 'Membre', value: `${target.tag} (${target.id})`, inline: true },
                            { name: 'Modérateur', value: interaction.user.tag, inline: true },
                            { name: 'Durée', value: `${durationMinutes} minutes`, inline: true },
                            { name: 'Raison', value: reason }
                        )
                        .setTimestamp()
                        .setFooter({ text: 'Aetheris', iconURL: interaction.client.user.displayAvatarURL() });

                    await logChannel.send({ embeds: [embed] }).catch(() => {});
                }
            }

            await interaction.reply({ content: `✅ **${target.tag}** a été mis en timeout pour **${durationMinutes} minute(s)**.`, ephemeral: true });
        } catch (error) {
            if (error.code === 50013) {
                return interaction.reply({ content: '❌ Je n\'ai pas la permission de gérer les timeouts.', ephemeral: true });
            }
            console.error(error);
            await interaction.reply({ content: 'Une erreur est survenue lors du timeout.', ephemeral: true });
        }
    }
};
