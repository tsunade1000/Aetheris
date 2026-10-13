import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Chargement des variables d'environnement
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
const foldersPath = path.join(__dirname, 'commands');

if (fs.existsSync(foldersPath)) {
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        if (fs.statSync(commandsPath).isDirectory()) {
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const { default: command } = await import(pathToFileURL(filePath).href);

                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                } else {
                    console.log(`[AVERTISSEMENT] La commande à ${filePath} manque d'une propriété "data" ou "execute" requise.`);
                }
            }
        }
    }
}

// Initialisation de l'instance REST
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Déploiement des commandes
(async () => {
    try {
        console.log(`Début du rafraîchissement de ${commands.length} commandes (/) d'application.`);

        // La route Routes.applicationGuildCommands() permet un déploiement ciblé sur un serveur de test (plus rapide).
        // Pour un déploiement global, utilisez Routes.applicationCommands(process.env.CLIENT_ID)
        let data;
        if (process.env.GUILD_ID) {
            data = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands },
            );
            console.log(`Déploiement ciblé réussi : ${data.length} commandes (/) rechargées sur le serveur ${process.env.GUILD_ID}.`);
        } else {
            data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );
            console.log(`Déploiement global réussi : ${data.length} commandes (/) rechargées.`);
        }
    } catch (error) {
        console.error(error);
    }
})();
