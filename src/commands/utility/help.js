import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Affiche le menu d\'aide interactif d\'Aetheris.'),

    async execute(interaction) {
        // Embed par défaut (Accueil)
        const embed = new EmbedBuilder()
            .setColor('#7852FF')
            .setTitle('Aetheris | Menu d\'aide')
            .setDescription('Bienvenue dans le menu d\'aide d\'Aetheris !\nUtilisez le menu déroulant ci-dessous pour explorer les différentes catégories de commandes.')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: 'Aetheris', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        // Menu déroulant
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_menu')
            .setPlaceholder('Sélectionnez une catégorie...')
            .addOptions(
                { label: 'Accueil', description: 'Retourner au menu principal.', value: 'home', emoji: '🏠' },
                { label: 'Modération', description: 'Commandes pour gérer les membres et messages.', value: 'moderation', emoji: '🛡️' },
                { label: 'Administration', description: 'Configuration du bot et du serveur.', value: 'admin', emoji: '⚙️' },
                { label: 'Utilitaires', description: 'Commandes informatives et outils divers.', value: 'utility', emoji: '⚡' }
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        // Envoi du message initial
        const response = await interaction.reply({ embeds: [embed], components: [row] });

        // Création du Collector (durée : 5 minutes)
        const collector = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 300000 });

        collector.on('collect', async i => {
            // Vérifier que seul l'utilisateur ayant lancé la commande peut interagir
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: '❌ Vous ne pouvez pas utiliser ce menu. Tapez `/help` pour ouvrir le vôtre.', ephemeral: true });
            }

            const choice = i.values[0];
            const updatedEmbed = new EmbedBuilder()
                .setColor('#7852FF')
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .setFooter({ text: 'Aetheris', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            switch (choice) {
                case 'home':
                    updatedEmbed.setTitle('Aetheris | Menu d\'aide');
                    updatedEmbed.setDescription('Bienvenue dans le menu d\'aide d\'Aetheris !\nUtilisez le menu déroulant ci-dessous pour explorer les différentes catégories de commandes.');
                    break;
                case 'moderation':
                    updatedEmbed.setTitle('🛡️ Modération');
                    updatedEmbed.setDescription(
                        `**/warn** \`<membre> <raison>\` : Avertit un membre.\n` +
                        `**/timeout** \`<membre> <durée> [raison]\` : Exclut temporairement un membre.\n` +
                        `**/kick** \`<membre> [raison]\` : Expulse un membre du serveur.\n` +
                        `**/ban** \`<membre> [raison]\` : Bannit un membre du serveur.\n` +
                        `**/purge** \`<montant> [cible]\` : Supprime des messages en masse.\n` +
                        `**/infractions view** \`<membre>\` : Affiche le dossier disciplinaire.\n` +
                        `**/infractions clear** \`<membre>\` : Purge le dossier (Admin).`
                    );
                    break;
                case 'admin':
                    updatedEmbed.setTitle('⚙️ Administration');
                    updatedEmbed.setDescription(
                        `**/config view** : Affiche la configuration du serveur.\n` +
                        `**/config logs** \`[salon]\` : Configure les journaux d'audit.\n` +
                        `**/config welcome** \`[salon]\` : Configure le salon de bienvenue.\n` +
                        `**/config autorole** \`[rôle]\` : Configure le rôle donné à l'arrivée.`
                    );
                    break;
                case 'utility':
                    updatedEmbed.setTitle('⚡ Utilitaires');
                    updatedEmbed.setDescription(
                        `**/help** : Affiche ce menu interactif.\n` +
                        `**/ping** : Affiche la latence du bot.\n` +
                        `**/botinfo** : Affiche les statistiques détaillées du système.\n` +
                        `**/serverinfo** : Affiche les informations clés du serveur.`
                    );
                    break;
            }

            // Met à jour le message d'origine avec le nouvel Embed
            await i.update({ embeds: [updatedEmbed], components: [row] });
        });

        collector.on('end', async () => {
            // Désactiver le menu après 5 minutes
            const disabledMenu = new StringSelectMenuBuilder(selectMenu.toJSON()).setDisabled(true);
            const disabledRow = new ActionRowBuilder().addComponents(disabledMenu);
            // Catch error in case message was deleted
            await interaction.editReply({ components: [disabledRow] }).catch(() => {});
        });
    }
};
