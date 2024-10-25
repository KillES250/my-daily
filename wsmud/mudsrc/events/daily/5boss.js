const path = require('path');
const logger = require(path.resolve(__dirname, '../../../server/logger'));
const { tipback } = require('../../example/tipback.js');


let bossFightTestNum = 0;
let lunjiantop = false;
let yihuamgong = false;
let skillsForRedBoss = ['blade.xue'];

module.exports = async function (data) {
    switch (data.type) {
        case 'start':
            this.cmd.send('stopstate');
            // 这里需要获取玩家id
            this.cmd.send('score')
            // 移动到客栈
            this.cmd.send('jh fam 0 start;go north;go east')
            break;
        
        case 'dialog':
            if(data.dialog === 'score' && data.id){
                //id用于嗜血切内功
                this.userId = data.id
                //境界用于闭关判定
                this.userLevel = data.level;
            }
            // 判定为拾取
            else if(data.dialog === 'pack' && data.name){
                // 副本掉落分解
                this.gameInfo.useLessItems.includes(data.name) && this.cmd.send(`fenjie ${data.id}`);
                // 白色掉落丢弃
                data.name.includes('<wht>') && this.cmd.send(`drop ${data.count} ${data.id}`);
            }
            break;
            
        case 'room':
            this.room = data.name;
            this.roomPath = data.path;
            // 这里会跳转到item中拿到为推床次数做赋值
            if(this.room === '移花宫-邀月宫(副本区域)' || this.room === '移花宫-涟星宫(副本区域)'){
                this.cmd.send('look hua')
            }
            // 解决华山论剑台的重复判定
            if(this.roomPath === 'huashan/lunjian/top'){
                lunjiantop = true;
            }
            
            if(this.roomPath === 'huashan/yihua/damen'){
                yihuamgong = true;
            }
            break;
        
        case 'item':
            if(data.desc){
                const moveBedNum = data.desc.match(/你数了下大概有(.*?)朵花/);
                if(this.room === '移花宫-邀月宫(副本区域)'){
                    this.pushBedLeftNum = moveBedNum[1];
                } else if (this.room === '移花宫-涟星宫(副本区域)'){
                    this.pushBedRightNum = moveBedNum[1];
                }
            }
            break;
        
        case 'die':
            if(!data.relive){
                // 死亡
                this.relive = false;
            } else {
                // 已经复活
                this.relive = true;
                bossFightTestNum++;
                // 尝试次数小于3次，继续调用击杀流程，否则退出副本
                if (bossFightTestNum < 3) {
                    this.cmd.send('tm 调用击杀')
                } else {
                    logger.warning(`「${this.userConfig.name}」击杀${this.bossName}已失败超过3次，准备退出副本。`);
                    this.cmd.send('cr over');
                    this.cmd.send('tm 调用结束')
                } 
            }
            break;
            
        case 'combat':
            /*  逻辑说明：
                这里只处理被NPC主动叫杀战斗结束的情况
                如果是被boss击杀，则会先返回战斗结束end，天师符3秒站立起来后，会返回新的items，并且从items返回处继续跳转流程
                【战斗结束————> 买天师符 ————> 复活 ————> 获得新的items返回(boss存在)】这种情况不会在这里得到处理。
            */
            console.log(data);
            if (data.end && this.relive === true){
                // 添加一个循环判定，确保items返回被解析完成后再进行下一步动作
                while (this.itemsResult === false) {
                    await sleep(1);
                    if(this.itemsResult === true){
                        this.cmd.send('tm 调用当前路径判定');
                        break;
                    }
                }
                this.cmd.send('tm 调用当前路径判定');
            }
            break;
        
        case 'items':
            if(this.room === '扬州城-有间客栈'){
                for (const item of data.items) {
                    if (item && !item.p && item.name.includes('店小二')) {
                        this.cmd.send(`give ${item.id} 20000 money`);
                    }
                }
            }
            if(this.room.includes('副本区域')){
                this.npclist = [];
                for (const item of data.items) {
                    if (item && !item.p) {
                        if(item.name.includes(this.bossName)){
                            this.bossId = item.id;
                        } else {
                            this.npclist.push({name:item.name, id:item.id})
                        }
                    }
                }
                // 解析完毕，更改解析状态
                this.itemsResult = true;
                console.log(this.itemsResult)
                // 如果处于战斗会等待战斗结束跳转到上面的combat-end处进行处理
                if(this.isCombat === false){
                    this.cmd.send('tm 调用当前路径判定');
                }
            }
            break;
        
        case 'nowPath':
            // boss存在
            if(this.bossId){
                //清空路径
                this.fbPath = [];
                this.cmd.send('tm 调用击杀')
            } 
            // boss不存在
            else {
                // 删除上一步(已经成功执行得到正确返回的)路径
                this.fbPath.shift()
                // 重置items解析状态
                this.itemsResult = false;
                
                // 地主家判定
                // 可能出现没打到钥匙，员外还在这里就走不到西厢房，却收到没有钥匙的开门提示，提前结束副本
                if(this.roomPath === 'yz/cuifu/houyuan'){
                    const cuiyuanwai = this.npclist.find(item => item.name === '崔员外的尸体');
                    if(cuiyuanwai){
                        this.cmd.send('open men')
                    } else {
                        // 否则直接跳出，等待执行去西厢房被拦路跳转下杀
                        this.cmd.send('tm 调用下次路径判定')
                        break;
                    }
                }
                
                // 移花宫迷宫判定
                if(this.roomPath === 'huashan/yihua/yihua0' && yihuamgong === false){
                        this.cmd.send('go south');
                         // 这里循环被跳出后来到山道，等待 山道 的items的返回继续
                        break;
                }


                // 防止大门被立即调用
                if(this.roomPath === 'huashan/yihua/damen'){
                    await sleep(1);
                    this.cmd.send('tm 调用下次路径判定')
                    break;
                }
                //宫主房间判定(这里可能存在卡主的情况，暂不调整)
                if(this.roomPath === 'huashan/yihua/woshi'){
                    this.cmd.send('pushstart bed')
                    this.cmd.send(`${'pushleft bed;'.repeat(pushLeftNum)}`)
                    this.cmd.send(`${'pushright bed;'.repeat(pushRightNum)}`)
                    // 这里直接跳出等待tip返回继续
                    break;
                }
                
                // 燕子坞牌位判定
                if(this.roomPath === 'murong/houting'){
                    this.cmd.send(`${'bai pai;'.repeat(3)}`)
                    // 这里直接诶跳出，等待tip返回继续
                    break;
                }
                
                // 华山论剑台只有在未去过华山绝顶的情况下才发送解密信息
                if(this.roomPath === 'huashan/lunjian/tai' && lunjiantop === false){
                    this.cmd.send('jump bi')
                    // 这里直接跳出，等待items返回继续
                    break;
                }
                
                // 其他特殊房间的解密动作
                const decrypt = tipback.specPath.find(item => item.id === this.roomPath);
                if(decrypt){
                    this.cmd.send(decrypt.act)
                } //如果不是解密房间则继续跳转路径判定
                else {
                    this.cmd.send('tm 调用下次路径判定')
                }
            }
            break;
        
        case 'nextPath':
            // 如果路径长度不为0，则继续执行路径数组第一个指令
            if(this.fbPath.length > 0){
                this.cmd.send(this.fbPath[0]);
            } else {
                this.cmd.send('cr over')
                this.cmd.send('tm 调用结束');
            }
            break;
        
        case 'readyForKill':
            // 等待技能冷却
            while (this.cd.size > 0) {
                await sleep(1.5);
            }
            // 如果是探龙模式
            if(this.userConfig.redboss === false){
                // 清空技能黑名单
                this.skillsBanList = [];
                // 将血海加入黑名单
                this.skillsBanList = this.userSkills.filter(skill => !skillsForRedBoss.includes(skill));
                // 剑心+探龙
                this.cmd.send('enable force none;enable force cihangjiandian')
                this.cmd.send(`perform force.xin;perform ${this.tanlong}`)
            }
            else {
                this.cmd.send(`kill ${data.id}`)
            }
            break;
        
        case 'msg':
            if (data.ch === 'tm') {
                if(data.content === '调用击杀'){
                    this.emit('Data', { type: 'readyForKill' , id:this.bossId});
                } 
                else if (data.content === '调用结束') {
                    this.emit('Data', { type: 'next' });
                }
                else if (data.content === '调用当前路径判定'){
                    this.emit('Data', { type: 'nowPath' });
                }
                else if (data.content === '调用下次路径判定'){
                    this.emit('Data', { type: 'nextPath' });
                }
            }
            break;
        
        case 'tip':
            if (data.data.includes('说：')) {
                break;
            }
            // 黑木崖密道二次判定
            if(data.data === '你点燃了火折，发现墙上有个铁环，似乎是个机关。'){
                this.cmd.send('push')
                // 这里跳出，等待下一个tip的返回
                break;
            }
            // 解密失败的返回
            if(tipback.fail.test(data.data)){
                logger.warning(`${this.userConfig.name}，缺少副本必要条件，即将退出副本流程`);
                this.fbPath = []
                this.cmd.send('cr over')
                this.cmd.send('tm 调用结束');
                break;
            }
            // 堵路的返回
            if(tipback.blocking.test(data.data)){
                this.npclist.forEach(item => {
                    this.cmd.send(`kill ${item.id}`)
                });
                // 这里直接跳出,等待combat的end返回
                break;
            }
            // 解密动作反馈成功的返回
            if(tipback.success.test(data.data)){
                this.cmd.send('tm 调用下次路径判定')
                // 跳出
                break;
            }
            
            // 探龙成功继续调用击杀流程
            if(data.data.includes('偷到了')){
                this.cmd.send('tm 调用击杀');
                break;
            }
            
            // 流程失败判定
            if(/没有那么多的钱|店小二不要你的钱。/.test(data.data)){
                this.cmd.send('tm 调用结束');
                return
            }
            
            // 执行判定
            if (data.data.includes('这位客官，我最近听不少人说是')) {
                const bossMsg = data.data.match(/我最近听不少人说是在(.*?)见到过(.*?)。/);
                // 获取副本，boss名字
                this.bossName = bossMsg[2].trim();
                const dest = bossMsg[1].trim();
                const fbWayArray = Object.entries(this.gameInfo.fbWay);
                const fbWayEntry = fbWayArray.find(entry => entry[0] === dest);
                if (fbWayEntry) {
                    // 建立数组，开始执行寻路
                    this.fbPath = fbWayEntry[1].split(';');
                    this.cmd.send(this.fbPath[0]);
                } else {
                    logger.warning(`「${this.userConfig.name}」解析boss信息失败，准备退出流程。`);
                    this.cmd.send('tm 调用结束');
                }
            }
            break;
        
        case 'itemremove':
            if(this.bossId && this.bossId === data.id){
                // 发现boss的时候路径被全部删除，
                // 这里赋值为空，会在战斗结束后调用路径，跳转至路径判定(路径为0处)，然后结束副本
                this.bossId = null;
                return
            }
            break;
        default:
            break;
    }
}

async function sleep(seconds) {
    return new Promise(resolve => {
        setTimeout(resolve, seconds * 1000);
    });
}