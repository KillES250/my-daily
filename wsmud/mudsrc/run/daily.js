const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const userconfig = path.resolve(__dirname, '../../userconfig/userconfig.yaml');
const Daily = require('../example/daily.js');

async function rundaily() {

        roles.slice(0, 30).forEach((userConfig) => {
            loginQueue(configs, userConfig);
        });
}

function loginQueue(configs, userConfig) {
    const user = new Daily(userConfig);
    user.on('CLOSE', () => {
        if (configs.length > 0) {
            const nextConfig = configs.shift();
            loginQueue(configs, nextConfig);
        }
    });
}

if (require.main === module) {
    rundaily();
}

module.exports = { 
    rundaily 
};