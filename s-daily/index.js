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

function loginQueue(configs, userConfig) {
  const user = new Daily(userConfig);
  user.on('CLOSE', () => {
    if (configs.length > 0) {
      const nextConfig = configs.shift();
      loginQueue(configs, nextConfig);
    } else if (options.run) {
      process.exit(0); // 立即运行完成后退出
    }
  });
}

function runJob() {
  try {
    const configs = yaml.load(fs.readFileSync('config.yaml'));
    // 使用 slice 获取前 30 个配置，不修改原数组
    configs.slice(0, 30).forEach((userConfig) => {
      loginQueue([...configs], userConfig); // 使用扩展运算符确保传入副本
    });
  } catch (error) {
    console.error('Error loading config.yaml:', error);
  }
}

if (options.run) {
  runJob();
} else {
  schedule.scheduleJob(options.time ? options.time : '5 5 5,17 * * *', runJob);
}
