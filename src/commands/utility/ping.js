import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Affiche la latence du bot et de l\'API Discord.'),
    async execute(interaction) {
        // Envoi initial pour calculer la latence
        const sent = await interaction.reply({ content: 'Calcul en cours...', withResponse: true });

        // Latence du bot (différence entre l'heure de réception et l'heure d'envoi du message)
        const latency = sent.createdTimestamp - interaction.createdTimestamp;

        // Latence de l'API (Ping du Websocket)
        const apiLatency = Math.round(interaction.client.ws.ping);

        // Création de l'Embed stylisé (violet Aetheris)
        const embed = new EmbedBuilder()
            .setColor('#7852FF')
            .setTitle('🏓 Pong !')
            .addFields(
                { name: 'Latence du Bot', value: `\`${latency}ms\``, inline: true },
                { name: 'Latence de l\'API', value: `\`${apiLatency}ms\``, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Aetheris', iconURL: interaction.client.user.displayAvatarURL() });

        // Modification de la réponse initiale avec l'Embed
        await interaction.editReply({ content: null, embeds: [embed] });
    },
};
