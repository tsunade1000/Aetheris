import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Création automatique du répertoire data/ s'il n'existe pas
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'aetheris.db');
const db = new Database(dbPath);

// Configuration recommandée pour des performances optimales (WAL et clés étrangères)
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Création de la table des configurations de serveurs
db.exec(`
    CREATE TABLE IF NOT EXISTS guild_configs (
        guild_id TEXT PRIMARY KEY,
        log_channel_id TEXT,
        welcome_channel_id TEXT,
        autorole_id TEXT,
        premium_tier INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// Création de la table des infractions
db.exec(`
    CREATE TABLE IF NOT EXISTS infractions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        reason TEXT DEFAULT 'Aucune raison spécifiée',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (guild_id) REFERENCES guild_configs(guild_id) ON DELETE CASCADE
    );
`);

// Préparation et mise en cache des requêtes fréquentes
const statements = {
    getConfig: db.prepare('SELECT * FROM guild_configs WHERE guild_id = ?'),
    setConfig: db.prepare(`
        INSERT INTO guild_configs (guild_id, log_channel_id, welcome_channel_id, autorole_id)
        VALUES (@guild_id, @log_channel_id, @welcome_channel_id, @autorole_id)
        ON CONFLICT(guild_id) DO UPDATE SET
            log_channel_id = excluded.log_channel_id,
            welcome_channel_id = excluded.welcome_channel_id,
            autorole_id = excluded.autorole_id,
            updated_at = CURRENT_TIMESTAMP
    `),
    addInfraction: db.prepare(`
        INSERT INTO infractions (guild_id, user_id, moderator_id, action_type, reason)
        VALUES (@guild_id, @user_id, @moderator_id, @action_type, @reason)
    `),
    getUserInfractions: db.prepare(`
        SELECT * FROM infractions
        WHERE guild_id = ? AND user_id = ?
        ORDER BY created_at DESC
    `),
    clearUserInfractions: db.prepare(`
        DELETE FROM infractions
        WHERE guild_id = ? AND user_id = ?
    `)
};

// Fonction utilitaire pour s'assurer que la config existe avant d'ajouter une infraction
function logInfraction({ guild_id, user_id, moderator_id, action_type, reason }) {
    const config = statements.getConfig.get(guild_id);
    if (!config) {
         statements.setConfig.run({
            guild_id,
            log_channel_id: null,
            welcome_channel_id: null,
            autorole_id: null
        });
    }

    statements.addInfraction.run({ guild_id, user_id, moderator_id, action_type, reason });
}

export { db, statements, logInfraction, dbPath };
