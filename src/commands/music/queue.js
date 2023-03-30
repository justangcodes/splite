const {EmbedBuilder} = require('discord.js');
const {fail} = require('../../utils/emojis.json');
const Command = require('../Command');
const ButtonMenu = require('../ButtonMenu');

module.exports = class MusicQueueCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'queue',
            aliases: ['q'],
            usage: 'queue',
            voiceChannelOnly: true,
            type: client.types.MUSIC,
        });
    }

    run(message) {
        this.handle(message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction);
    }

    handle(context) {
        const max = 10;
        const methods = ['', '🔂', '🔁'];

        if (!context.member.voice.channel)
            return this.sendReplyAndDelete(context,
                `${fail} - You're not in a voice channel !`
            );
        if (
            context.guild.members.me.voice.channel &&
            context.member.voice.channel.id !== context.guild.members.me.voice.channel.id
        )
            return this.sendReplyAndDelete(context,
                `${fail} - You are not in the same voice channel !`
            );

        const queue = this.client.player.getQueue(context.guild.id);

        if (!this.client.player.getQueue(context.guild.id))
            return this.sendReplyAndDelete(context, `${fail} - No songs currently playing !`);

        const q = [];
        q.push(
            `**Playing Now** : [${queue.nowPlaying().title}](${
                queue.nowPlaying().url
            })\n*\`Requested By : ${
                queue.nowPlaying().requestedBy.username
            }\`*\n\n`
        );
        queue.tracks.map((track, i) => {
            return q.push(
                `**#${track === queue.nowPlaying() ? 'Playing' : i + 1}** - [${
                    track.title
                }](${track.url})\n\`Requested by : ${
                    track.requestedBy.username
                }\`\n`
            );
        });

        if (q.length <= max + 1) {
            const range = q.length === 1 ? '[1]' : `[1 - ${q.length}]`;
            this.sendReplyAndDelete(context, {
                embeds: [
                    new EmbedBuilder()
                        .setTitle(
                            `Server Queue ${range} ${methods[queue.repeatMode]}`
                        )
                        .setDescription(q.join('\n')),
                ],
            });
        }
        else {
            this.sendReply(context, 'Queue Loaded!');
            const embed = new EmbedBuilder()
                .setTitle(
                    `Server Queue - ${q.length - 1} | ${
                        this.client.player.getQueue(context.guild.id).repeatMode
                            ? '(looped)'
                            : ''
                    }`
                )
                .setThumbnail(context.guild.iconURL({dynamic: true}))
                .setFooter({
                    text: 'Expires after two minutes.',
                    iconURL: this.getAvatarURL(context.author),
                });

            new ButtonMenu(
                this.client,
                context.channel,
                context.member,
                embed,
                q,
                max
            );
        }
    }
};
