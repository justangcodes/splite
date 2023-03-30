const Command = require('../Command.js');
const {EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType} = require('discord.js');
const ms = require('ms');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class MuteCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'mute',
            aliases: ['gulag'],
            usage: 'mute <user mention/ID> <time> [reason]',
            description:
                'Mutes a user for the specified amount of time (max is 14 days).',
            type: client.types.MOD,
            clientPermissions: ['SendMessages', 'EmbedLinks', 'ManageRoles'],
            userPermissions: ['ManageRoles'],
            examples: ['mute @split 10s', 'mute @split 30m talks too much'],
            exclusive: true,
            slashCommand: new SlashCommandBuilder()
                .addUserOption(u => u.setName('user').setDescription('The user to mute').setRequired(true))
                .addStringOption(s => s.setName('time').setDescription('The time to mute the user for - Default 5m').setRequired(false))
                .addStringOption(s => s.setName('reason').setDescription('The reason for the mute').setRequired(false))
        });
    }

    async run(message, args) {
        if (!args[0]) {
            this.done(message.author.id);
            return message.reply({embeds: [this.createHelpEmbed(message, this)]});
        }
        const member = await this.getGuildMember(message.guild, args[0]);
        if (!member) {
            this.done(message.author.id);
            return this.sendErrorMessage(
                message,
                0,
                'Please mention a user or provide a valid user ID'
            );
        }

        let time = args[1];

        let reason = args.slice(2).join(' ');

        this.handle(member, time, reason, message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason');
        const time = interaction.options.getString('time');

        this.handle(member, time, reason, interaction);
    }

    handle(member, time, reason, context) {
        if (member === context.member) {
            this.done(context.author.id);
            return this.sendErrorMessage(context, 0, 'You cannot mute yourself');
        }
        if (member === context.guild.members.me) {
            this.done(context.author.id);
            return this.sendErrorMessage(context, 0, 'You cannot mute me');
        }
        const muteRoleId = this.client.db.settings.selectMuteRoleId.pluck().get(context.guild.id);
        let muteRole = muteRoleId ? context.guild.roles.cache.get(muteRoleId) : null;
        if (!muteRole) {
            this.done(context.author.id);
            return this.sendErrorMessage(
                context,
                1,
                'There is currently no mute role set on this server\nCheck out the "setMuteRole" command'
            );
        }

        time = ms(time || '5m');

        if (!time || time > 1209600000) {
            this.done(context.author.id);
            return this.sendErrorMessage(
                context,
                0,
                'Please enter a length of time of 14 days or less (1s/m/h/d)'
            );
        }

        if (!reason) reason = '`None`';
        if (reason.length > 1024) reason = reason.slice(0, 1021) + '...';

        if (member.roles.cache.has(muteRoleId)) {
            this.done(context.author.id);
            return this.sendErrorMessage(
                context,
                0,
                'Provided member is already muted'
            );
        }

        const row = new ActionRowBuilder();
        row.addComponents(
            new ButtonBuilder()
                .setCustomId('proceed')
                .setLabel('✅ Proceed')
                .setStyle(ButtonStyle.Success)
        );
        row.addComponents(
            new ButtonBuilder()
                .setCustomId('cancel')
                .setLabel('❌ Cancel')
                .setStyle(ButtonStyle.Danger)
        );

        const payload = {
            embeds: [
                new EmbedBuilder()
                    .setTitle('Mute Member')
                    .setDescription(
                        `Do you want to mute ${member} for **${ms(time, {
                            long: true,
                        })}**?`
                    )
                    .setFooter({text: 'Expires in 15s'}),
            ],
            components: [row],
        };

        this.sendReply(context, payload).then((msg) => {
            const filter = (button) => button.user.id === context.author.id;
            const collector = msg.createMessageComponentCollector({
                filter,
                componentType: ComponentType.Button,
                time: 15000,
                dispose: true,
            });

            let updated = false;
            collector.on('collect', async (b) => {
                this.done(context.author.id);
                if (b.customId === 'proceed') {
                    // Mute member
                    try {
                        await member.roles.add(muteRole);
                    }
                    catch (err) {
                        this.client.logger.error(err.stack);
                        return this.sendErrorMessage(
                            context,
                            1,
                            'Please check the role hierarchy',
                            err.context
                        );
                    }
                    const muteEmbed = new EmbedBuilder()
                        .setTitle('Mute Member')
                        .setDescription(
                            `${member} has now been muted for **${ms(time, {
                                long: true,
                            })}**.`
                        )
                        .addFields([{name: 'Moderator', value: context.member.toString(), inline: true}])
                        .addFields([{name: 'Member', value: member.toString(), inline: true}])
                        .addFields([{name: 'Time', value: `\`${ms(time)}\``, inline: true}])
                        .addFields([{name: 'Reason', value: reason}])
                        .setFooter({
                            text: this.getUserIdentifier(context.member),
                            iconURL: this.getAvatarURL(context.author)
                        })
                        .setTimestamp()
                        .setColor(context.guild.members.me.displayHexColor);
                    msg.edit({embeds: [muteEmbed], components: []});

                    // Unmute member
                    member.timeout = setTimeout(async () => {
                        try {
                            await member.roles.remove(muteRole);
                            const unmuteEmbed = new EmbedBuilder()
                                .setTitle('Unmute Member')
                                .setDescription(`${member} has been unmuted.`)
                                .setTimestamp()
                                .setColor(context.guild.members.me.displayHexColor);
                            context.channel.send({embeds: [unmuteEmbed]});
                        }
                        catch (err) {
                            this.client.logger.error(err.stack);
                            return this.sendErrorMessage(
                                context,
                                1,
                                'Please check the role hierarchy',
                                err.context
                            );
                        }
                    }, time);

                    // Update mod log
                    await this.sendModLogMessage(context, reason, {
                        Member: member,
                        Time: `\`${ms(time)}\``,
                    });
                }
                else {
                    updated = true;
                    msg.edit({
                        components: [],
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Mute Member')
                                .setDescription(`${member} Not Muted - Cancelled`),
                        ],
                    });
                }
            });
            collector.on('end', () => {
                this.done(context.author.id);
                if (updated) return;
                msg.edit({
                    components: [],
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Mute Member')
                            .setDescription(`${member} Not Muted - Expired`),
                    ],
                });
            });
        });
    }
};
