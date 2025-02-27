const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {success, verify} = require('../../utils/emojis.json');
const {oneLine, stripIndent} = require('common-tags');

module.exports = class SetVerificationChannelCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setverificationchannel',
            aliases: ['setvc', 'svc'],
            usage: 'setverificationchannel <channel mention/ID>',
            description: oneLine`
        Sets the verification text channel for your server. If set, unverified members will start here.
        Once verified, the \`verification role\` will be assigned to them.
        Please ensure that new members are not able access other server channels for proper verification.
        A \`verification channel\`, a \`verification message\`, 
        and an \`verification role\` must be set to enable server verification.
        \nUse \`clearverificationchannel\` to clear current \`verification channel\`.
      `,
            type: client.types.ADMIN,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
            userPermissions: ['MANAGE_GUILD'],
            examples: ['setverificationchannel #verification', 'clearverificationchannel']
        });
    }

    async run(message, args) {

        let {
            verification_role_id: verificationRoleId,
            verification_channel_id: verificationChannelId,
            verification_message: verificationMessage,
            verification_message_id: verificationMessageId
        } = message.client.db.settings.selectVerification.get(message.guild.id);
        const verificationRole = message.guild.roles.cache.get(verificationRoleId);
        const oldVerificationChannel = message.guild.channels.cache.get(verificationChannelId) || '`None`';

        // Get status
        const oldStatus = message.client.utils.getStatus(
            verificationRoleId && verificationChannelId && verificationMessage
        );

        // Trim message
        if (verificationMessage && verificationMessage.length > 1024)
            verificationMessage = verificationMessage.slice(0, 1021) + '...';

        const embed = new MessageEmbed()
            .setTitle('Settings: `Verification`')
            .addField('Role', verificationRole.toString() || '`None`', true)
            .addField('Message', verificationMessage || '`None`')
            .setThumbnail(message.guild.iconURL({dynamic: true}))
            .setFooter({
                text: message.member.displayName,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);

        // Clear if no args provided
        if (args.length === 0) {
            // Update status
            return message.channel.send({
                embeds: [embed
                    .spliceFields(1, 0, {
                        name: 'Current Verification Channel',
                        value: `${oldVerificationChannel}`,
                        inline: true
                    })
                    .spliceFields(2, 0, {
                        name: 'Status',
                        value: `\`${oldStatus}\``,
                        inline: true
                    }).setDescription(this.description)
                ]
            });
        }
        embed.setDescription(`The \`verification channel\` was successfully updated. ${success}\nUse \`clearverificationchannel\` to clear current \`verification channel\`.`)
        const verificationChannel =
            this.getChannelFromMention(message, args[0]) || message.guild.channels.cache.get(args[0]);
        if (!verificationChannel || verificationChannel.type != 'GUILD_TEXT' || !verificationChannel.viewable)
            return this.sendErrorMessage(message, 0, stripIndent`
        Please mention an accessible text channel or provide a valid text channel ID
      `);

        // Update status
        const status = message.client.utils.getStatus(verificationRole && verificationChannel && verificationMessage);
        const statusUpdate = (oldStatus != status) ? `\`${oldStatus}\` ➔ \`${status}\`` : `\`${oldStatus}\``;

        message.client.db.settings.updateVerificationChannelId.run(verificationChannel.id, message.guild.id);
        message.channel.send({
            embeds: [embed
                .spliceFields(1, 0, {
                    name: 'Channel',
                    value: `${oldVerificationChannel} ➔ ${verificationChannel}`,
                    inline: true
                })
                .spliceFields(2, 0, {name: 'Status', value: statusUpdate, inline: true})
            ]
        });

        // Update verification
        if (status === 'enabled') {
            if (verificationChannel.viewable) {
                try {
                    await verificationChannel.messages.fetch(verificationMessageId);
                } catch (err) { // Message was deleted
                    message.client.logger.error(err);
                }
                const msg = await verificationChannel.send({
                    embeds: [new MessageEmbed()
                        .setDescription(verificationMessage.slice(3, -3))
                        .setColor(message.guild.me.displayHexColor)
                    ]
                });
                await msg.react(verify.split(':')[2].slice(0, -1));
                message.client.db.settings.updateVerificationMessageId.run(msg.id, message.guild.id);
            } else {
                return message.client.sendSystemErrorMessage(message.guild, 'verification', stripIndent`
          Unable to send verification message, please ensure I have permission to access the verification channel
        `);
            }
        }
    }
};
