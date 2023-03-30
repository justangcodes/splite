const Command = require('../Command.js');
const { EmbedBuilder, ChannelType } = require('discord.js');
const moment = require('moment');
const { voice } = require('../../utils/emojis.json');
const { oneLine, stripIndent } = require('common-tags');

module.exports = class ChannelInfoCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'channelinfo',
            aliases: ['channel', 'ci'],
            usage: 'channelinfo [channel mention/ID]',
            description: oneLine`
        Fetches information about the provided channel. 
        If no channel is given, the current channel will be used.
      `,
            type: client.types.INFO,
            examples: ['channelinfo #general']
        });
    }

    run(message, args) {
        let channel =
            this.getChannelFromMention(message, args[0]) ||
            message.guild.channels.cache.get(args[0]);
        if (channel) {
            args.shift();
        }
        else channel = message.channel;
        this.handle(channel, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        this.handle(channel, interaction, true);
    }

    handle(channel, context) {
        const embed = new EmbedBuilder()
            .setTitle('Channel Information')
            .setThumbnail(context.guild.iconURL({ dynamic: true }))
            .addFields([{ name: 'Channel', value: channel.toString(), inline: true }])
            .addFields([{ name: 'ID', value: `\`${channel.id}\``, inline: true }])
            .addFields([{ name: 'Type', value: `\`${channel.type}\``, inline: true }])
            .addFields([{ name: 'Members', value: `\`${channel.members.size}\``, inline: true }])
            .addFields([{
                name: 'Bots',
                value: `\`${
                    [...channel.members.values()].filter((b) => b.user.bot).length
                }\``,
                inline: true
            }])
            .addFields([{
                name: 'Created On',
                value: `\`${moment(channel.createdAt).format('MMM DD YYYY')}\``,
                inline: true
            }])
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author)
            })
            .setTimestamp();

        if (channel.type === ChannelType.GuildText) {
            embed // Text embed
                .spliceFields(3, 0, {
                    name: 'Slowmode',
                    value: `\`${channel.rateLimitPerUser}\``,
                    inline: true
                })
                .spliceFields(6, 0, {
                    name: 'NSFW',
                    value: `\`${channel.nsfw}\``,
                    inline: true
                });
        }
        else if (channel.type === ChannelType.GuildNews) {
            embed // News embed
                .spliceFields(6, 0, {
                    name: 'NSFW',
                    value: `\`${channel.nsfw}\``,
                    inline: true
                });
        }
        else if (channel.type === ChannelType.GuildVoice) {
            embed // Voice embed
                .spliceFields(0, 1, {
                    name: 'Channel',
                    value: `${voice} ${channel.name}`,
                    inline: true
                })
                .spliceFields(5, 0, {
                    name: 'User Limit',
                    value: `\`${channel.userLimit}\``,
                    inline: true
                })
                .spliceFields(6, 0, {
                    name: 'Full',
                    value: `\`${channel.full}\``,
                    inline: true
                });
            const members = [channel.members.values()];
            if (members.length > 0)
                embed.addFields([{
                    name: 'Members Joined',
                    value: this.client.utils.trimArray([...channel.members.values()]).join(' ')
                }]);
        }
        else {
            const payload = stripIndent`
      Please enter mention a valid text or announcement channel` +
                ' or provide a valid text, announcement, or voice channel ID';

            this.sendReply(context, payload);
        }
        if (channel.topic) embed.addFields([{ name: 'Topic', value: channel.topic }]);

        const payload = { embeds: [embed] };
        this.sendReply(context, payload);
    }
};
