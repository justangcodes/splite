const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class JoinVotingSettingsCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'joinvoting-group',
            description: 'Join Vote management - New members will be subject to a vote to join the server',
            type: client.types.ADMIN,
            userPermissions: ['ManageGuild'],
            slashCommand: new SlashCommandBuilder().setName('joinvoting')
                .addSubcommand((o) => o.setName('configure').setDescription('Configure the join voting settings')
                    .addStringOption(p => p.setName('message-id').setRequired(false).setDescription('ID of the message which the user must react to to join the server'))
                    .addChannelOption(p => p.setName('channel').setRequired(false).setDescription('The channel to send the message to. To view current channel, don\'t provide this option'))
                    .addStringOption(p => p.setName('emoji').setRequired(false).setDescription('The emoji to use for the vote. To view current emoji, don\'t provide this option')))
                .addSubcommand((o) => o.setName('clear').setDescription('Clear the current admin role')),
            subCommandMappings: {
                configure: 'setjoinvoting',
                clear: 'clearjoinvoting',
            },
        });
    }
};
