import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Affiche les informations clés de ce serveur.')
        .setDMPermission(false),
    async execute(interaction) {
        const { guild } = interaction;

        // Récupération du propriétaire
        const owner = await guild.fetchOwner();

        const embed = new EmbedBuilder()
            .setColor('#7852FF')
            .setTitle(`Informations du serveur : ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: 'Propriétaire', value: owner.user.tag, inline: true },
                { name: 'Membres', value: `${guild.memberCount}`, inline: true },
                { name: 'Date de création', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'Aetheris', iconURL: interaction.client.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed] });
    },
};
