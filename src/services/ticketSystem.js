import { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export async function handleTicketCreate(interaction) {
    const guild = interaction.guild;
    const user = interaction.user;

    // Cherche la catégorie du support. Le bot la crée dans setupServer
    const categoryName = '╭─✦ 🛠️・CENTRE D\'ASSISTANCE TECHNIQUE';
    const category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === categoryName);

    // Rôle Gardien pour accès au ticket
    const guardianRole = guild.roles.cache.find(r => r.name === '🛡️ Gardiens Cosmiques');

    const overwrites = [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
    ];

    if (guardianRole) {
        overwrites.push({ id: guardianRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
    }

    try {
        const ticketChannel = await guild.channels.create({
            name: `ticket-${user.username.toLowerCase()}`,
            type: ChannelType.GuildText,
            parent: category ? category.id : undefined,
            permissionOverwrites: overwrites,
            reason: `Création de ticket par ${user.tag}`
        });

        const embed = new EmbedBuilder()
            .setColor('#7852FF')
            .setTitle(`🎫 Ticket d'assistance : ${user.username}`)
            .setDescription(`Bonjour <@${user.id}>,\n\nUn membre de l'équipe (Gardiens Cosmiques) vous répondra dès que possible.\nPour fermer ce ticket, utilisez le bouton ci-dessous.`)
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_close_ticket').setLabel('Fermer le ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
        );

        await ticketChannel.send({ content: `<@${user.id}>`, embeds: [embed], components: [row] });

        await interaction.reply({ content: `✅ Votre ticket a été créé : <#${ticketChannel.id}>`, ephemeral: true });

    } catch (error) {
        console.error('Erreur de création de ticket:', error);
        await interaction.reply({ content: '❌ Une erreur est survenue lors de la création de votre ticket.', ephemeral: true });
    }
}

export async function handleTicketClose(interaction) {
    // Vérification basique: est-ce un salon ticket ?
    if (!interaction.channel.name.startsWith('ticket-')) {
        return interaction.reply({ content: '❌ Cette commande ne peut être utilisée que dans un ticket.', ephemeral: true });
    }

    // On pourrait demander confirmation, mais on va supprimer directement
    await interaction.reply({ content: '🔒 Fermeture du ticket dans 5 secondes...' });

    setTimeout(() => {
        interaction.channel.delete().catch(() => {});
    }, 5000);
}
