const Command = require('../Command.js');
const {EmbedBuilder, ChannelType} = require('discord.js');
const {success} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');
const emojis = require('../../utils/emojis.json');

module.exports = class SetCrownChannelCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setcrownchannel',
            aliases: ['setcc', 'scc'],
            usage: 'setcrownchannel <channel mention/ID>',
            description: oneLine`
        Sets the crown message text channel for your server. 
        \nUse \`clearcrownchannel\` to clear the current \`crown channel\`.
        A \`crown message\` will only be sent if a \`crown channel\`, and \`crown role\` are both set.
      `,
            type: client.types.ADMIN,
            userPermissions: ['ManageGuild'],
            examples: ['setcrownchannel #general', 'clearcrownchannel'],
        });
    }


    run(message, args) {
        this.handle(args.join(' '), message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const channel = interaction.options.getChannel('channel');
        this.handle(channel, interaction, true);
    }

    handle(channel, context, isInteraction) {
        let {
            crown_role_id: crownRoleId,
            crown_channel_id: crownChannelId,
            crown_message: crownMessage,
            crown_schedule: crownSchedule,
        } = this.client.db.settings.selectCrown.get(context.guild.id);

        const crownRole = context.guild.roles.cache.get(crownRoleId);
        const oldCrownChannel = context.guild.channels.cache.get(crownChannelId) || '`None`';

        // Get status
        const oldStatus = this.client.utils.getStatus(crownRoleId, crownChannelId);

        // Trim message
        if (crownMessage && crownMessage.length > 1024) crownMessage = crownMessage.slice(0, 1021) + '...';

        const embed = new EmbedBuilder()
            .setTitle('Settings: `Crown`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .addFields([{name: 'Role', value: crownRole?.toString() || '`None`', inline: true}])
            .addFields([{name: 'Schedule', value: `\`${crownSchedule ? crownSchedule : 'None'}\``, inline: true}])
            .addFields([{name: 'Message', value: this.client.utils.replaceCrownKeywords(crownMessage) || '`None`'}])
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author)
            })
            .setTimestamp();

        if (!channel) {
            const payload = ({
                embeds: [embed
                    .spliceFields(1, 0, {
                        name: 'Current Crown Channel', value: `${oldCrownChannel}` || '`None`', inline: true,
                    }).spliceFields(3, 0, {name: 'Status', value: `\`${oldStatus}\``})
                    .setDescription(this.description)
                ],
            });

            this.sendReply(context, payload);
            return;
        }

        channel = isInteraction ? channel : this.getChannelFromMention(context, channel) || context.guild.channels.cache.get(channel);

        if (!channel || (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildNews) || !channel.viewable) {
            const payload = emojis.fail + ' Please mention an accessible text or announcement channel or provide a valid text or announcement channel ID.';

            this.sendReply(context, payload);
            return;
        }

        this.client.db.settings.updateCrownChannelId.run(channel.id, context.guild.id);

        // Update status
        const status = this.client.utils.getStatus(crownRole, channel.id);

        const statusUpdate = oldStatus !== status ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``;

        const payload = {
            embeds: [embed.spliceFields(1, 0, {
                name: 'Channel',
                value: `${oldCrownChannel} ➔ ${channel}`,
                inline: true,
            })
                .spliceFields(3, 0, {name: 'Status Update', value: statusUpdate})
                .setDescription(`The \`crown channel\` was successfully updated. ${success}\nUse \`clearcrownchannel\` to clear the current \`crown channel\`.`),],
        };

        this.sendReply(context, payload);

        // Schedule crown role rotation
        this.client.utils.scheduleCrown(this.client, context.guild);
    }
};
