const fs = require('fs');
const yaml = require('js-yaml');
const { Command } = require('commander');
const Daily = require('./source/librarys/daily');

const program = new Command();

program
  .option('-r, --run', '立即运行一次')
  .option('-d, --debug', 'debug模式');

program.parse(process.argv);
const options = program.opts();
global.debugMode = options.debug ? true : false;

function loginQueue(configs, userConfig) {
  const user = new Daily(userConfig);
  user.on('CLOSE', () => {
    if (configs.length > 0) {
      const nextConfig = configs.shift();
      loginQueue(configs, nextConfig);
    }
  });
}

function run() {
  const configs = yaml.load(fs.readFileSync('config.yaml'));
  const roles = Array.isArray(configs) ? configs : configs.roles;
  global.pushplusToken = configs.pushplus ? configs.pushplus : '';
  roles.splice(0, 30).forEach((userConfig) => {
    loginQueue(configs, userConfig);
  });
}

if (options.run) {
  run();
}