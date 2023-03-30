/* eslint-disable */
const {Statics, createDatabaseFolder} = require('./utils');
const config = Statics.config;
const Database = require('better-sqlite3');

createDatabaseFolder();

const db = new Database(__basedir + '/data/db/db.sqlite');

// Set pragmas
db.pragma('synchronous = 1');

/**
 * Enabling WAL mode causes issues with file locking within WSL, works fine on a normal Unix system
 * Issue documented here: https://github.com/microsoft/WSL/issues/2395
 */
db.pragma('journal_mode = wal');

// language=SQL format=false
/** ------------------------------------------------------------------------------------------------
 * TABLES
 * ------------------------------------------------------------------------------------------------ */
// BOT SETTINGS TABLE
db.prepare(
    `
  CREATE TABLE IF NOT EXISTS settings (
    guild_id TEXT PRIMARY KEY,
    guild_name TEXT,
    prefix TEXT DEFAULT "${config.defaultPrefix}" NOT NULL,
    system_channel_id TEXT,
    confessions_channel_id TEXT,
    starboard_channel_id TEXT,
    admin_role_id TEXT,
    mod_role_id TEXT,
    mute_role_id TEXT,
    auto_role_id TEXT,
    auto_kick INTEGER,
    random_color INTEGER DEFAULT 0 NOT NULL,
    mod_channel_ids TEXT,
    disabled_commands TEXT,
    mod_log_id TEXT,
    member_log_id TEXT,
    nickname_log_id TEXT,
    role_log_id TEXT,
    message_edit_log_id TEXT,
    message_delete_log_id TEXT,
    verification_role_id TEXT,
    verification_channel_id TEXT,
    verification_message TEXT,
    verification_message_id TEXT,
    welcome_channel_id TEXT,
    welcome_message TEXT,
    farewell_channel_id TEXT,
    farewell_message TEXT,
    point_tracking INTEGER DEFAULT 1 NOT NULL,
    message_points INTEGER DEFAULT 1 NOT NULL,
    command_points INTEGER DEFAULT 1 NOT NULL,
    voice_points INTEGER DEFAULT 1 NOT NULL, 
    crown_role_id TEXT,
    crown_channel_id TEXT,
    crown_message TEXT DEFAULT "?member has won ?role for today! Points have been reset, better luck next time!",
    crown_schedule TEXT DEFAULT "0 */24 * * *",
    joinvoting_message_id TEXT,
    joinvoting_emoji TEXT,
    voting_channel_id TEXT,
    anonymous INTEGER DEFAULT 0 NOT NULL,
    confessions_view_role TEXT
  );
`
).run();

// BIOS TABLE
db.prepare(
    `
  CREATE TABLE IF NOT EXISTS bios (
    user_id TEXT,
    bio TEXT,
    PRIMARY KEY (user_id)
  );
`
).run();

// USERS TABLE
db.prepare(
    `
  CREATE TABLE IF NOT EXISTS users (
    user_id TEXT,
    user_name TEXT,
    user_discriminator TEXT,
    guild_id TEXT,
    guild_name TEXT,
    date_joined TEXT,
    bot INTEGER,
    points INTEGER DEFAULT 0 NOT NULL,
    total_points INTEGER DEFAULT 0 NOT NULL,
    warns TEXT,
    current_member INTEGER DEFAULT 1 NOT NULL,
    afk TEXT,
    afk_time INTEGER,
    SmashRunning INTEGER,
    optOutSmashOrPass INTEGER,
    PRIMARY KEY (user_id, guild_id)
  );
`
).run();

// CONFESSIONS TABLE
db.prepare(
    `
  CREATE TABLE IF NOT EXISTS confessions (
    confession_id INTEGER,
    content TEXT,
    author_id TEXT,
    guild_id TEXT,
    timeanddate TEXT,
    PRIMARY KEY (confession_id)
  );
`
).run();

