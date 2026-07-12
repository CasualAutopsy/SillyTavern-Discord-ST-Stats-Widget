import bodyParser from 'body-parser';
import { Router } from 'express';
import { Chalk } from 'chalk';

interface PluginInfo {
    id: string;
    name: string;
    description: string;
}

interface Plugin {
    init: (router: Router) => Promise<void>;
    exit: () => Promise<void>;
    info: PluginInfo;
}

const chalk = new Chalk();
const MODULE_NAME = '[SillyTavern-Discord-ST-Stats-Widget]';

/**
 * Initialize the plugin.
 * @param router Express Router
 */
export async function init(router: Router): Promise<void> {
    const jsonParser = bodyParser.json();

    router.post('/update', jsonParser, async (req, res) => {
        try {
            const secrets = await import(/* webpackIgnore: true */'../secrets.json');
            const response = await fetch(`https://discord.com/api/v9/applications/${secrets.appID}/users/${secrets.userID}/identities/0/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bot ' + secrets.botToken,
                    'User-Agent': 'DiscordBot (https://github.com/discord/discord-api-docs, 1.0.0)',
                },
                body: JSON.stringify(req.body),
            });

            if (!response.ok) {
                console.error(chalk.red(MODULE_NAME), 'Request failed', response.status, response.statusText);
                return res.status(response.status).send(response.statusText);
            }

            return res.json({ message: 'Widget Update Successful' });
        } catch (error) {
            console.error(chalk.red(MODULE_NAME), 'Request failed', error);
            return res.status(500).send('Internal Server Error');
        }
    });

    console.log(chalk.green(MODULE_NAME), 'Plugin loaded!');
}

export async function exit(): Promise<void> {
    console.log(chalk.yellow(MODULE_NAME), 'Plugin exited');
}

export const info: PluginInfo = {
    id: 'discord-stats',
    name: 'Discord Stats Widget Plugin',
    description: 'A plugin for updating custom SillyTavern stats widgets for Discord.',
};

const plugin: Plugin = {
    init,
    exit,
    info,
};

export default plugin;
