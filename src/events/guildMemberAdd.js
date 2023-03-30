const {EmbedBuilder} = require('discord.js');
const moment = require('moment');
const {stripIndent} = require('common-tags');

module.exports = async (client, member) => {
    client.logger.info(
        `${member.guild.name}: ${member.user.tag} has joined the server`
    );

    /** ------------------------------------------------------------------------------------------------
     * MEMBER LOG
     * ------------------------------------------------------------------------------------------------ */
    // Get member log
    const memberLogId = client.db.settings.selectMemberLogId
        .pluck()
        .get(member.guild.id);
    const memberLog = member.guild.channels.cache.get(memberLogId);
    if (
        memberLog &&
        memberLog.viewable &&
        memberLog
            .permissionsFor(member.guild.members.me)
            .has(['SendMessages', 'EmbedLinks'])
    ) {
        const embed = new EmbedBuilder()
            .setTitle('Member Joined')
            .setAuthor({
                name: `${member.guild.name}`,
                iconURL: member.guild.iconURL({dynamic: true}),
            })
            .setThumbnail(member.user.displayAvatarURL({dynamic: true}))
            .setDescription(`${member} (**${member.user.tag}**)`)
            .addFields([{
                name: 'Account Created On',
                value: moment(member.user.createdAt).format('dddd, MMMM Do YYYY')
            }])
            .setTimestamp()
            .setColor(member.guild.members.me.displayHexColor);
        memberLog.send({embeds: [embed]});
    }

    /** ------------------------------------------------------------------------------------------------
     * AUTO ROLE
     * ------------------------------------------------------------------------------------------------ */
    // Get auto role
    const autoRoleId = client.db.settings.selectAutoRoleId
        .pluck()
        .get(member.guild.id);
    const autoRole = member.guild.roles.cache.get(autoRoleId);
    if (autoRole) {
        try {
            await member.roles.add(autoRole);
        }
        catch (err) {
            client.sendSystemErrorMessage(
                member.guild,
                'auto role',
                stripIndent`
        Unable to assign auto role, please check the role hierarchy and ensure I have the Manage Roles permission
      `,
                err.message
            );
        }
    }

    /** ------------------------------------------------------------------------------------------------
     * WELCOME MESSAGES
     * ------------------------------------------------------------------------------------------------ */
    // Get welcome channel
    let {
        welcome_channel_id: welcomeChannelId,
        welcome_message: welcomeMessage,
    } = client.db.settings.selectWelcomes.get(member.guild.id);
    const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);

    // Send welcome message
    if (
        welcomeChannel &&
        welcomeChannel.viewable &&
        welcomeChannel
            .permissionsFor(member.guild.members.me)
            .has(['SendMessages', 'EmbedLinks']) &&
        welcomeMessage
    ) {
        welcomeMessage = welcomeMessage
            .replace(/`?\?member`?/g, member) // Member mention substitution
            .replace(/`?\?username`?/g, member.user.username) // Username substitution
            .replace(/`?\?tag`?/g, member.user.tag) // Tag substitution
            .replace(/`?\?size`?/g, member.guild.memberCount); // Guild size substitution
        welcomeChannel.send({
            embeds: [
                new EmbedBuilder()
                    .setDescription(welcomeMessage)
                    .setColor(member.guild.members.me.displayHexColor),
            ],
        });
    }

    /** ------------------------------------------------------------------------------------------------
     * RANDOM COLOR
     * ------------------------------------------------------------------------------------------------ */
    // Assign random color
    const randomColor = client.db.settings.selectRandomColor
        .pluck()
        .get(member.guild.id);
    if (randomColor) {
        const colors = [
            ...member.guild.roles.cache
                .filter((c) => c.name.startsWith('#'))
                .values(),
        ];

        // Check length
        if (colors.length > 0) {
            const color = colors[Math.floor(Math.random() * colors.length)]; // Get color
            try {
                await member.roles.add(color);
            }
            catch (err) {
                client.sendSystemErrorMessage(
                    member.guild,
                    'random color',
                    stripIndent`
          Unable to assign random color, please check the role hierarchy and ensure I have the Manage Roles permission
        `,
                    err.message
                );
            }
        }
    }

    /** ------------------------------------------------------------------------------------------------
     * USERS TABLE
     * ------------------------------------------------------------------------------------------------ */
    // Update users table
    client.db.users.insertRow.run(
        member.id,
        member.user.username,
        member.user.discriminator,
        member.guild.id,
        member.guild.name,
        member.joinedAt.toString(),
        member.user.bot ? 1 : 0,
        null, //AFK
        0, //Afk_time
        0 //OptOutSmashOrPass
    );

    client.db.bios.insertRow.run(member.id, null);

    // If member already in users table
    const missingMemberIds = client.db.users.selectMissingMembers
        .all(member.guild.id)
        .map((row) => row.user_id);
    if (missingMemberIds.includes(member.id))
        client.db.users.updateCurrentMember.run(1, member.id, member.guild.id);
};
