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
        .addUserOption(option =>
            option.setName('cible')
                .setDescription('Supprimer uniquement les messages de cet utilisateur')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setDMPermission(false),
    async execute(interaction) {
        const amount = interaction.options.getInteger('montant');
        const target = interaction.options.getUser('cible');

        try {
            let messagesToDelete;

            if (target) {
                // Fetch the messages and filter by target user
                const messages = await interaction.channel.messages.fetch({ limit: amount });
                messagesToDelete = messages.filter(m => m.author.id === target.id);
            } else {
                messagesToDelete = amount;
            }

            // Bulk delete supprime les messages. true pour ignorer l'erreur des vieux messages
            const deleted = await interaction.channel.bulkDelete(messagesToDelete, true);

            const targetInfo = target ? ` de **${target.tag}**` : '';
            await interaction.reply({
                content: `✅ J'ai supprimé ${deleted.size} message(s)${targetInfo} avec succès.`,
                ephemeral: true
            });
        } catch (error) {
            if (error.code === 50013) {
                return interaction.reply({ content: '❌ Je n\'ai pas la permission de gérer les messages dans ce salon.', ephemeral: true });
            }
            console.error(error);
            await interaction.reply({
                content: 'Une erreur est survenue lors de la tentative de suppression des messages dans ce salon.',
                ephemeral: true
            });
        }
    },
};
