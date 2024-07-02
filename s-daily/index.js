const fs = require('fs');
const yaml = require('js-yaml');
const { Command } = require('commander');
const Daily = require('./source/librarys/daily');
const program = new Command();

program
  .option('-r, --run', '立即运行一次')
  .option('-t --time <cron>', '设置定时<cron表达式>');

program.parse(process.argv);
const options = program.opts();

let configs;
try {
  configs = yaml.load(fs.readFileSync('config.yaml'));
} catch (error) {
  console.error('Error reading or parsing config.yaml:', error);
  process.exit(1);
}

function loginQueue(configs, userConfig, callback) {
  const user = new Daily(userConfig);
  user.on('CLOSE', () => {
    if (configs.length > 0) {
      const nextConfig = configs.shift();
      loginQueue(configs, nextConfig, callback);
    } else if (callback) {
      callback(); // 当所有任务完成时，执行回调
    }
  });
}

if (options.run) {
  configs.splice(0, 30).forEach((userConfig) => {
    loginQueue(configs, userConfig, () => {
      console.log('所有任务已完成，程序即将退出.');
      process.exit(0); // 所有任务完成后退出程序
    });
  });
} else {
  const schedule = require('node-schedule');
  schedule.scheduleJob(options.time ? options.time : '5 5 5,17 * * *', () => {
    const scheduledConfigs = yaml.load(fs.readFileSync('config.yaml'));
    scheduledConfigs.splice(0, 30).forEach((userConfig) => {
      loginQueue(scheduledConfigs, userConfig);
    });
  });
}
