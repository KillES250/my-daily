const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const time = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../../userconfig/userconfig.yaml')));

var skillsForGangleader = ['force.xin'];

module.exports = async function (data) {
    switch (data.type) {
        case 'start':
            this.off('Data',require('../autopfm/autopfm.js'));
            this.on('Data',require('../autopfm/autopfm.js'));
            const listeners = this.listeners('Data');
            console.log(`【${this.userConfig.name}】`,listeners);
            this.cmd.send('score');
            break;
            
        case 'dialog':
            //获取角色信息
            if (data.dialog === 'score' && data.level) {
                this.userId = data.id
                this.userLevel = data.level
                this.userMaxHp = data.max_hp
                this.cmd.send('enable blade none')
                this.warMode = initWarmode();
                if (this.warMode === 'r'){
                    this.cmd.send('enable blade yuanyuewandao');
                    this.startKill = true;
                }else if (this.warMode === 'o'){
                    this.cmd.send('enable blade xiuluodao');
                    skillsForGangleader.push('unarmed.qi');
                    skillsForGangleader.push('force.ding');
                }
                // 切换技能后等待pfm的返回绑定自动出招
                await sleep(5);
                // 为自动出招提供自动施法的技能
                this.skillsBanList = this.userSkills.filter(skill => !skillsForGangleader.includes(skill));
                this.cmd.send('go south');
                this.cmd.send('perform force.tu');
                await sleep(15);
                this.cmd.send('party fam HUASHAN');
            }
            // 拾取分解 
            else if (data.dialog === 'pack' && data.name) {
                if (!data.name.includes('<hio>') && !data.name.includes('<wht>')){
                    this.cmd.send(`fenjie ${data.id}`);
                }
            }
            break;
            
        case 'tip':
            if(data.data.includes('加油，加油！！') || data.data.includes('你要捡什么东西？') || data.data.includes('说：')){
                return;                
            }
            if(data.data.includes('你现在是灵魂状态，不能那么做。')){
                this.cmd.send('relive')
                return;
            }
            console.log(`【${this.userConfig.name}】`,data.data);
            if(data.data.includes('正在进攻别的门派') || data.data.includes('帮派活跃度不够，无法开启门派战。')){
                this.cmd.send('pty 无法开启帮战');
            }
            break;
            
        case 'msg':
            if(data.ch === 'pty'){
                if(data.content.includes('即刻起开始进攻')){
                    this.war = 'start';
                    this.timerOfHaoLing = setInterval(() => {
                        this.haoLingNum += 1;
                        if(this.haoLingNum === 5){
                            this.cmd.send(`pty 开始击杀`)
                        }
                    }, 300000); // 5分钟为300000毫秒
                    this.cmd.send(this.gameInfo.war.way);
                }
                else if(data.content.includes('最终胜利') || data.content.includes('点子扎手') || data.content.includes('无法开启帮战')){
                    this.war = 'finish';
                    if (this.timerOfHaoLing) {
                        clearInterval(this.timerOfHaoLing);
                    }
                    await sleep(6);
                    this.emit('Data',{type:'end'}); 
                }
                else if(data.content.includes('开始击杀')){
                    this.skillsBanList = []
                    this.startKill = true;
                    const killId = findLastId(this.warNpcId)
                    this.cmd.send(`kill ${killId}`)
                }
            }
            break;
            
        case 'items':
            if(this.room === '华山派-客厅'){
                if (this.warNpcId[0].id) {
                    this.cmd.send(`kill ${this.warNpcId[0].id}`);
                } 
                else if (this.warNpcId[1].id){
                    this.cmd.send(`kill ${this.warNpcId[1].id};kill ${this.warNpcId[1].id}`);
                } 
                else if (!this.warNpcId[1].id){
                    for(const key in data.items){
                        const item = data.items[key];
                        if(item.id && item.name.includes('岳不群')){
                            this.warNpcId[1].id = item.id;
                        }else if (item.id && item.name.includes('华山派长老')){
                            if(!this.warNpcId[2].id){
                                this.warNpcId[2].id = item.id;
                                this.cmd.send(`kill ${this.warNpcId[2].id}`);
                            }else{
                                this.warNpcId[3].id = item.id;
                            }
                        }
                    }
                    this.cmd.send(`kill ${this.warNpcId[2].id}`)
                }
            }
            break;

        case 'itemadd':
            if(this.room === '华山派-客厅' && data.name.includes('独孤败天') && !data.p){
                this.warNpcId[0].id = data.id;
                this.cmd.send(this.gameInfo.week.way.yaoshen);
            }
            // if (this.room === '华山派-客厅' && data.name.includes('的尸体') && !data.p){
            //     this.cmd.send(`get all form ${data.id}`)
            // }
            break;
        
        case 'itemremove':
            if(this.room === '华山派-客厅'){
                //forEach会改变原数组
                this.warNpcId.forEach(npc => {
                    if(npc.id === data.id){
                        npc.id = null;
                        const killId = findLastId(this.warNpcId)
                        this.cmd.send(`kill ${killId}`)
                    }else{
                        return;
                    }
                })
            }
            break;
        
        case 'cmds':
            const muyuan = data.items.find(way => way.name.includes('传送到古大陆-墓园'));
            if(muyuan){
                skillsForGangleader.push('force.ding');
                this.cmd.send(muyuan.cmd)
            }
            break;
        
        case 'room':
            this.room = data.name;
            if(this.room === '古大陆-墓园'){
                while (true) {
                    await sleep(1);
                    if(!this.userStatus.has('bss')){
                        this.cmd.send('enable blade xiuluodao');
                        this.startKill === false;
                        this.cmd.send(this.gameInfo.war.way);
                        break;
                    }
                }
            }
            break;
               
        case 'sc':
            if (this.room === '华山派-客厅') {
                for (const npc of this.warNpcId) {
                    if (npc.id === data.id) {
                        const hpPer = data.hp / npc.maxHp;
                        npc.hpPer = hpPer;
                        break;
                    }
                }
            }
            break;
            
        case 'shift':
                if (this.startKill === false){
                    this.cmd.send(`kill ${data.id};kill ${data.id}`, false);
                    this.cmd.send('perform blade.xiu;perform dodge.yao');
                    const nextId = getNextId(data.id, this.warNpcId);
                    this.cmd.send(`kill ${nextId}`);
                }
            break;
            
        case 'dispfm':
            if(data.id === 'dodge.yao'){
                const pfmtuloop = () => {
                    if (!this.cd.has('force.tu')){
                        this.cmd.send('perform force.tu');
                        return;
                    }
                    setTimeout(pfmtuloop, 500);
                }
                pfmtuloop();
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

function initWarmode() {
    let warTimes = [];
    const currentHour = new Date().getHours();
    if (time.wartime.includes('|')) {
        warTimes = time.wartime.split('|');
    } else {
        warTimes = [time.wartime];
    }
    for (let time of warTimes) {
        const match = time.match(/^(\d{2}):(\d{2})(\S+)$/);
        if (match) {
            const hourStr = parseInt(match[1]);
            const mode = match[3];
            const hour = parseInt(hourStr);
            if (hour === currentHour) {
                if (mode === '红') {
                    const warmode = 'r';
                    return warmode;
                } else if (mode === '橙') {
                    const warmode = 'o';
                    return warmode;
                }else {
                    console.log('未知模式');
                    return 'none';
                }
            }
        }
    }
}

function getNextId(element,arr) {
    if (arr[0].id !== null){
        const result = arr[0].id;
        return result;
    } else {
        const arrtmp = arr.filter(item=>item.id != null)
        const index = arrtmp.findIndex(item => item.id === element);
        // const index = arr.filter(item => item.id != null).findIndex(item => item.id === element);
        const nextIndex = (index + 1) % arrtmp.length;
        return arrtmp[nextIndex].id;
    }
}

function findLastId(arr) {
    if (arr[0].id !== null){
        return arr[0].id;
    }
    const arrtmp = [...arr]
    const result = arrtmp.reverse().find(item => item.id !== null);
    return result ? result.id : null;
}
