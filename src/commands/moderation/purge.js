import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Supprime un nombre spécifié de messages récents (1-100).')
        .addIntegerOption(option =>
            option.setName('montant')
                .setDescription('Le nombre de messages à supprimer (entre 1 et 100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setDMPermission(false),
    async execute(interaction) {
        const amount = interaction.options.getInteger('montant');

        try {
            // Bulk delete supprime les messages. true pour ignorer l'erreur des vieux messages
            const deleted = await interaction.channel.bulkDelete(amount, true);

            await interaction.reply({
                content: `✅ J'ai supprimé ${deleted.size} message(s) avec succès.`,
                ephemeral: true
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'Une erreur est survenue lors de la tentative de suppression des messages dans ce salon.',
                ephemeral: true
            });
        }
    },
};
