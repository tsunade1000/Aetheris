import { Client, Collection, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { initializeTelemetry } from './services/errorTelemetry.js';

// Chargement des variables d'environnement
dotenv.config();

// Configuration des chemins pour ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialisation du client avec les Intents nécessaires
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

// Initialisation de la collection pour stocker les commandes
client.commands = new Collection();

// -- CHARGEMENT DYNAMIQUE DES COMMANDES --
const foldersPath = path.join(__dirname, 'commands');
// Vérification si le dossier commands existe
if (fs.existsSync(foldersPath)) {
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        if (fs.statSync(commandsPath).isDirectory()) {
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                // Utilisation de l'import dynamique pour les modules ES
                const { default: command } = await import(pathToFileURL(filePath).href);

                // Vérifie que la commande possède bien 'data' et 'execute'
                if ('data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                } else {
                    console.log(`[AVERTISSEMENT] La commande à ${filePath} manque d'une propriété "data" ou "execute" requise.`);
                }
            }
        }
    }
}

// -- CHARGEMENT DYNAMIQUE DES ÉVÉNEMENTS --
const eventsPath = path.join(__dirname, 'events');
// Vérification si le dossier events existe
if (fs.existsSync(eventsPath)) {
    const eventFolders = fs.readdirSync(eventsPath);

    for (const folder of eventFolders) {
        const folderPath = path.join(eventsPath, folder);
        if (fs.statSync(folderPath).isDirectory()) {
            const eventFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
            for (const file of eventFiles) {
                const filePath = path.join(folderPath, file);
                const { default: event } = await import(pathToFileURL(filePath).href);

                if (event.once) {
                    client.once(event.name, (...args) => event.execute(...args));
                } else {
                    client.on(event.name, (...args) => event.execute(...args));
                }
            }
        }
    }
}

// Initialisation globale de la télémétrie des erreurs
initializeTelemetry(client);

// Connexion du bot à Discord
client.login(process.env.DISCORD_TOKEN);