// MATCHES TABLE
db.prepare(
    `
  CREATE TABLE IF NOT EXISTS matches (
    matchID INTEGER,
    userID TEXT,
    shownUserID TEXT,
    liked TEXT,
    dateandtime TEXT,
    PRIMARY KEY (matchID)
  );
`
).run();

// ACTIVITY TABLE
db.prepare(
    `
  CREATE TABLE IF NOT EXISTS activities (
    activity_date DATE,
    user_id TEXT,
    guild_id TEXT,
    messages INTEGER DEFAULT 0,
    moderations INTEGER DEFAULT 0,
    PRIMARY KEY (activity_date, user_id, guild_id)
  );
`
).run();

// BLACKLIST TABLE
db.prepare(
    `
  CREATE TABLE IF NOT EXISTS blacklist (
    user_id TEXT,
    PRIMARY KEY (user_id)
  );
`
).run();

// INTEGRATIONS TABLE - Tracks third party votes like topGG etc.
db.prepare(
    `
  CREATE TABLE IF NOT EXISTS integrations (
    user_id TEXT,
    topgg DATE DEFAULT (datetime('now','localtime')),
    PRIMARY KEY (user_id) 
  );
`
).run();

/** ------------------------------------------------------------------------------------------------
 * PREPARED STATEMENTS
 * ------------------------------------------------------------------------------------------------ */
