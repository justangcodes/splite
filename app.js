global.__basedir = __dirname;
const Client = require('./src/Client.js');
const {Statics} = require('./src/utils/utils');
require('./src/utils/prototypes').arrayProto(Array);
const Webserver = require('./src/Webserver.js');
const config = Statics.config;

const client = new Client(config, {
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
    allowedMentions: {parse: ['users', 'roles'], repliedUser: true},
});

client.loadEvents('./src/events');
client.loadTopics('./data/trivia', 'trivia');
client.loadTopics('./data/geoguessr', 'geoguessr');

client.login(client.config.token).then(() => {
    client.loadCommands('./src/commands');
    client.handleMusicEvents();

    if (config.owners.length) {
        client.owners = config.owners.map(ownerId => client.users.fetch(ownerId).then(user => user.id).catch(() => {
            client.logger.error(`Owner with ID ${ownerId} not found.`);
            return null;
        }));

        Promise.all(client.owners).then(owners => {
            client.owners = owners.filter(owner => owner !== null);
            client.logger.info(`Bot owners: ${client.owners.length ? client.owners : 'None'}`);
        });
    }
    if (config.managers?.length) {
        client.managers = config.managers.map(managerId => client.users.fetch(managerId).then(user => user.id).catch(() => {
            client.logger.error(`Manager with ID ${managerId} not found.`);
            return null;
        })).filter(manager => manager);

        Promise.all(client.managers).then(managers => {
            client.managers = managers.filter(manager => manager !== null);
            client.logger.info(`Bot managers: ${client.managers.length ? client.managers : 'None'}`);
        });
    }

    if (config.webserver.enabled) {
        new Webserver(client);
    }
    else {
        client.logger.info('Skipped WebServer creation. Set "useWebServer" to true in config.yaml to enable it.');
        if (config.apiKeys.topGG.useMode === 'webhook_mode') {
            throw('"topGG.useMode" mode is set to webhook mode, but "webserver.enabled" is set to false. Consider setting "topGG.useMode" to "api_mode" or setting "webserver.enabled" to true.');
        }

    }
}).catch(err => {
    console.error(err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    client.logger.error(err);
    console.log(err);
});
