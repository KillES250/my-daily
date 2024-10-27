const path = require('path');
const logger = require(path.resolve(__dirname, '../../../server/logger'));
module.exports = async function (data) {
    // 妖神之力持续期间释放的技能数组
    const skillsToYaoShen = ['force.xin', 'force.ding', 'force.zhen', 'parry.dao','force.power','force.busi'];
    
    // 下一步任务（入参当前任务）
    const nextStep = (target) => {
        this.taskList = this.taskList.filter(item => item !== target);
        if (this.taskList.length === 0) {
            this.taskEnd = true;
            this.cmd.send(
                /ord|hio/.test(this.userLevel)
                    ? 'jh fam 0 start;go west;go west;go north;go enter;go west;xiulian'
                    : 'wakuang',
                );
        }else{
            this.cmd.send(this.gameInfo.week.way[this.taskList[0]]);
        }
    };
    
    // 自创技能装备、卸下
    const changeSkills = (action) => {
        if (action === 'add') {
            for (const key in this.enableSkillList) {
                const item = this.enableSkillList[key];
                this.cmd.send(`enable ${item.type} ${item.id}`);
            }
        } else if (action === 'remove') {
            for (const key in this.enableSkillList) {
                const item = this.enableSkillList[key];
                this.cmd.send(`enable ${item.type} none`);
            }
        }
    };

    //内部循环 
    switch (data.type) {
        case 'login':
            logger.success(`「${this.userConfig.name}」登录成功`);
            await sleep(3);
            if (this.room !== '住房-练功房' && this.room !== '扬州城-矿山' && this.room !== '帮会-练功房'){
                logger.error(`「${this.userConfig.name}」角色异常，请登录挖矿或闭关`);
                this.socketClose();
            }
            this.star = true;
            this.cmd.send('stopstate');
            this.cmd.send(this.userConfig.loginCommand);
            this.cmd.send('score');
            await sleep(3);
            this.taskList = createTask(this.userConfig.week);
            this.cmd.send(this.gameInfo.week.way[this.taskList[0]]);
            break;
        case 'loginerror':
            logger.error(`「${this.userConfig.name}」登录失败`);
            this.socketClose();
            break;
        case 'room':
            this.room = data.name;
            if(this.star === true){
                if(this.room === '墓园-弑妖塔' && this.canSeamless === false){
                    this.cmd.send(`use ${this.xuanlingdan.id}`)
                    this.xuanlingdan.num -= 1
                }else if (this.room === '扬州城-武庙'){
                    this.cmd.send('liaoshang');
                }else if (this.room === '武道塔-第一层'){
                    logger.info(`「${this.userConfig.name}」请先完成爬塔日常`)
                    nextStep('tazhu');
                }
            }
            break;
        case 'items':
            if(this.star === true){
                if(this.room === '襄阳城-广场'){
                    let found = false;
                    for(const target of data.items){
                        if(target.id && !target.p && target.name.includes('郭靖')){
                            this.cmd.send(`juanxian2 ${target.id}`)
                            found = true;
                        }
                    }
                    if (!found) {
                        logger.info(`「${this.userConfig.name}」"没有找到名为'郭靖'的目标"`)
                        nextStep('xiangyang')
                    }
                }
                else if(this.room === '扬州城-镖局正厅'){
                    for(const target of data.items){
                        if(target.id && !target.p && target.name.includes('林震南')){
                            this.cmd.send(`ksyb ${target.id}`)
                            this.cmd.send(`task yunbiao ${target.id} qkstart`)
                        }
                    }
                }
                else if(this.room === '武道塔-第一百层'){
                    for(const target of data.items){
                        if(target.id && !target.p && target.name.includes('武道塔主')){
                            // 嗜血的判定，禁用所有技能
                            if(this.userConfig.week.tazhu === false){
                                this.skillsBanList = this.userSkills
                            }
                            this.cmd.send(`kill ${target.id}`)
                        }
                    }
                }
                else if(this.room === '古大陆-墓园'){
                    if(this.yaoshen === null && this.yaoshenTestNum < 3){
                        for(const target of data.items){
                            if(target.id && !target.p && target.name.includes('守墓老人')){
                                // 添加失败冷却等待,清除出招
                                await sleep(10);
                                clearTimeout(this.timers.fix);
                                clearInterval(this.timers.pfm);
                                //无缝判定
                                if(this.canSeamless === null){
                                    logger.info(`「${this.userConfig.name}」"无法确认妖神方案(技能查找失败)"`)
                                    nextStep('yaoshen')
                                    break;
                                }else if(this.canSeamless === false && !this.xuanlingdan.id && this.xuanlingdan.num >= 1){
                                    logger.info(`「${this.userConfig.name}」"无法达成妖神条件(不具备无缝条件)"`)
                                    nextStep('yaoshen')
                                    break;
                                }
                                // 魔刀判定 切换技能(空明)
                                if(this.userSkills.includes('blade.ru')){
                                    changeSkills('remove')
                                    this.cmd.send('zc pfmdel force cihangjiandian xin ok2;zc pfmdel force changshengjue zhen ok2;zc pfmdel force nitiandao nian ok2;zc pfmdel force kumushengong tu ok2')
                                    this.cmd.send('zc pfmadd force jiuyangshengong power ok;zc pfmadd force taixuangong shi ok;')
                                    this.cmd.send('enable force changshengjue;perform force.zhen')
                                    changeSkills('add')
                                    this.cmd.send('enable parry qiankundanuoyi')
                                }else if (this.kongmingquan === true ){
                                    this.cmd.send('enable unarmed kongmingquan')
                                }
                                // 施法重组
                                this.skillsBanList = this.userSkills.filter(skill => !skillsToYaoShen.includes(skill));
                                this.cmd.send(`sss muyuan`)
                                this.yaoshenTestNum++;
                            }
                        }
                    }
                    else if(this.yaoshen === true || this.yaoshenTestNum === 3){
                        // 魔刀判定 装回技能
                        if (this.userSkills.includes('blade.ru')){
                            await changeSkills('remove')
                            this.cmd.send('zc pfmdel force jiuyangshengong power ok2;zc pfmdel force taixuangong shi ok2;')
                            this.cmd.send('zc pfmadd force cihangjiandian xin ok;zc pfmadd force kumushengong tu ok;zc pfmadd force changshengjue zhen ok;')
                            this.cmd.send('enable force changshengjue;perform force.zhen')
                            await changeSkills('add')
                            this.cmd.send('enable parry yihuajiemu')
                            this.cmd.send(`enable parry ${this.userId}`)
                        }
                        nextStep('yaoshen')
                    }
                }
            }
            break;
        case 'tip':
            // 测试打印的代码
            if(!data.data.includes('闪烁着妖异魔光，摄人心魂')){
                console.log(data.data);
            }
            if(data.data.includes('说：')){
                return;
            }
            if(this.star === true){
                if(data.data.includes('才可以再次进入襄阳城') || data.data.includes('你还是不要去添乱了。') || data.data.includes('已经有太多人参与守城了')){
                    nextStep('xiangyang')
                }
                else if(this.room === '襄阳城-广场'){
                    if(
                        data.data.includes('黄金获得了') ||
                        data.data.includes('你身上的黄金不够。') ||
                        data.data.includes('你的军功已经领取过了！')
                        ){
                            nextStep('xiangyang')
                        }
                }
                else if(this.room === '扬州城-镖局正厅'){
                    if(
                        data.data.includes('最近暂时没有委托，你先休息下吧') ||
                        data.data.includes('林震南说道：钱不够就自己运镖啊！') ||
                        data.data.includes('林震南说道：只有总镖头才可以雇佣镖师。') ||
                        data.data.includes('林震南说道：你精力不足，好好休息下再来。')
                    ){
                        nextStep('yunbiao')
                    }
                    else if(data.data.includes('林震南说道：现在有')){
                        await sleep(15)
                        nextStep('yunbiao')
                    }
                }
                else if(this.room === '武道塔-第一百层'){
                    if(data.data.includes('你先处理好自己的状态再说！')){
                        this.cmd.send(this.gameInfo.temple.way)
                    }
                    else if(data.data.includes('你的挑战失败了。')){
                        if(this.tazhuTestNum <= 3){
                            this.cmd.send(this.gameInfo.temple.way)
                            this.tazhuTestNum++
                        }else{
                            nextStep('tazhu')
                        }
                    }
                    else if(data.data.includes('恭喜你战胜了<ord>武道塔主</ord>。')){
                        nextStep('tazhu');
                    }else if(data.data.includes('慢慢的你又恢复了知觉') && this.isCombat === false){
                        this.cmd.send(this.gameInfo.temple.way)
                    }
                } 
                else if (this.room === '古大陆-墓园'){
                    if(data.data.includes('你的精力不够，不能开启弑妖塔。') || data.data.includes('你尚未通关弑妖塔，不能挑战妖神。') || data.data.includes('你本周已经挑战过妖神，本妖塔需要恢复一段时间才可以继续挑战。')){
                        nextStep('yaoshen')
                    }
                }
                else if (this.room === '墓园-弑妖塔'){
                    if(
                        data.data.includes('<hir>朱雀</hir>的躯体崩解为碎片。') ||
                        data.data.includes('<hic>青龙</hic>的躯体崩解为碎片。') ||
                        data.data.includes('<hiw>白虎</hiw>的躯体崩解为碎片。')
                    ){
                        this.yaoshen = false;        
                    }
                    else if(data.data.includes('<hig>玄武</hig>的躯体崩解为碎片。')){
                        this.yaoshen = true;
                    }
                    
                }
                else if(this.room === '扬州城-武庙'){
                    if(data.data.includes('<hiy>你疗伤完毕，深深吸了口气，脸色看起来好了很多。</hiy>')){
                        //嗜血且当前任务是塔主的判定
                        if(this.userConfig.week.tazhu === false && this.gameInfo.week.way[this.taskList[0]] === 'jh fam 9 start;go enter'){
                            this.skillsBanList = this.userSkills
                        }
                        // 防止武庙无法破碎虚空
                        this.cmd.send('go east');
                        this.cmd.send(this.gameInfo.week.way[this.taskList[0]])
                    }
                }
            }
            break;
        case 'sc':
            if(data.id === this.userId && data.hp){
                const hpPercent = data.hp / this.userMaxHp;
                // 嗜血气血低于0.5的时候，只禁用血海魔刀（解开全自动施法）
                if(this.userConfig.week.tazhu === false && hpPercent < 0.5 && this.room === '武道塔-第一百层'){
                    this.skillsBanList = ['blade.xue'];
                }
            }
            break;
        case 'dialog':
            if(data.dialog === 'score'){
                if(data.level){
                    this.userId = data.id
                    this.userLevel = data.level
                    this.userMaxHp = data.max_hp
                    this.cmd.send('score2');
                }
                if(data.distime){
                    this.danColor = getDanColor(data.distime)
                    this.cmd.send('cha');
                }
            }
            else if(data.dialog === 'skills'){
                for(const key in data.items){
                    const skill = data.items[key]
                    if(skill.enable_skill && skill.enable_skill === this.userId){
                        this.enableSkillList.push({ type: skill.id, id: this.userId })
                    }
                    if(skill.id === 'kongmingquan' && skill.level > 3000){
                        this.kongmingquan = true;
                    }
                }
                this.cmd.send('pack');
            }
            else if (data.dialog === 'pack'){
                for(const key in data.items){
                    const item = data.items[key]
                    if(item.name.includes(this.danColor)){
                        this.xuanlingdan.id = item.id;
                        this.xuanlingdan.num = item.count;
                    }
                }
            }
            break;
        case 'state':
            if(this.taskEnd === true){
                if(data.state === '你正在挖矿中' || data.state === '你正在闭关'){
                    this.cmd.send(this.userConfig.logoutCommand);
                    logger.success(`「${this.userConfig.name}」本次周常完成，退出登录。`);
                    this.socketClose();
                }
            }
            break;
        case 'status':
            if(this.room === '墓园-弑妖塔'){
                // 无缝黄玄灵判定
                if(data.action === 'remove' && data.sid === 'food' && data.id === this.userId){
                    if(this.xuanlingdan.num >= 1){
                        this.cmd.send(`use ${this.xuanlingdan.id}`)
                        this.xuanlingdan.num -= 1
                    }
                }
                // 妖神之力消失候解开全自动施法
                else if(data.action === 'remove' && data.sid === 'bite' && data.id !== this.userId){
                    this.skillsBanList = []
                }
            }
            break;
        case 'itemadd':
            // 当房间内新增妖神时，妖神状态更新为null，表示未完成
            if(this.room === '墓园-弑妖塔'){
                this.yaoshen = null;
            }
            break;
        case 'itemremove':
            if(this.room === '墓园-弑妖塔'){
                // 等待3秒获取妖神被击杀的判定
                await sleep(3);
                // 如果玄武被击杀，则离开副本
                if(this.yaoshen === true){
                    this.cmd.send('lkfb ok');
                }
                // 如果朱雀、白虎、青龙被击杀，则禁止施法，（skillsToYaoShen）中的技能除外。
                else if(this.yaoshen === false){
                    await sleep(7);
                    this.skillsBanList = this.userSkills.filter(skill => !skillsToYaoShen.includes(skill));
                    this.cmd.send('lkfb next');
                }
                // 如果没有被击杀的判定（击杀失败），放弃奖励离开副本
                else if (this.yaoshen === null) {
                    this.cmd.send('lkfb gu');
                }
            }
            break;
        case 'cmds':
            // 破碎虚空的判定
            const muyuan = data.items.find(way => way.name.includes('传送到古大陆-墓园'));
            if(muyuan){
                this.cmd.send(muyuan.cmd)
            }
            break;
        default:
            break;
        }
};