// BOT SETTINGS TABLE
const settings = {
    insertRow: db.prepare(`
    INSERT OR IGNORE INTO settings (
      guild_id,
      guild_name,
      system_channel_id,
      confessions_channel_id,
      welcome_channel_id,
      farewell_channel_id,
      crown_channel_id,
      mod_log_id,
      admin_role_id,
      mod_role_id,
      mute_role_id,
      crown_role_id,
      joinvoting_message_id,
      joinvoting_emoji,
      voting_channel_id,
      anonymous,
      confessions_view_role
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `),

    // Selects
    selectRow: db.prepare('SELECT * FROM settings WHERE guild_id = ?;'),
    selectGuilds: db.prepare('SELECT guild_name, guild_id FROM settings'),
    selectPrefix: db.prepare('SELECT prefix FROM settings WHERE guild_id = ?;'),
    selectSystemChannelId: db.prepare(
        'SELECT system_channel_id FROM settings WHERE guild_id = ?;'
    ),
    selectConfessionsChannelId: db.prepare(
        'SELECT confessions_channel_id FROM settings WHERE guild_id = ?;'
    ),
    selectViewConfessionsRole: db.prepare(
        'SELECT confessions_view_role FROM settings WHERE guild_id = ?;'
    ),
    selectStarboardChannelId: db.prepare(
        'SELECT starboard_channel_id FROM settings WHERE guild_id = ?;'
    ),
    selectAdminRoleId: db.prepare(
        'SELECT admin_role_id FROM settings WHERE guild_id = ?;'
    ),
    selectModRoleId: db.prepare(
        'SELECT mod_role_id FROM settings WHERE guild_id = ?;'
    ),
    selectMuteRoleId: db.prepare(
        'SELECT mute_role_id FROM settings WHERE guild_id = ?;'
    ),
    selectAutoRoleId: db.prepare(
        'SELECT auto_role_id FROM settings WHERE guild_id = ?;'
    ),
    selectAutoKick: db.prepare(
        'SELECT auto_kick FROM settings WHERE guild_id = ?;'
    ),
    selectRandomColor: db.prepare(
        'SELECT random_color FROM settings WHERE guild_id = ?;'
    ),
    selectModChannelIds: db.prepare(
        'SELECT mod_channel_ids FROM settings WHERE guild_id = ?;'
    ),
    selectDisabledCommands: db.prepare(
        'SELECT disabled_commands FROM settings WHERE guild_id = ?;'
    ),
    selectModLogId: db.prepare(
        'SELECT mod_log_id FROM settings WHERE guild_id = ?;'
    ),
    selectMemberLogId: db.prepare(
        'SELECT member_log_id FROM settings WHERE guild_id = ?;'
    ),
    selectNicknameLogId: db.prepare(
        'SELECT nickname_log_id FROM settings WHERE guild_id = ?;'
    ),
    selectRoleLogId: db.prepare(
        'SELECT role_log_id FROM settings WHERE guild_id = ?;'
    ),
    selectMessageEditLogId: db.prepare(
        'SELECT message_edit_log_id FROM settings WHERE guild_id = ?;'
    ),
    selectMessageDeleteLogId: db.prepare(
        'SELECT message_delete_log_id FROM settings WHERE guild_id = ?;'
    ),
    selectVerification: db.prepare(`
    SELECT verification_role_id, verification_channel_id, verification_message, verification_message_id 
    FROM settings
    WHERE guild_id = ?;
  `),
    selectWelcomes: db.prepare(
        'SELECT welcome_channel_id, welcome_message FROM settings WHERE guild_id = ?;'
    ),
    selectFarewells: db.prepare(
        'SELECT farewell_channel_id, farewell_message FROM settings WHERE guild_id = ?;'
    ),
    selectPoints: db.prepare(`
    SELECT point_tracking, message_points, command_points, voice_points
    FROM settings
    WHERE guild_id = ?;
  `),
    selectCrown: db.prepare(`
    SELECT crown_role_id, crown_channel_id, crown_message, crown_schedule
    FROM settings
    WHERE guild_id = ?;
  `),
    selectJoinVotingMessage: db.prepare(`
  SELECT joinvoting_message_id, joinvoting_emoji, voting_channel_id
  FROM settings
  WHERE guild_id = ?;`),
    selectAnonymous: db.prepare(
        'SELECT anonymous FROM settings WHERE guild_id = ?;'
    ),

    // Updates
    updatePrefix: db.prepare(
        'UPDATE settings SET prefix = ? WHERE guild_id = ?;'
    ),
    updateGuildName: db.prepare(
        'UPDATE settings SET guild_name = ? WHERE guild_id = ?;'
    ),
    updateSystemChannelId: db.prepare(
        'UPDATE settings SET system_channel_id = ? WHERE guild_id = ?;'
    ),
    updateConfessionsChannelId: db.prepare(
        'UPDATE settings SET confessions_channel_id = ? WHERE guild_id = ?;'
    ),
    updateViewConfessionsRole: db.prepare(
        'UPDATE settings set confessions_view_role = ? WHERE guild_id = ?;'
    ),
    updateStarboardChannelId: db.prepare(
        'UPDATE settings SET starboard_channel_id = ? WHERE guild_id = ?;'
    ),
    updateAdminRoleId: db.prepare(
        'UPDATE settings SET admin_role_id = ? WHERE guild_id = ?;'
    ),
    updateModRoleId: db.prepare(
        'UPDATE settings SET mod_role_id = ? WHERE guild_id = ?;'
    ),
    updateMuteRoleId: db.prepare(
        'UPDATE settings SET mute_role_id = ? WHERE guild_id = ?;'
    ),
    updateAutoRoleId: db.prepare(
        'UPDATE settings SET auto_role_id = ? WHERE guild_id = ?;'
    ),
    updateAutoKick: db.prepare(
        'UPDATE settings SET auto_kick = ? WHERE guild_id = ?;'
    ),
    updateRandomColor: db.prepare(
        'UPDATE settings SET random_color = ? WHERE guild_id = ?;'
    ),
    updateModChannelIds: db.prepare(
        'UPDATE settings SET mod_channel_ids = ? WHERE guild_id = ?;'
    ),
    updateDisabledCommands: db.prepare(
        'UPDATE settings SET disabled_commands = ? WHERE guild_id = ?;'
    ),
    updateModLogId: db.prepare(
        'UPDATE settings SET mod_log_id = ? WHERE guild_id = ?;'
    ),
    updateMemberLogId: db.prepare(
        'UPDATE settings SET member_log_id = ? WHERE guild_id = ?;'
    ),
    updateNicknameLogId: db.prepare(
        'UPDATE settings SET nickname_log_id = ? WHERE guild_id = ?;'
    ),
    updateRoleLogId: db.prepare(
        'UPDATE settings SET role_log_id = ? WHERE guild_id = ?;'
    ),
    updateMessageEditLogId: db.prepare(
        'UPDATE settings SET message_edit_log_id = ? WHERE guild_id = ?;'
    ),
    updateMessageDeleteLogId: db.prepare(
        'UPDATE settings SET message_delete_log_id = ? WHERE guild_id = ?;'
    ),
    updateVerificationRoleId: db.prepare(
        'UPDATE settings SET verification_role_id = ? WHERE guild_id = ?;'
    ),
    updateVerificationChannelId: db.prepare(
        'UPDATE settings SET verification_channel_id = ? WHERE guild_id = ?;'
    ),
    updateVerificationMessage: db.prepare(
        'UPDATE settings SET verification_message = ? WHERE guild_id = ?;'
    ),
    updateVerificationMessageId: db.prepare(
        'UPDATE settings SET verification_message_id = ? WHERE guild_id = ?;'
    ),
    updateWelcomeChannelId: db.prepare(
        'UPDATE settings SET welcome_channel_id = ? WHERE guild_id = ?;'
    ),
    updateWelcomeMessage: db.prepare(
        'UPDATE settings SET welcome_message = ? WHERE guild_id = ?;'
    ),
    updateFarewellChannelId: db.prepare(
        'UPDATE settings SET farewell_channel_id = ? WHERE guild_id = ?;'
    ),
    updateFarewellMessage: db.prepare(
        'UPDATE settings SET farewell_message = ? WHERE guild_id = ?;'
    ),
    updatePointTracking: db.prepare(
        'UPDATE settings SET point_tracking = ? WHERE guild_id = ?;'
    ),
    updateMessagePoints: db.prepare(
        'UPDATE settings SET message_points = ? WHERE guild_id = ?;'
    ),
    updateCommandPoints: db.prepare(
        'UPDATE settings SET command_points = ? WHERE guild_id = ?;'
    ),
    updateVoicePoints: db.prepare(
        'UPDATE settings SET voice_points = ? WHERE guild_id = ?;'
    ),
    updateCrownRoleId: db.prepare(
        'UPDATE settings SET crown_role_id = ? WHERE guild_id = ?;'
    ),
    updateCrownChannelId: db.prepare(
        'UPDATE settings SET crown_channel_id = ? WHERE guild_id = ?;'
    ),
    updateCrownMessage: db.prepare(
        'UPDATE settings SET crown_message = ? WHERE guild_id = ?;'
    ),
    updateCrownSchedule: db.prepare(
        'UPDATE settings SET crown_schedule = ? WHERE guild_id = ?;'
    ),
    deleteGuild: db.prepare('DELETE FROM settings WHERE guild_id = ?;'),
    updateJoinVotingMessageId: db.prepare(
        'UPDATE settings SET joinvoting_message_id = ? WHERE guild_id = ?;'
    ),
    updateJoinVotingEmoji: db.prepare(
        'UPDATE settings SET joinvoting_emoji = ? WHERE guild_id = ?;'
    ),
    updateVotingChannelID: db.prepare(
        'UPDATE settings SET voting_channel_id = ? WHERE guild_id = ?;'
    ),
    updateAnonymous: db.prepare(
        'UPDATE settings SET anonymous = ? WHERE guild_id = ?;'
    ),
};

