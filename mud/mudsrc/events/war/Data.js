const path = require('path');
const logger = require(path.resolve(__dirname, '../../../server/logger'));

module.exports = async function (data) {
    switch (data.type) {
        case 'login':
            logger.success(`「${this.userConfig.name}」登录成功`);
            // 关闭自动出招、自动反击、自动工作。开启自动拾取
            this.cmd.send('setting auto_pfm 0;setting auto_pfm2 0;setting auto_work 0;setting auto_get 1');
            this.cmd.send('relive;cr over')
            this.cmd.send('stopstate');
            this.cmd.send(this.userConfig.loginCommand);
            if(this.userConfig.war.family === true){
                console.log('门派模式')
                this.emit('Data',{type:'start'});
            }else {
                if (this.room !== '帮会-练功房') {
                    this.cmd.send('jh fam 0 start;go south;go south;go east;go east;go east;go north')
                 }
            }
        case 'room':
            this.room = data.name;
            if(data.name === '帮会-练功房'){
                if (this.userConfig.war.leader === true) {
                    this.off('Data', require('../war/leader.js'))
                    this.on('Data', require('../war/leader.js'))
                }else {
                    this.off('Data', require('../war/participant.js'))
                    this.on('Data', require('../war/participant.js'))
                }
                this.emit('Data', { type: 'start' });  
            }
            break
        case 'end':
            if(this.userConfig.war.leader === true){
                this.cmd.send('enable blade yuanyuewandao')
            } else if(this.userConfig.war.leader === false){
                this.enableSkills.forEach(enableCmd => {
                    this.cmd.send(enableCmd)
                });
            }
            this.cmd.send(
                /ord|hio/.test(this.userLevel)
                    ? 'jh fam 0 start;go west;go west;go north;go enter;go west;xiulian'
                    : 'wakuang',
            );
            break;
        case 'tip':
            if (/你挥着铁镐开始认真挖矿|你盘膝坐下开始闭关修炼/.test(data.data)) {
                clearTimeout(this.timers.fix);
                clearInterval(this.timers.pfm);
                this.cmd.send(this.userConfig.logoutCommand);
                logger.success(`「${this.userConfig.name}」退出登录`);
                this.socketClose();
            }
            break;
        default:
            break;
    }
};