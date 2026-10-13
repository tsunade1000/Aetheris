import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { statements } from '../../utils/database.js';

export default {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Avertit un membre et enregistre l\'infraction.')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre à avertir.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('raison')
                .setDescription('La raison de l\'avertissement.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),

    async execute(interaction) {
        const target = interaction.options.getUser('membre');
        const reason = interaction.options.getString('raison');
        const guildId = interaction.guildId;

        // Impossible de s'avertir soi-même ou le bot
        if (target.id === interaction.user.id || target.bot) {
            return interaction.reply({ content: '❌ Vous ne pouvez pas avertir ce membre.', ephemeral: true });
        }

        // On vérifie d'abord que le target est bien sur le serveur
        const targetMember = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (!targetMember) {
            return interaction.reply({ content: '❌ Ce membre n\'est pas sur le serveur.', ephemeral: true });
        }

        // --- 1. Base de données ---
        // S'assurer que le serveur existe dans guild_configs
        let config = statements.getConfig.get(guildId);
        if (!config) {
             statements.setConfig.run({
                guild_id: guildId,
                log_channel_id: null,
                welcome_channel_id: null,
                autorole_id: null
            });
            config = statements.getConfig.get(guildId);
        }

        // Enregistrer l'infraction
        statements.addInfraction.run({
            guild_id: guildId,
            user_id: target.id,
            moderator_id: interaction.user.id,
            action_type: 'WARN',
            reason: reason
        });

        // --- 2. Notification en MP ---
        let dmStatus = '*(MP désactivés ou inaccessibles)*';
        try {
            const dmEmbed = new EmbedBuilder()
                .setColor('#7852FF')
                .setTitle(`⚠️ Avertissement sur ${interaction.guild.name}`)
                .addFields(
                    { name: 'Raison', value: reason },
                    { name: 'Modérateur', value: interaction.user.tag }
                )
                .setTimestamp()
                .setFooter({ text: 'Aetheris', iconURL: interaction.client.user.displayAvatarURL() });

            await target.send({ embeds: [dmEmbed] });
            dmStatus = '*(MP envoyé avec succès)*';
        } catch (error) {
            // Ignorer l'erreur si les MPs sont fermés
        }

        // --- 3. Log channel ---
        if (config && config.log_channel_id) {
            const logChannel = interaction.guild.channels.cache.get(config.log_channel_id);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#7852FF')
                    .setTitle('🚨 Nouvelle Infraction : WARN')
                    .addFields(
                        { name: 'Membre', value: `${target.tag} (${target.id})`, inline: true },
                        { name: 'Modérateur', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                        { name: 'Raison', value: reason, inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Aetheris', iconURL: interaction.client.user.displayAvatarURL() });

                try {
                    await logChannel.send({ embeds: [logEmbed] });
                } catch (error) {
                    // Silently handle Missing Permissions if the bot can't send messages in the log channel
                    if (error.code !== 50013) {
                        console.error('Erreur lors de l\'envoi du log de WARN:', error);
                    }
                }
            }
        }

        // --- 4. Confirmation de la commande ---
        await interaction.reply({
            content: `✅ Le membre **${target.tag}** a été averti pour : \`${reason}\` ${dmStatus}`,
            ephemeral: true
        });
    },
};