// BIOS TABLE
const bios = {
    insertRow: db.prepare(`
    INSERT OR IGNORE INTO bios (
      user_id,
      bio
    ) VALUES (?, ?);
  `),
    selectBio: db.prepare('SELECT bio FROM bios WHERE user_id = ?;'),
    updateBio: db.prepare('UPDATE bios SET bio = ? WHERE user_id = ?;'),
};

// USERS TABLE
const users = {
    insertRow: db.prepare(`
    INSERT OR IGNORE INTO users (
      user_id, 
      user_name,
      user_discriminator,
      guild_id, 
      guild_name, 
      date_joined,
      bot,
      afk,
      afk_time,
      optOutSmashOrPass
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `),

    insertBatch: (rows) => {
        let query =
            `INSERT OR IGNORE INTO users (
            user_id, 
            user_name,
            user_discriminator,
            guild_id, 
            guild_name, 
            date_joined,
            bot,
            afk,
            afk_time,
            optOutSmashOrPass
        ) VALUES ` +
            rows.map(() => '(?, ?, ?, ?,?, ?, ?, ?,?,?)').join(', ');

        // console.log(query);
        // process.exit()
        const stmt = db.prepare(query);
        const values = rows.flatMap((r) => Object.values(r));
        return stmt.run(...values);
    },

    // Selects
    selectRow: db.prepare(
        'SELECT * FROM users WHERE user_id = ? AND guild_id = ?;'
    ),
    selectRowUserOnly: db.prepare(
        'SELECT * FROM users WHERE user_id = ? limit 1;'
    ),
    selectLeaderboard: db.prepare(
        'SELECT * FROM users WHERE guild_id = ? AND current_member = 1 ORDER BY points DESC;'
    ),
    selectPoints: db.prepare(
        'SELECT points FROM users WHERE user_id = ? AND guild_id = ?;'
    ),
    selectTotalPoints: db.prepare(
        'SELECT total_points FROM users WHERE user_id = ? AND guild_id = ?;'
    ),
    selectWarns: db.prepare(
        'SELECT warns FROM users WHERE user_id = ? AND guild_id = ?;'
    ),
    selectCurrentMembers: db.prepare(
        'SELECT * FROM users WHERE guild_id = ? AND current_member = 1;'
    ),
    selectMissingMembers: db.prepare(
        'SELECT * FROM users WHERE guild_id = ? AND current_member = 0;'
    ),
    selectAfk: db.prepare(
        'SELECT afk, afk_time FROM users WHERE guild_id = ? AND user_id = ?;'
    ),
    selectOptOutSmashOrPass: db.prepare(
        'SELECT optOutSmashOrPass FROM users WHERE user_id = ? limit 1;'
    ),

    // Updates
    updateGuildName: db.prepare(
        'UPDATE users SET guild_name = ? WHERE guild_id = ?;'
    ),
    updateUser: db.prepare(
        'UPDATE users SET user_name = ?, user_discriminator = ? WHERE user_id = ?;'
    ),
    updatePoints: db.prepare(`
    UPDATE users 
    SET points = points + @points, total_points = total_points + @points
    WHERE user_id = ? AND guild_id = ?;
  `),
    setPoints: db.prepare(
        'UPDATE users SET points = ? WHERE user_id = ? AND guild_id = ?;'
    ),
    wipePoints: db.prepare(
        'UPDATE users SET points = 0 WHERE user_id = ? AND guild_id = ?;'
    ),
    wipeTotalPoints: db.prepare(
        'UPDATE users SET points = 0, total_points = 0 WHERE user_id = ? AND guild_id = ?;'
    ),
    wipeAllPoints: db.prepare('UPDATE users SET points = 0 WHERE guild_id = ?;'),
    wipeAllTotalPoints: db.prepare(
        'UPDATE users SET points = 0, total_points = 0 WHERE guild_id = ?;'
    ),
    updateWarns: db.prepare(
        'UPDATE users SET warns = ? WHERE user_id = ? AND guild_id = ?;'
    ),
    updateCurrentMember: db.prepare(
        'UPDATE users SET current_member = ? WHERE user_id = ? AND guild_id = ?;'
    ),
    deleteGuild: db.prepare('DELETE FROM users WHERE guild_id = ?;'),
    updateAfk: db.prepare(
        'UPDATE users SET afk = ?, afk_time = ? WHERE user_id = ? AND guild_id = ?;'
    ),
    updateOptOutSmashOrPass: db.prepare(
        'UPDATE users SET optOutSmashOrPass = ? WHERE user_id = ?;'
    ),
    deleteUser: db.prepare('DELETE FROM users WHERE user_id = ?;'),
    // selects a random user from the user table where isCurrent is true, and join bio table where the user_id matches the user_id in the user table
    getRandomWithBio: db.prepare(
        'SELECT * FROM users JOIN bios ON users.user_id = bios.user_id WHERE users.guild_id = ? AND users.current_member = 1 AND users.bot = 0 ORDER BY RANDOM() LIMIT 1;'
    )
    ,
    getRandom: db.prepare(
        'SELECT * FROM users WHERE guild_id = ? AND users.current_member = 1 AND users.bot = 0 ORDER BY RANDOM() LIMIT 1;'
    ),
};

