import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } from 'discord.js';
import { statements } from '../../utils/database.js';

export default {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Gérer la configuration du bot pour ce serveur (Administrateurs uniquement).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .addSubcommand(subcommand =>
            subcommand
                .setName('logs')
                .setDescription('Définit ou supprime le salon des journaux d\'audit.')
                .addChannelOption(option =>
                    option.setName('salon')
                        .setDescription('Le salon textuel (vide = désactiver).')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('welcome')
                .setDescription('Définit le salon de bienvenue.')
                .addChannelOption(option =>
                    option.setName('salon')
                        .setDescription('Le salon textuel (vide = désactiver).')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('autorole')
                .setDescription('Configure un rôle automatique à l\'arrivée.')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Le rôle à attribuer (vide = désactiver).')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('Affiche un récapitulatif visuel de la configuration actuelle du serveur.')),

    async execute(interaction) {
        const subCommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        // On récupère ou initialise la configuration pour éviter les nulls lors des UPDATE (sauf si on utilise UPSERT)
        let currentConfig = statements.getConfig.get(guildId) || {
            guild_id: guildId,
            log_channel_id: null,
            welcome_channel_id: null,
            autorole_id: null
        };

        if (subCommand === 'view') {
            const embed = new EmbedBuilder()
                .setColor('#7852FF')
                .setTitle(`Configuration : ${interaction.guild.name}`)
                .addFields(
                    { name: 'Salon des Logs', value: currentConfig.log_channel_id ? `<#${currentConfig.log_channel_id}>` : 'Désactivé', inline: true },
                    { name: 'Salon de Bienvenue', value: currentConfig.welcome_channel_id ? `<#${currentConfig.welcome_channel_id}>` : 'Désactivé', inline: true },
                    { name: 'Autorole', value: currentConfig.autorole_id ? `<@&${currentConfig.autorole_id}>` : 'Désactivé', inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Aetheris', iconURL: interaction.client.user.displayAvatarURL() });

            return interaction.reply({ embeds: [embed] });
        }

        let replyMessage = '';

        if (subCommand === 'logs') {
            const channel = interaction.options.getChannel('salon');
            currentConfig.log_channel_id = channel ? channel.id : null;
            replyMessage = channel ? `✅ Le salon des logs a été défini sur ${channel}.` : `✅ Le système de logs a été désactivé.`;
        } else if (subCommand === 'welcome') {
            const channel = interaction.options.getChannel('salon');
            currentConfig.welcome_channel_id = channel ? channel.id : null;
            replyMessage = channel ? `✅ Le salon de bienvenue a été défini sur ${channel}.` : `✅ Le système de bienvenue a été désactivé.`;
        } else if (subCommand === 'autorole') {
            const role = interaction.options.getRole('role');
            currentConfig.autorole_id = role ? role.id : null;
            replyMessage = role ? `✅ L'autorole a été défini sur ${role}.` : `✅ L'autorole a été désactivé.`;
        }

        // Sauvegarde via l'UPSERT défini dans database.js
        statements.setConfig.run(currentConfig);

        await interaction.reply({ content: replyMessage, ephemeral: true });
    },
};
