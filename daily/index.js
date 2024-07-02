const fs = require('fs');
const yaml = require('js-yaml');
const { Command } = require('commander');
const Daily = require('./source/librarys/daily');
const program = new Command();

program
  .option('-r, --run', '立即运行一次')
  .option('-d, --debug', 'debug模式')
  .option('-t, --time <cron>', '设置定时<cron表达式>');

program.parse(process.argv);
const options = program.opts();
global.debugMode = options.debug ? true : false;

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

function run() {
  const configs = yaml.load(fs.readFileSync('config.yaml'));
  const roles = Array.isArray(configs) ? configs : configs.roles;
  roles.splice(0, 30).forEach((userConfig, index) => {
    loginQueue(configs, userConfig, () => {
      if (index === roles.length - 1) {
        console.log('所有任务已完成，程序即将退出.');
        process.exit(0); // 执行完所有任务后退出程序
      }
    });
  });
}

if (options.run) {
  run();
}

if (options.time) {
  // 如果需要处理定时任务的逻辑，可以在这里添加
  console.log('定时任务:', options.time);
}