// BOT CONFESSIONS TABLE
const confessions = {
    insertRow: db.prepare(`
    INSERT OR IGNORE INTO confessions (
      confession_id,
      content,
      author_id,
      guild_id,
      timeanddate
    ) VALUES (?, ?, ?, ?, ?);
  `),

    // Selects
    selectConfessionByGuild: db.prepare(
        'SELECT * FROM confessions WHERE guild_id = ?;'
    ),
    selectConfessionByAuthor: db.prepare(
        'SELECT * FROM confessions WHERE author_id = ?;'
    ),
    selectConfessionByID: db.prepare(
        'SELECT * FROM confessions WHERE confession_id = ?;'
    ),
};

// MATCHES TABLE
const SmashOrPass = {
    insertRow: db.prepare(`
    INSERT OR IGNORE INTO matches (
      userID,
      shownUserID,
      liked,
      dateandtime
    ) VALUES (?, ?, ?, ?);
  `),

    // Selects
    /**
     * Get Matches of user
     * getMatches({userId: 1234})
     */
    getMatches: db.prepare(`
    select distinct matches.*
    from matches
    inner join matches as AlsoLikesMe
        on AlsoLikesMe.userID = matches.shownUserID
            and AlsoLikesMe.liked = 'yes'
            and AlsoLikesMe.shownUserID = $userId
    where matches.userID = $userId and matches.liked = 'yes'
    group by AlsoLikesMe.userID

    order by AlsoLikesMe.dateandtime desc;`)
    /**
     * Check if 2 users match
     * getMatch({userId: 123, userId2: 234})
     */,
    getMatch: db.prepare(`    
    select distinct matches.userID, matches.dateandtime
    from matches
    inner join matches as AlsoLikesMe
        on AlsoLikesMe.userID = $userId
            and AlsoLikesMe.liked = 'yes'
            and AlsoLikesMe.shownUserID = $userId2
    where matches.userID = $userId2 and matches.liked = 'yes'
    GROUP BY matches.userID;`),

    /**
     * Get all the users that this user hasnt seen yet and have liked this user.
     * getLikedByUsers({userId: 1234})
     */
    getLikedByUsers: db.prepare(`
    SELECT *
    FROM users
    WHERE user_id IN (select t1.userid from matches t1
      left outer join (select * from matches where userID = $userId) t2 on t2.shownUserID = t1.userID where t2.shownUserID is null
      and t1.shownUserID = $userId and t1.liked = 'yes')
    GROUP BY user_id`),

    /**
     * getUsersToShow({userId: 123})
     */
    getUnseenUsers: db.prepare(`
    SELECT u.*
    FROM users u
    WHERE u.user_id NOT IN (
        SELECT shownUserID
        FROM matches
        WHERE userid = $userId)
        AND bot = 0
        AND user_id != $userId
        AND optoutsmashorpass != 1
    GROUP BY user_id
    ORDER BY random()

    LIMIT 100;`)
    /**
     * unmatchUser({userId: 123, unmatchUser: 235})
     */,
    unmatchUser: db.prepare(
        'delete from matches where userID = $userId and shownUserID = $unmatchUser;'
    ),

    /**
     * Clear Smash Or Pass
     */
    resetSmashOrPass: db.prepare('delete from matches where userID = ?'),

    /**
     * Check if user has already come across this user
     */
    getSeenByUser: db.prepare(
        'select shownUserID, dateandtime, liked from matches where userID = ? and shownUserID = ?;'
    ),
};

