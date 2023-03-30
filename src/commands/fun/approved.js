const Command = require('../Command.js');


module.exports = class approvedCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'approved',

            usage: 'approved <user mention/id>',
            description: 'Generates an approved image',
            type: client.types.FUN,
            examples: ['approved @split'],
            disabled: client.ameApi === null,
        });
    }

    async run(message, args) {
        const member = (await this.getGuildMember(message.guild, args.join(' '))) || message.author;
        await this.handle(member, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const member = interaction.options.getUser('user') || interaction.author;
        await this.handle(member, interaction, true);
    }

    async handle(targetUser, context) {
        await this.sendAmethystEmbed(context, 'approved', {targetUser});
    }
};
