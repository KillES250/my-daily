const fs = require('fs');  
const yaml = require('js-yaml');  
const { Command } = require('commander');  
const schedule = require('node-schedule');  
const Daily = require('./source/librarys/daily');  
const program = new Command();  
  
program  
  .option('-r, --run', '立即运行所有任务后退出')  
  .option('-t --time <cron>', '设置定时任务执行时间（cron表达式）');  
  
program.parse(process.argv);  
const options = program.opts();  
  
// 用于标记是否所有任务已经完成  
let allTasksCompleted = false;  
  
function loginQueue(configs, userConfig, callback) {  
  const user = new Daily(userConfig);  
  user.on('CLOSE', () => {  
    if (configs.length > 0) {  
      const nextConfig = configs.shift();  
      loginQueue(configs, nextConfig, callback);  
    } else {  
      // 所有任务完成  
      callback();  
    }  
  });  
}  
  
function runTasksAndExit(configs) {  
  if (configs.length === 0) {  
    // 如果没有配置，则直接退出  
    process.exit(0);  
  }  
  
  loginQueue(configs, configs[0], () => {  
    // 所有任务完成后的回调  
    allTasksCompleted = true;  
    process.exit(0); // 所有任务完成后退出程序  
  });  
}  
  
if (options.run) {  
  const configs = yaml.load(fs.readFileSync('config.yaml'));  
  runTasksAndExit(configs);  
} else if (options.time) {  
  // 定时任务逻辑保持不变  
  schedule.scheduleJob(options.time, () => {  
    const configs = yaml.load(fs.readFileSync('config.yaml'));  
    configs.forEach((userConfig) => {  
      loginQueue([userConfig], userConfig, () => {  
        // 注意：这里的回调实际上在定时任务中不会被直接调用，  
        // 因为loginQueue在这里是独立为每个配置运行的，而不是像runTasksAndExit那样等待所有配置完成。  
        // 但为了保持函数签名的一致性，我们还是保留了它。  
      });  
      // 注意：在定时任务中，我们不会等待所有任务完成再退出，  
      // 因为定时任务的设计就是周期性执行的。  
    });  
  });  
}  
  
// 如果既没有指定-r也没有指定-t，则可能需要一个错误提示或默认行为  
if (!options.run && !options.time) {  
  console.error('请指定-r或-t选项。');  
  process.exit(1); // 非零退出码表示错误  
}  
  
// 注意：由于Node.js的事件循环，如果定时任务被设置，程序将不会立即退出，  
// 即使所有通过-r运行的任务已经完成。要完全避免这种情况，  
// 你需要确保在没有定时任务时退出程序，或者在程序的其他部分管理定时任务的生命周期。