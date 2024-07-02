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

function loginQueue(configs, userConfig, shouldExit) {
  const user = new Daily(userConfig);
  user.on('CLOSE', () => {
    if (configs.length > 0) {
      const nextConfig = configs.shift();
      loginQueue(configs, nextConfig, shouldExit);
    } else {
      if (shouldExit) {
        console.log('所有任务已完成，程序将退出。');
        process.exit(0); // 退出程序
      }
    }
  });
}

if (options.run) {
  const configs = yaml.load(fs.readFileSync('config.yaml'));
  configs.splice(0, 30).forEach((userConfig, index) => {
    const shouldExit = index === configs.length - 1; // 设置最后一个任务完成后退出程序
    loginQueue(configs, userConfig, shouldExit);
  });
}

schedule.scheduleJob(options.time ? options.time : '5 5 5,17 * * *', () => {
  const configs = yaml.load(fs.readFileSync('config.yaml'));
  configs.splice(0, 30).forEach((userConfig, index) => {
    const shouldExit = index === configs.length - 1; // 设置最后一个任务完成后退出程序
    loginQueue(configs, userConfig, shouldExit);
  });
});