// 创建任务列表的函数
function createTask(weekConfig) {
    const tasks = [];
    for (const key in weekConfig) {
        if (weekConfig.hasOwnProperty(key)) {
            if (key === 'xiangyang' || key === 'yunbiao') {
                if (weekConfig[key]) {
                    tasks.push(key);
                }
            } else if (key === 'tazhu' || key === 'yaoshen') {
                if (weekConfig[key] !== null) {
                    tasks.push(key);
                }
            }
        }
    }
    return tasks;
}
// 定义丹药颜色的函数
function getDanColor(data){
    const regex = /(\d+(\.\d+)?)秒\+(\d+)%/;
    const match = data.match(regex);
    let dancolor = null;
    if (match) {
        const fixed = parseFloat(match[1]);
        const pre = parseInt(match[3], 10);
        const nendDanPre = (1 - 10 / (60 - fixed)) * 100 - pre;
        if (nendDanPre < 10){
            dancolor = '<hiy>玄灵丹</hiy>';
        } else if (nendDanPre < 15){
            dancolor = '<HIZ>玄灵丹</HIZ>';
        } else if (nendDanPre < 20){
            dancolor = '<hio>玄灵丹</hio>';
        } else {
            dancolor = null;
        }
        return dancolor;
    } else {
        console.error('未找能正确匹配');
        return dancolor;
    }
}
async function sleep(seconds) {
    return new Promise(resolve => {
        setTimeout(resolve, seconds * 1000);
    });
}

