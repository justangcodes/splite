const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class AutoRoleSettingsCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'autorole-group',
            description: 'Auto Role management - the auto role is a role that is automatically assigned to a user when they join the server',
            type: client.types.ADMIN,
            userPermissions: ['ManageGuild'],
            slashCommand: new SlashCommandBuilder().setName('autorole')
                .addSubcommand((o) => o.setName('set').setDescription('Set the auto role - To view current role, don\'t provide a role')
                    .addRoleOption(p => p.setName('role').setRequired(false).setDescription('The role to give users when they join. To view current role, don\'t provide this option')))
                .addSubcommand((o) => o.setName('clear').setDescription('Clear the current admin role')),
            subCommandMappings: {
                set: 'setautorole',
                clear: 'clearautorole',
            }
        });
    }
};
