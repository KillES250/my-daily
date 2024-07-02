const fs = require('fs');
const yaml = require('js-yaml');
const { Command } = require('commander');
const Daily = require('./source/librarys/daily');
const program = new Command();

program
  .option('-r, --run', '立即运行一次');

program.parse(process.argv);
const options = program.opts();

function loginQueue(configs) {
  if (configs.length === 0) {
    process.exit(0); // 所有任务完成时退出程序
    return;
  }

  const userConfig = configs.shift();
  const user = new Daily(userConfig);
  user.on('CLOSE', () => {
    loginQueue(configs); // 当前批次任务完成后，立即处理下一批次任务
  });
}

if (options.run) {
  const allConfigs = yaml.load(fs.readFileSync('config.yaml'));
  let currentIndex = 0;
  
  // 定义一个函数来处理一批任务
  function processBatch() {
    const batchConfigs = allConfigs.slice(currentIndex, currentIndex + 10);
    currentIndex += 10;
    if (batchConfigs.length > 0) {
      loginQueue(batchConfigs);
    }
  }

  // 初始执行第一批任务
  processBatch();

  // 在每批任务完成后，立即读取并运行下一批任务
  setInterval(() => {
    processBatch();
  }, 1000); // 每秒检查一次是否有新的批次需要处理
}
