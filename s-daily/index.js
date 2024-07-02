const fs = require('fs');
const yaml = require('js-yaml');
const { Command } = require('commander');
const schedule = require('node-schedule');
const Daily = require('./source/librarys/daily');
const program = new Command();

program
  .option('-r, --run', '立即运行一次')
  .option('-t --time <cron>', '设置定时<cron表达式>');

program.parse(process.argv);
const options = program.opts();

function loginQueue(configs, userConfigs) {
  const users = userConfigs.map(userConfig => new Daily(userConfig));
  const closePromises = users.map(user => new Promise((resolve) => user.on('CLOSE', resolve)));

  Promise.all(closePromises).then(() => {
    if (configs.length > 0) {
      const nextConfigs = configs.splice(0, 15);
      loginQueue(configs, nextConfigs);
    } else {
      if (options.run) {
        process.exit(); // 退出程序
      }
    }
  });
}

function runLogin() {
  const configs = yaml.load(fs.readFileSync('config.yaml'));
  const firstConfigs = configs.splice(0, 15);
  loginQueue(configs, firstConfigs);
}

if (options.run) {
  runLogin();
}

schedule.scheduleJob(options.time ? options.time : '5 5 5,17 * * *', () => {
  runLogin();
});
