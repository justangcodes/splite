const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success} = require('../../utils/emojis.json');

module.exports = class clearPrefixCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearprefix',
            aliases: ['clearp', 'cp', 'resetprefix'],
            usage: 'clearprefix',
            description: 'Resets the `prefix` for your server to the default ' + client.config.defaultPrefix,
            type: client.types.ADMIN,
            userPermissions: ['ManageGuild'],
            examples: ['clearprefix'],
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
        const oldPrefix = this.client.db.settings.selectPrefix
            .pluck()
            .get(context.guild.id);
        const defaultPrefix = this.client.config.defaultPrefix;

        this.client.db.settings.updatePrefix.run(
            defaultPrefix,
            context.guild.id
        );

        // Set Nickname to include prefix
        // context.guild.members.me.setNickname(
        //     `[${this.client.db.settings.selectPrefix
        //         .pluck()
        //         .get(context.guild.id)}] ${this.client.name}`
        // );

        const payload = {
            embeds: [new EmbedBuilder()
                .setTitle('Settings: `System`')
                .setThumbnail(context.guild.iconURL({dynamic: true}))
                .setDescription(`The \`prefix\` was successfully reset. ${success}`)
                .addFields([{name: 'Prefix', value: `\`${oldPrefix}\` ➔ \`${defaultPrefix}\``}])
                .setFooter({
                    text: this.getUserIdentifier(context.author),
                    iconURL: this.getAvatarURL(context.author),
                })
                .setTimestamp()]
        };

        this.sendReply(context, payload);
    }
};
