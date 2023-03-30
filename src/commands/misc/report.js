const {SlashCommandBuilder} = require('discord.js');
const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {oneLine} = require('common-tags');

module.exports = class reportCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'report',
            usage: 'report',
            aliases: ['bugreport', 'reportbug', 'report', 'bug', 'rb', 'br'],
            description: 'report a bug',
            type: client.types.INFO,
            clientPermissions: ['SendMessages', 'EmbedLinks', 'AddReactions'],
            cooldown: 5,
            slashCommand: new SlashCommandBuilder()
                .addSubcommand((subcommand) => subcommand
                    .setName('confession')
                    .setDescription('Report a confession for ToS violation or harmful/hateful content')
                    .addIntegerOption((option) => option
                        .setName('id')
                        .setDescription('ID of the confession')
                        .setRequired(true))
                    .addStringOption((option) => option
                        .setName('reason')
                        .setDescription('The reason for the report')))
                .addSubcommand((subcommand) => subcommand
                    .setName('bug')
                    .setDescription('Report a bug in the bot')
                    .addStringOption((option) => option
                        .setName('reason')
                        .setDescription('The reason for the report')
                        .setRequired(true))),
        });
    }

    run(message, args) {
        if (!args[0]) return this.sendErrorMessage(message, 0, 'Please provide a message to send');

        let report = message.content.slice(message.content.indexOf(args[0]), message.content.length);

        sendBugReport.call(this, report, message);
    }

    interact(interaction) {
        const id = interaction.options.getInteger('id');
        const reason = interaction.options.getString('reason');
        if (interaction.options.getSubcommand() === 'confession') {
            const reportsChannel = interaction.client.channels.cache.get(interaction.client.config.confessionReportsID);
            if (reportsChannel) reportsChannel.send(`${interaction.member.user.username}#${interaction.member.user.discriminator} (${interaction.member.user.id}) has reported Confession ID ${id}\n**Reason**\n||*${reason || 'None'}*||`);
            return interaction.reply({
                content: 'Your report has been received! Thank you', ephemeral: true,
            });
        }
        else if (interaction.options.getSubcommand() === 'bug') {
            sendBugReport.call(this, interaction.options.getString('reason'), interaction);
        }
    }
};

function sendBugReport(report, context) {
    const reportChannel = this.client.channels.cache.get(this.client.config.bugReportChannelId);

    if (!reportChannel) return context.reply({
        content: 'The bug report channel could not be found. Please contact the bot owner.',
    });

    // Send report
    const reportEmbed = new EmbedBuilder()
        .setTitle('Bug Report')
        .setThumbnail(reportChannel.guild.iconURL({dynamic: true}))
        .setDescription(report)
        .addFields([{name: 'User', value: context.member.toString(), inline: true}])
        .addFields([{name: 'Server', value: context.guild.name, inline: true}])
        .setFooter({
            text: this.getUserIdentifier(context.member), iconURL: this.getAvatarURL(context.member),
        })
        .setTimestamp()
        .setColor(context.guild.members.me.displayHexColor);

    reportChannel.send({embeds: [reportEmbed]});

    // Send response
    if (report.length > 1024) report = report.slice(0, 1021) + '...';

    const embed = new EmbedBuilder()
        .setTitle('Bug Report')
        .setThumbnail('https://i.imgur.com/B0XSinY.png')
        .setDescription(oneLine`
        Successfully sent bug report!
         ${this.client.owners[0] && `To further discuss your issue, contact <@${this.client.owners[0]}>`}
      `)
        .addFields([{name: 'Member', value: context.member.toString(), inline: true}])
        .addFields([{name: 'Message', value: report}])
        .setFooter({
            text: this.getUserIdentifier(context.member), iconURL: this.getAvatarURL(context.member),
        })
        .setTimestamp()
        .setColor(context.guild.members.me.displayHexColor);

    this.sendReply(context, embed);
}