// ACTIVITIES TABLE
const activities = {
    insertRow: db.prepare(`
    INSERT OR IGNORE INTO activities (
      activity_date,
      user_id,
      guild_id,
      messages,
      moderations
    ) VALUES (?, ?, ?, ?, ?);
  `), //UPDATES
    updateMessages: db.prepare(
        'INSERT INTO activities (activity_date, user_id, guild_id, messages) VALUES((select date()), $userId, $guildId, 1) ON CONFLICT(activity_date, user_id, guild_id) DO UPDATE SET messages = messages + 1 WHERE activity_date = (SELECT DATE()) AND user_id = $userId AND guild_id = $guildId;'
    ),
    updateModerations: db.prepare(
        'INSERT INTO activities (activity_date, user_id, guild_id, moderations) VALUES((select date()), $userId, $guildId, 1) ON CONFLICT(activity_date, user_id, guild_id) DO UPDATE SET moderations = moderations + 1 WHERE activity_date = (SELECT DATE()) AND user_id = $userId AND guild_id = $guildId;'
    ), //SELECTS
    getMessages: db.prepare(
        'SELECT SUM(messages) FROM activities WHERE user_id = ? AND guild_id = ? AND activity_date > date(\'now\', \'-\' || ? || \' day\' )'
    ),
    getModerations: db.prepare(`
    SELECT SUM(moderations) FROM activities WHERE user_id = ? AND guild_id = ? AND activity_date > date('now', '-' || ? || ' day' )`),
    getGuildMessages: db.prepare(
        'SELECT SUM(messages) as messages, user_id FROM activities WHERE guild_id = ? AND activity_date > date(\'now\', \'-\' || ? || \' day\' ) GROUP BY user_id ORDER BY 1 DESC;'
    ),
    getGuildModerations: db.prepare(
        'SELECT SUM(moderations) as moderations, user_id FROM activities WHERE guild_id = ? AND activity_date > date(\'now\', \'-\' || ? || \' day\' ) GROUP BY user_id ORDER BY 1 DESC;'
    ),
};

// BLACKLIST TABLE
const blacklist = {
    insertRow: db.prepare(
        'INSERT OR IGNORE INTO blacklist (user_id) VALUES (?);'
    ),
    add: db.prepare('INSERT OR REPLACE INTO blacklist(user_id) VALUES(?);'),
    remove: db.prepare('DELETE from blacklist WHERE user_id = ?;'),
    selectRow: db.prepare('SELECT * FROM blacklist WHERE user_id = ?;'),
};

// INTEGRATIONS TABLE
const integrations = {
    insertRow: db.prepare(
        'INSERT OR IGNORE INTO integrations (user_id) VALUES (?);'
    ),
    setTopGG: db.prepare('INSERT OR REPLACE INTO integrations(user_id, topgg) VALUES(?, ?);'),
    selectRow: db.prepare('SELECT * FROM integrations WHERE user_id = ?;'),
};

module.exports = {
    settings,
    users,
    confessions,
    SmashOrPass,
    bios,
    activities,
    blacklist,
    db,
    integrations
};
