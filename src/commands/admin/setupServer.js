import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType } from 'discord.js';
import { ensureRole, ensureCategory, ensureChannel, ensurePersistentMessage } from '../../utils/guildArchitect.js';

export default {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Déploiement ultra-complet du QG officiel Aetheris.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('server')
                .setDescription('Déploie les 10 catégories et 40 salons du Hub Aetheris.'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    async execute(interaction) {
        if (interaction.options.getSubcommand() !== 'server') return;

        // Restriction propriétaire optionnelle (ou admin confirmé par setDefaultMemberPermissions)
        // Note: process.env.OWNER_ID n'est pas forcément défini, mais s'il l'est, on vérifie.
        if (process.env.OWNER_ID && interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ content: '❌ Cette commande majestueuse est réservée au Créateur Suprême.', ephemeral: true });
        }

        // On répond de suite car le déploiement est long
        await interaction.reply({ content: '🚀 Initialisation de l\'Architecture d\'Aetheris en cours... Veuillez patienter.', ephemeral: true });

        const { guild } = interaction;

        try {
            // --- 1. RÔLES ---
            const rSupreme = await ensureRole(guild, { name: '👑 Architecte Suprême', color: '#7852FF', hoist: true, permissions: [PermissionFlagsBits.Administrator] });
            const rGardien = await ensureRole(guild, { name: '🛡️ Gardiens Cosmiques', color: '#00F0FF', hoist: true, permissions: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers, PermissionFlagsBits.ModerateMembers] });
            const rAlpha = await ensureRole(guild, { name: '🧪 Explorateurs Alpha', color: '#FF007A', hoist: true });
            const rCitoyen = await ensureRole(guild, { name: '💠 Citoyens d\'Aetheris', color: '#00FFA3', hoist: false });

            const rFactions = {
                pulsar: await ensureRole(guild, { name: '✧ Pulsar Vanguard', color: '#FF4500' }),
                nebula: await ensureRole(guild, { name: '✧ Nebula Syndicate', color: '#8A2BE2' }),
                eclipse: await ensureRole(guild, { name: '✧ Eclipse Core', color: '#2F4F4F' })
            };

            const rNotifs = {
                annonces: await ensureRole(guild, { name: '📢・Annonces Bot' }),
                updates: await ensureRole(guild, { name: '⚙️・Mises à Jour & Patches' }),
                status: await ensureRole(guild, { name: '🚨・Statut & Incidents API' }),
                events: await ensureRole(guild, { name: '🎮・Événements Spatiaux' })
            };

            // Permissions Overwrites de base
            const everyoneDenyView = { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] };
            const everyoneAllowView = { id: guild.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] };
            const citizenAllowChat = { id: rCitoyen.id, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel] };
            const staffAllowAll = { id: rGardien.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] };

            // --- 2. CATÉGORIES & SALONS ---
            const channelsMap = {};

            // CAT 1 : STATION D'ACCUEIL & EMBARQUEMENT
            const cat1 = await ensureCategory(guild, '╭─✦ 🌌・STATION D\'ACCUEIL & EMBARQUEMENT', [everyoneAllowView]);
            channelsMap['embarquement'] = await ensureChannel(guild, '├─✦ 🛸・embarquement', ChannelType.GuildText, cat1);
            channelsMap['charte'] = await ensureChannel(guild, '├─✦ 📜・charte-du-hub', ChannelType.GuildText, cat1);
            channelsMap['roles'] = await ensureChannel(guild, '├─✦ 🔮・sélection-des-rôles', ChannelType.GuildText, cat1);
            channelsMap['plan'] = await ensureChannel(guild, '╰─✦ 🗺️・plan-du-serveur', ChannelType.GuildText, cat1);

            // CAT 2 : TRANSMISSIONS & OBSERVATOIRE
            const cat2 = await ensureCategory(guild, '╭─✦ 📡・TRANSMISSIONS & OBSERVATOIRE', [everyoneAllowView]);
            channelsMap['annonces'] = await ensureChannel(guild, '├─✦ 📢・annonces-officielles', ChannelType.GuildText, cat2);
            channelsMap['maj'] = await ensureChannel(guild, '├─✦ ⚙️・mises-à-jour-bot', ChannelType.GuildText, cat2);
            channelsMap['uptime'] = await ensureChannel(guild, '├─✦ 📊・statut-uptime', ChannelType.GuildText, cat2);
            channelsMap['github'] = await ensureChannel(guild, '╰─✦ 🐙・flux-github', ChannelType.GuildText, cat2);

            // CAT 3 : DOCUMENTATION & MANUELS
            const cat3 = await ensureCategory(guild, '╭─✦ 📚・DOCUMENTATION & MANUELS', [everyoneAllowView]);
            channelsMap['guide'] = await ensureChannel(guild, '├─✦ 📖・guide-de-démarrage', ChannelType.GuildText, cat3);
            channelsMap['catalogue'] = await ensureChannel(guild, '├─✦ ⚡・catalogue-commandes', ChannelType.GuildText, cat3);
            channelsMap['doc_mod'] = await ensureChannel(guild, '├─✦ 🛡️・manuel-modération', ChannelType.GuildText, cat3);
            channelsMap['premium'] = await ensureChannel(guild, '╰─✦ 💎・avantages-premium', ChannelType.GuildText, cat3);

            // CAT 4 : ESPACE CITOYENS DU HUB
            const cat4 = await ensureCategory(guild, '╭─✦ 💬・ESPACE CITOYENS DU HUB', [everyoneDenyView, citizenAllowChat, staffAllowAll]);
            channelsMap['general'] = await ensureChannel(guild, '├─✦ 🪐・discussion-générale', ChannelType.GuildText, cat4);
            channelsMap['suggestions'] = await ensureChannel(guild, '├─✦ 💡・idées-et-suggestions', ChannelType.GuildText, cat4);
            channelsMap['showcase'] = await ensureChannel(guild, '├─✦ 📸・showcase-serveurs', ChannelType.GuildText, cat4);
            channelsMap['configs'] = await ensureChannel(guild, '╰─✦ 🤖・partage-de-configurations', ChannelType.GuildText, cat4);

            // CAT 5 : ZONE ARCADE & JEUX COSMIQUES
            const cat5 = await ensureCategory(guild, '╭─✦ 🎮・ZONE ARCADE & JEUX COSMIQUES', [everyoneDenyView, citizenAllowChat, staffAllowAll]);
            channelsMap['anomalies'] = await ensureChannel(guild, '├─✦ 🌌・anomalies-spatiales', ChannelType.GuildText, cat5);
            channelsMap['arcade'] = await ensureChannel(guild, '├─✦ 🎲・arcade-mini-jeux', ChannelType.GuildText, cat5);
            channelsMap['eco'] = await ensureChannel(guild, '├─✦ 🪙・économie-galactique', ChannelType.GuildText, cat5);
            channelsMap['leaderboard'] = await ensureChannel(guild, '╰─✦ 🏆・classement-mondial', ChannelType.GuildText, cat5);

            // CAT 6 : DÉMONSTRATION SÉCURITÉ
            const cat6 = await ensureCategory(guild, '╭─✦ 🛡️・DÉMONSTRATION SÉCURITÉ', [everyoneAllowView]);
            channelsMap['vitrine'] = await ensureChannel(guild, '├─✦ 🔒・vitrine-anti-raid', ChannelType.GuildText, cat6);
            channelsMap['exemples'] = await ensureChannel(guild, '├─✦ 📜・exemples-infractions', ChannelType.GuildText, cat6);
            channelsMap['nettoyage'] = await ensureChannel(guild, '├─✦ 🧹・nettoyage-purge', ChannelType.GuildText, cat6);
            channelsMap['simulateur'] = await ensureChannel(guild, '╰─✦ 📑・simulateur-de-droits', ChannelType.GuildText, cat6);

            // CAT 7 : LABORATOIRE & BAC À SABLE
            const cat7 = await ensureCategory(guild, '╭─✦ 🧪・LABORATOIRE & BAC À SABLE', [everyoneDenyView, { id: rAlpha.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }, staffAllowAll]);
            channelsMap['sandbox'] = await ensureChannel(guild, '├─✦ 🤖・sandbox-commandes', ChannelType.GuildText, cat7);
            channelsMap['test_mod'] = await ensureChannel(guild, '├─✦ 🎯・test-modération', ChannelType.GuildText, cat7);
            channelsMap['bugs'] = await ensureChannel(guild, '├─✦ 💥・reproduction-bugs', ChannelType.GuildText, cat7);
            channelsMap['logs'] = await ensureChannel(guild, '╰─✦ 📡・logs-aetheris', ChannelType.GuildText, cat7);

            // CAT 8 : CENTRE D'ASSISTANCE TECHNIQUE
            const cat8 = await ensureCategory(guild, '╭─✦ 🛠️・CENTRE D\'ASSISTANCE TECHNIQUE', [everyoneDenyView, { id: rCitoyen.id, allow: [PermissionFlagsBits.ViewChannel] }, staffAllowAll]);
            channelsMap['ticket'] = await ensureChannel(guild, '├─✦ 🎫・ouvrir-un-ticket', ChannelType.GuildText, cat8);
            channelsMap['faq'] = await ensureChannel(guild, '├─✦ ❓・faq-dépannage', ChannelType.GuildText, cat8);
            channelsMap['rapports'] = await ensureChannel(guild, '├─✦ 🐛・rapports-de-bugs', ChannelType.GuildText, cat8);
            channelsMap['retours'] = await ensureChannel(guild, '╰─✦ 💡・retours-expérience', ChannelType.GuildText, cat8);

            // CAT 9 : QG STRATÉGIQUE (STAFF)
            const cat9 = await ensureCategory(guild, '╭─✦ 🔒・QG STRATÉGIQUE (RÉSERVÉ STAFF)', [everyoneDenyView, staffAllowAll]);
            channelsMap['staff'] = await ensureChannel(guild, '├─✦ 🛡️・salon-des-gardiens', ChannelType.GuildText, cat9);
            channelsMap['telemetrie'] = await ensureChannel(guild, '├─✦ 📋・télémétrie-et-crashs', ChannelType.GuildText, cat9);
            channelsMap['lab_alpha'] = await ensureChannel(guild, '├─✦ 🚀・laboratoire-alpha', ChannelType.GuildText, cat9);
            channelsMap['db_maint'] = await ensureChannel(guild, '╰─✦ 🗄️・maintenance-base-sqlite', ChannelType.GuildText, cat9);

            // CAT 10 : SALONS VOCAUX
            const cat10 = await ensureCategory(guild, '╭─✦ 🔊・SALONS VOCAUX DU HUB', [everyoneDenyView, citizenAllowChat, staffAllowAll]);
            channelsMap['v_dev'] = await ensureChannel(guild, '├─✦ 🎙️・briefing-développeurs', ChannelType.GuildVoice, cat10);
            channelsMap['v_arcade'] = await ensureChannel(guild, '├─✦ 🎮・vocal-arcade', ChannelType.GuildVoice, cat10);
            channelsMap['v_support'] = await ensureChannel(guild, '├─✦ 🎧・support-vocal', ChannelType.GuildVoice, cat10);
            channelsMap['v_lounge'] = await ensureChannel(guild, '╰─✦ 🪐・lounge-cosmique', ChannelType.GuildVoice, cat10);


            // --- 3. AUTO-REMPLISSAGE DES PANNEAUX (Idempotent) ---

            // #embarquement
            const embedEmbarquement = new EmbedBuilder()
                .setColor('#7852FF')
                .setTitle('🚀 Bienvenue dans le Hub Aetheris !')
                .setDescription('**Aetheris** est un bot Discord moderne, modulaire et open-source conçu pour dynamiser et protéger vos communautés.\n\nCe Hub est le centre névralgique de son développement : vous y trouverez du support, des annonces, et des laboratoires pour tester ses fonctionnalités en avant-première.')
                .setThumbnail(interaction.client.user.displayAvatarURL());
            await ensurePersistentMessage(channelsMap['embarquement'], 'ID_EMBARQUEMENT', embedEmbarquement);

            // #charte-du-hub
            const embedCharte = new EmbedBuilder()
                .setColor('#00F0FF')
                .setTitle('📜 Charte du Hub')
                .setDescription('1. **Respect** : Aucun comportement toxique ne sera toléré.\n2. **Sécurité** : Pas de liens malveillants ni de spam.\n3. **Entraide** : Aidez les autres utilisateurs dans la section support.\n4. **Pertinence** : Utilisez les bons salons pour les bons sujets.\n5. **Autonomie** : Lisez la documentation avant d\'ouvrir un ticket.')
                .setFooter({ text: 'Acceptez le règlement pour devenir Citoyen.' });

            const btnCharte = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_accept_rules').setLabel('Accepter le règlement').setStyle(ButtonStyle.Success).setEmoji('✅')
            );
            await ensurePersistentMessage(channelsMap['charte'], 'ID_CHARTE', embedCharte, [btnCharte]);

            // #sélection-des-rôles
            const embedRoles = new EmbedBuilder()
                .setColor('#FF007A')
                .setTitle('🔮 Centre de Personnalisation')
                .setDescription('Sélectionnez votre Faction et vos alertes ci-dessous pour personnaliser votre expérience dans le Hub.');

            const selectFaction = new StringSelectMenuBuilder()
                .setCustomId('select_faction')
                .setPlaceholder('Sélectionnez une Faction...')
                .addOptions(
                    { label: 'Pulsar Vanguard', value: rFactions.pulsar.id, description: 'Compétition & Arcade', emoji: '⚔️' },
                    { label: 'Nebula Syndicate', value: rFactions.nebula.id, description: 'Mystères & Anomalies', emoji: '🌌' },
                    { label: 'Eclipse Core', value: rFactions.eclipse.id, description: 'Sécurité & Architecture', emoji: '🌑' }
                );

            const rowFaction = new ActionRowBuilder().addComponents(selectFaction);

            const rowNotifs = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`btn_notif_${rNotifs.annonces.id}`).setLabel('Annonces').setStyle(ButtonStyle.Secondary).setEmoji('📢'),
                new ButtonBuilder().setCustomId(`btn_notif_${rNotifs.updates.id}`).setLabel('Mises à Jour').setStyle(ButtonStyle.Secondary).setEmoji('⚙️'),
                new ButtonBuilder().setCustomId(`btn_notif_${rNotifs.status.id}`).setLabel('Statut API').setStyle(ButtonStyle.Secondary).setEmoji('🚨'),
                new ButtonBuilder().setCustomId(`btn_notif_${rNotifs.events.id}`).setLabel('Événements').setStyle(ButtonStyle.Secondary).setEmoji('🎮')
            );

            await ensurePersistentMessage(channelsMap['roles'], 'ID_ROLES', embedRoles, [rowFaction, rowNotifs]);

            // #plan-du-serveur
            let planDesc = '';
            for (const key in channelsMap) {
                if (channelsMap[key].type !== ChannelType.GuildVoice) {
                     planDesc += `<#${channelsMap[key].id}> \n`;
                }
            }
            const embedPlan = new EmbedBuilder()
                .setColor('#00FFA3')
                .setTitle('🗺️ Plan du Serveur')
                .setDescription(planDesc.slice(0, 4000)); // Discord limit
            await ensurePersistentMessage(channelsMap['plan'], 'ID_PLAN', embedPlan);

            // #ouvrir-un-ticket
            const embedTicket = new EmbedBuilder()
                .setColor('#7852FF')
                .setTitle('🎫 Assistance Technique')
                .setDescription('Besoin d\'aide avec Aetheris ? Cliquez sur le bouton ci-dessous pour ouvrir un ticket privé avec les Gardiens Cosmiques.');
            const btnTicket = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_open_ticket').setLabel('Ouvrir un ticket').setStyle(ButtonStyle.Primary).setEmoji('📩')
            );
            await ensurePersistentMessage(channelsMap['ticket'], 'ID_TICKET', embedTicket, [btnTicket]);

            // Catalogue de commandes dynamique
            const commands = Array.from(interaction.client.commands.values());
            let catDesc = '';
            for (const cmd of commands) {
                catDesc += `**/${cmd.data.name}** : ${cmd.data.description}\n`;
            }
            const embedCat = new EmbedBuilder()
                .setColor('#7852FF')
                .setTitle('⚡ Catalogue des Commandes')
                .setDescription(catDesc || 'Aucune commande chargée.');
            await ensurePersistentMessage(channelsMap['catalogue'], 'ID_CATALOGUE', embedCat);


            // Création du Webhook GitHub
            let webhookUrl = '*(Webhook non créé)*';
            try {
                const webhooks = await channelsMap['github'].fetchWebhooks();
                let githubWebhook = webhooks.find(wh => wh.name === 'Aetheris GitHub Bridge');
                if (!githubWebhook) {
                    githubWebhook = await channelsMap['github'].createWebhook({
                        name: 'Aetheris GitHub Bridge',
                        avatar: interaction.client.user.displayAvatarURL(),
                    });
                }
                webhookUrl = githubWebhook.url;
            } catch (err) {
                console.error('Erreur webhook', err);
            }

            await interaction.editReply({
                content: `✅ **Déploiement Terminé avec succès !**\n\n40 salons, 10 catégories et tous les rôles ont été configurés ou mis à jour.\nLes panneaux interactifs sont en ligne.\n\n🔗 **Webhook GitHub Bridge** :\n\`${webhookUrl}\``
            });

        } catch (error) {
            console.error('Erreur critique durant le setup:', error);
            await interaction.editReply({ content: '❌ Une erreur critique est survenue durant le déploiement. Consultez les logs (télémétrie).' });
        }
    }
};
