import { Events } from 'discord.js';
import { handleTicketCreate, handleTicketClose } from '../../services/ticketSystem.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isButton()) {
            return await handleButton(interaction);
        }

        if (interaction.isStringSelectMenu()) {
            return await handleSelectMenu(interaction);
        }

        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`[ERREUR] Aucune commande correspondant à ${interaction.commandName} n'a été trouvée.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            if (error.code === 50013) {
                // Ignore silencieusement les erreurs de permissions manquantes
                return;
            }
            console.error(`[ERREUR] Erreur lors de l'exécution de la commande ${interaction.commandName}:`);
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Une erreur est survenue lors de l\'exécution de cette commande !', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Une erreur est survenue lors de l\'exécution de cette commande !', ephemeral: true });
            }
        }
    },
};

// -- ROUTEUR BOUTONS --
async function handleButton(interaction) {
    const { customId, member } = interaction;

    if (customId === 'btn_accept_rules') {
        const citizenRole = interaction.guild.roles.cache.find(r => r.name === '💠 Citoyens d\'Aetheris');
        if (!citizenRole) return interaction.reply({ content: '❌ Rôle introuvable. Veuillez contacter un administrateur.', ephemeral: true });

        if (member.roles.cache.has(citizenRole.id)) {
            return interaction.reply({ content: 'Vous êtes déjà Citoyen d\'Aetheris !', ephemeral: true });
        }
        await member.roles.add(citizenRole);
        return interaction.reply({ content: '✅ Vous avez accepté la charte. Bienvenue Citoyen !', ephemeral: true });
    }

    if (customId.startsWith('btn_notif_')) {
        const roleId = customId.replace('btn_notif_', '');
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) return interaction.reply({ content: '❌ Rôle introuvable.', ephemeral: true });

        if (member.roles.cache.has(roleId)) {
            await member.roles.remove(roleId);
            return interaction.reply({ content: `Notification **${role.name}** désactivée.`, ephemeral: true });
        } else {
            await member.roles.add(roleId);
            return interaction.reply({ content: `Notification **${role.name}** activée.`, ephemeral: true });
        }
    }

    if (customId === 'btn_open_ticket') {
        return handleTicketCreate(interaction);
    }

    if (customId === 'btn_close_ticket') {
        return handleTicketClose(interaction);
    }

    if (customId === 'btn_anomaly_capture' || customId === 'btn_anomaly_channel') {
        // Logique simplifiée pour les anomalies : le premier qui clique désactive les boutons
        const action = customId === 'btn_anomaly_capture' ? 'capturé la brèche' : 'canalisé l\'énergie';
        await interaction.update({ components: [] });
        return interaction.channel.send(`🎉 **${interaction.user.tag}** a ${action} avec succès et stabilisé l'anomalie spatiale !`);
    }
}

// -- ROUTEUR MENUS DÉROULANTS --
async function handleSelectMenu(interaction) {
    const { customId, member } = interaction;

    if (customId === 'select_faction') {
        const roleId = interaction.values[0];
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) return interaction.reply({ content: '❌ Rôle de faction introuvable.', ephemeral: true });

        // Identifie les autres rôles de faction (ceux qui ont l'étoile ✧)
        const factionRoles = interaction.guild.roles.cache.filter(r => r.name.startsWith('✧ '));

        // Retire les anciennes factions
        for (const [id, fRole] of factionRoles) {
            if (member.roles.cache.has(id) && id !== roleId) {
                await member.roles.remove(id);
            }
        }

        await member.roles.add(roleId);
        return interaction.reply({ content: `✅ Vous avez rejoint la faction **${role.name}** !`, ephemeral: true });
    }
}
