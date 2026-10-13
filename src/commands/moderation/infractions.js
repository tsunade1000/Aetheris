import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { statements } from '../../utils/database.js';

export default {
    data: new SlashCommandBuilder()
        .setName('infractions')
        .setDescription('Affiche ou réinitialise le dossier disciplinaire d\'un membre.')
        .setDMPermission(false)
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('Affiche les infractions d\'un membre.')
                .addUserOption(option =>
                    option.setName('membre')
                        .setDescription('Le membre à vérifier.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Réinitialise le dossier disciplinaire d\'un membre (Administrateur uniquement).')
                .addUserOption(option =>
                    option.setName('membre')
                        .setDescription('Le membre à réinitialiser.')
                        .setRequired(true))),
    async execute(interaction) {
        const subCommand = interaction.options.getSubcommand();
        const target = interaction.options.getUser('membre');
        const guildId = interaction.guildId;

        if (subCommand === 'view') {
            const infractions = statements.getUserInfractions.all(guildId, target.id);

            const embed = new EmbedBuilder()
                .setColor('#7852FF')
                .setTitle(`Dossier disciplinaire de ${target.tag}`)
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Aetheris', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            if (infractions.length === 0) {
                embed.setDescription('✅ Ce membre n\'a aucune infraction.');
            } else {
                let description = `Total des infractions : **${infractions.length}**\n\n`;
                // Afficher les 10 dernières pour éviter la limite de caractères (Embed description max 4096)
                const toShow = infractions.slice(0, 10);

                toShow.forEach((inf, index) => {
                    const date = new Date(inf.created_at + 'Z'); // UTC
                    description += `**${index + 1}. [${inf.action_type}]** - <t:${Math.floor(date.getTime() / 1000)}:d>\n`;
                    description += `↳ Modérateur : <@${inf.moderator_id}>\n`;
                    description += `↳ Raison : ${inf.reason}\n\n`;
                });

                if (infractions.length > 10) {
                    description += `*... et ${infractions.length - 10} autre(s) infraction(s).*`;
                }

                embed.setDescription(description);
            }

            return interaction.reply({ embeds: [embed] });
        }

        if (subCommand === 'clear') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ Vous devez être Administrateur pour purger un dossier disciplinaire.', ephemeral: true });
            }

            statements.clearUserInfractions.run(guildId, target.id);
            return interaction.reply({ content: `✅ Le dossier disciplinaire de **${target.tag}** a été entièrement purgé.`, ephemeral: true });
        }
    }
};
