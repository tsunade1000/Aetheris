import { ChannelType } from 'discord.js';

/**
 * Moteur d'architecture pour le déploiement idempotent d'Aetheris.
 */

export async function ensureRole(guild, options) {
    const existingRoles = await guild.roles.fetch();
    const role = existingRoles.find(r => r.name === options.name);

    if (role) {
        // Met à jour si nécessaire
        await role.edit({
            color: options.color || role.color,
            permissions: options.permissions !== undefined ? options.permissions : role.permissions,
            hoist: options.hoist !== undefined ? options.hoist : role.hoist,
            mentionable: options.mentionable !== undefined ? options.mentionable : role.mentionable,
        });
        return role;
    }

    return await guild.roles.create({
        name: options.name,
        color: options.color,
        permissions: options.permissions,
        hoist: options.hoist,
        mentionable: options.mentionable,
        reason: 'Setup Aetheris : Création automatique du rôle.'
    });
}

export async function ensureCategory(guild, name, overwrites = []) {
    const channels = await guild.channels.fetch();
    const category = channels.find(c => c.type === ChannelType.GuildCategory && c.name === name);

    if (category) {
        // On pourrait mettre à jour les overwrites ici, mais on se contente de le retourner pour la simplicité
        return category;
    }

    return await guild.channels.create({
        name: name,
        type: ChannelType.GuildCategory,
        permissionOverwrites: overwrites,
        reason: 'Setup Aetheris : Création automatique de la catégorie.'
    });
}

export async function ensureChannel(guild, name, type, parent, overwrites = [], topic = '') {
    const channels = await guild.channels.fetch();

    // Discord remplace les espaces par des tirets dans les noms des salons textuels
    const expectedName = type === ChannelType.GuildText ? name.replace(/ /g, '-') : name;

    const channel = channels.find(c => c.type === type && c.name === expectedName && c.parentId === (parent ? parent.id : null));

    if (channel) {
        await channel.edit({ topic: topic });
        await channel.lockPermissions().catch(() => {});
        return channel;
    }

    const newChannel = await guild.channels.create({
        name: name,
        type: type,
        parent: parent ? parent.id : undefined,
        permissionOverwrites: overwrites,
        topic: topic,
        reason: 'Setup Aetheris : Création automatique du salon.'
    });

    if (parent) {
        await newChannel.lockPermissions().catch(() => {});
    }

    return newChannel;
}

export async function ensurePersistentMessage(channel, identifierKey, embedPayload, components = []) {
    if (!channel) return;

    const messages = await channel.messages.fetch({ limit: 50 }).catch(() => null);
    if (!messages) return;

    // Recherche via le footer text qui contient l'identifiant caché ou textuel
    const existingMessage = messages.find(m =>
        m.author.id === channel.client.user.id &&
        m.embeds.length > 0 &&
        m.embeds[0].footer &&
        m.embeds[0].footer.text.includes(identifierKey)
    );

    // On s'assure que le footer contient l'identifierKey (utilisation de data pour les EmbedBuilder)
    const currentFooter = embedPayload.data.footer?.text || 'Aetheris';
    embedPayload.setFooter({ text: `${currentFooter} | ${identifierKey}` });

    if (existingMessage) {
        await existingMessage.edit({ embeds: [embedPayload], components: components }).catch(console.error);
        return existingMessage;
    }

    return await channel.send({ embeds: [embedPayload], components: components }).catch(console.error);
}
