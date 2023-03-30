const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class UnbanCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'unban',
            usage: 'unban <user ID> [reason]',
            description: 'Unbans a member from your server.',
            type: client.types.MOD,
            clientPermissions: ['SendMessages', 'EmbedLinks', 'BanMembers'],
            userPermissions: ['BanMembers'],
            examples: ['unban 134672335474130944'],
            slashCommand: new SlashCommandBuilder()
                .addStringOption(u => u.setName('userid').setDescription('The user ID to unban').setRequired(true))
                .addStringOption(s => s.setName('reason').setDescription('The reason for the unban').setRequired(false))
        });
    }

    run(message, args) {
        if (!args[0]) return this.sendErrorMessage(message, 0, 'Please provide a user ID');
        const id = args[0];

        let reason = args.slice(1).join(' ');

        this.handle(id, reason, message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const id = interaction.options.getString('userid');
        const reason = interaction.options.getString('reason');

        await this.handle(id, reason, interaction);
    }

    async handle(id, reason, context) {
        const bannedUsers = await context.guild.bans.fetch();
        const user = bannedUsers.get(id).user;
        if (!user) {
            return this.sendErrorMessage(
                context,
                0,
                'Unable to find user, please check the provided ID'
            );
        }

        if (!reason) reason = '`None`';
        if (reason.length > 1024) reason = reason.slice(0, 1021) + '...';

        await context.guild.members.unban(user, reason);
        const embed = new EmbedBuilder()
            .setTitle('Unban Member')
            .setDescription(`${user.tag} was successfully unbanned.`)
            .addFields([{name: 'Moderator', value: context.member.toString(), inline: true}])
            .addFields([{name: 'Member', value: user.tag, inline: true}])
            .addFields([{name: 'Reason', value: reason}])
            .setFooter({
                text: this.getUserIdentifier(context.member),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        await this.sendReply(context, {embeds: [embed]});
        this.client.logger.info(
            `${context.guild.name}: ${context.author.tag} unbanned ${user.tag}`
        );

        // Update mod log
        await this.sendModLogMessage(context, reason, {Member: user.tag});
    }
};
