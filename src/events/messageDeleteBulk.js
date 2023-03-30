const {EmbedBuilder} = require('discord.js');

module.exports = (client, messages) => {
    const message = messages.first();
    const prefix = client.db.settings.selectPrefix
        .pluck()
        .get(message.guild.id); // Get prefix

    const snipeMessage = messages.find(m => !m.author?.bot && !client.utils.isEmptyMessage(m) && !client.utils.isCommandOrBotMessage(m, prefix));

    // Add to snipe cache
    if (snipeMessage?.author && !snipeMessage.author?.bot) {
        try {
            snipeMessage.guild.snipes.set(snipeMessage.channel.id, snipeMessage);
        }
        catch (e) {
            console.log(e);
        }
    }


    // Get message delete log
    const messageDeleteLogId = client.db.settings.selectMessageDeleteLogId
        .pluck()
        .get(message.guild.id);
    const messageDeleteLog =
        message.guild.channels.cache.get(messageDeleteLogId);
    if (
        messageDeleteLog &&
        messageDeleteLog.viewable &&
        messageDeleteLog
            .permissionsFor(message.guild.members.me)
            .has(['SendMessages', 'EmbedLinks'])
    ) {
        const embed = new EmbedBuilder()
            .setTitle('Message Update: `Bulk Delete`')
            .setAuthor({
                name: `${message.guild.name}`,
                iconURL: message.guild.iconURL({dynamic: true}),
            })
            .setDescription(
                `**${messages.size} messages** in ${message.channel} were deleted.`
            )
            .setTimestamp()
            .setColor('Red');
        messageDeleteLog.send({embeds: [embed]});
    }
};
