const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class clearMessageEditLogCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearmessageeditlog',
            aliases: ['clearmsgeditlog', 'clearmel', 'cmel'],
            usage: 'clearmessageeditlog',
            description: oneLine`
        Clears the message edit log text channel for your server. 
      `,
            type: client.types.ADMIN,
            userPermissions: ['ManageGuild'],
            examples: ['clearmessageeditlog'],
        });
    }

    run(message) {
        this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction, true);
    }

    handle(context) {
        const messageEditLogId = this.client.db.settings.selectMessageEditLogId
            .pluck()
            .get(context.guild.id);
        const oldMessageEditLog =
            context.guild.channels.cache.get(messageEditLogId) || '`None`';
        const embed = new EmbedBuilder()
            .setTitle('Settings: `Logging`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setDescription(
                `The \`message edit log\` was successfully cleared. ${success}`
            )
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        // Clear if no args provided
        this.client.db.settings.updateMessageEditLogId.run(
            null,
            context.guild.id
        );

        const payload = {
            embeds: [
                embed.addFields({
                    name: 'Message Edit Log',
                    value: `${oldMessageEditLog} ➔ \`None\``
                }),
            ],
        };

        this.sendReply(context, payload);
    }
};
