const Command = require('../Command.js');
const ButtonMenu = require('../ButtonMenu.js');
const {EmbedBuilder} = require('discord.js');

module.exports = class EmojisCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'emojis',
            aliases: ['e'],
            usage: 'emojis',
            description: 'Displays a list of all current emojis.',
            type: client.types.INFO,
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
        const emojis = [];
        context.guild.emojis.cache.forEach((e) =>
            emojis.push(`${e} **-** \`:${e.name}:\``)
        );

        const embed = new EmbedBuilder()
            .setTitle(`Emoji List [${context.guild.emojis.cache.size}]`)
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        const interval = 25;
        if (emojis.length === 0) {
            const payload = {embeds: [embed.setDescription('No emojis found. 😢')]};
            this.sendReply(context, payload);
        }
        else if (emojis.length <= interval) {
            const range = emojis.length == 1 ? '[1]' : `[1 - ${emojis.length}]`;

            const payload = {
                embeds: [
                    embed
                        .setTitle(`Emoji List ${range}`)
                        .setDescription(emojis.join('\n'))
                        .setThumbnail(context.guild.iconURL({dynamic: true})),
                ]
            };
            this.sendReply(context, payload);

        }
        else {
            embed
                .setTitle('Emoji List')
                .setThumbnail(context.guild.iconURL({dynamic: true}))
                .setFooter({
                    text:
                        'Expires after two minutes.\n' + this.getUserIdentifier(context.author),
                    iconURL: this.getAvatarURL(context.author),
                });

            new ButtonMenu(
                this.client,
                context.channel,
                context.member,
                embed,
                emojis,
                interval
            );
        }
    }
};
