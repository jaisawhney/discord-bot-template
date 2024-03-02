import { REST, Routes } from 'discord.js';

import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { readdirSync } from 'node:fs';

import chalk from 'chalk';
import type { ClientInterface } from '../discord';


const __dirname = dirname(fileURLToPath(import.meta.url));

const registerEvents = async (client: ClientInterface) => {
    const eventsPath = join(__dirname, '../events');
    const files = readdirSync(eventsPath)
        .filter(file => file.endsWith('js') || file.endsWith('ts'));

    for (const file of files) {
        const event = (await import(`../events/${file}`));

        if (event.once) {
            client.once(event.type, (...args) => event.execute(...args));
        } else {
            client.on(event.type, (...args) => event.execute(...args));
        }
    }
};

const registerCommands = async (client: ClientInterface) => {
    const commands = [];

    const commandsPath = join(__dirname, '../events/commands');
    const files = readdirSync(commandsPath)
        .filter(file => file.endsWith('js') || file.endsWith('ts'));

    for (const file of files) {
        const command = (await import(`../events/commands/${file}`));
        client.commands.set(command.builder.name, command);
        commands.push(command.builder.toJSON()!);
    }

    if (process.env.DEPLOY_SLASH_COMMANDS! == 'true') {
        deployCommands(commands);
    }
};

const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
const deployCommands = async (commands: object[]) => {
    console.log('Deploying commands');
    const data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID!),
        { body: commands },
    ) as [];
    console.log(chalk.green(`Deployed ${data.length} commands!`));
};

export { registerEvents, registerCommands };