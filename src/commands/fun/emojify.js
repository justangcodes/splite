const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {fail} = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');

const numberMap = {
    0: ':zero:',
    1: ':one:',
    2: ':two:',
    3: ':three:',
    4: ':four:',
    5: ':five:',
    6: ':six:',
    7: ':seven:',
    8: ':eight:',
    9: ':nine:',
};

module.exports = class EmojifyCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'emojify',
            aliases: ['sayemoji'],
            usage: 'emojify <message>',
            description:
                'Swaps every letter within the provided message with an emoji.',
            type: client.types.FUN,
            examples: ['emojify hello world'],
            slashCommand: new SlashCommandBuilder().addStringOption(s => s.setRequired(true).setName('text').setDescription('The text to emojify'))
        });
    }

    async run(message, args) {
        if (!args[0])
            return this.sendErrorMessage(
                message,
                0,
                'Please provide a message to emojify'
            );
        let text = message.content.slice(
            message.content.indexOf(args[0]),
            message.content.length
        );
        await this.handle(text, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction.options.getString('text'), interaction, true);
    }

    async handle(text, context) {
        try {
            text = text
                .split('')
                .map((c) => {
                    if (c === ' ') return c;
                    else if (/[0-9]/.test(c)) return numberMap[c];
                    else
                        return /[a-zA-Z]/.test(c)
                            ? ':regional_indicator_' + c.toLowerCase() + ':'
                            : '';
                })
                .join('');

            if (text.length > 2048) {
                text = text.slice(0, text.length - (text.length - 2033));
                text = text.slice(0, text.lastIndexOf(':')) + '**...**';
            }
            const payload = {
                content: text,
            };
            this.sendReply(context, payload);
        }
        catch (err) {
            const embed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription(fail + ' ' + err.message)
                .setColor('Red');
            const payload = {
                embeds: [embed]
            };
            await this.sendReply(context, payload);
        }
    }
};
