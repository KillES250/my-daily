const path = require('path');
const logger = require(path.resolve(__dirname, '../../../server/logger'));

module.exports = async function (data) {
    switch (data.type) {
        case 'start':
            this.cmd.send('stopstate');
            if (this.userConfig.dungeons.first){
                this.dungeonsList.jindi = this.gameInfo.dungeonWay.jinDi;
            }
            if (this.userConfig.dungeons.second){
                this.dungeonsList.guzongmen = this.gameInfo.dungeonWay.guZongMen;
            }
            if (this.userConfig.dungeons.third === 'saodang muyuan'){
                this.dungeonsList.yaota = this.gameInfo.dungeonWay.yaoTa;
            }
            if (this.userConfig.dungeons.first || this.userConfig.dungeons.second || !this.userConfig.dungeons.third.includes('cr')){
                this.cmd.send(this.gameInfo.dungeonWay.start);
            }
            else if (!this.userConfig.dungeons.first && !this.userConfig.dungeons.second && this.userConfig.dungeons.third.includes('cr')){
                this.fbnum = this.userJl / 10
                this.cmd.send(`jh fam 0 start;go south;go east;sell all`);
                if(this.userConfig.dungeons.fourth){
                    while (this.fbnum > 0) {
                        this.cmd.send(`${this.userConfig.dungeons.third} 0`)
                        await sleep(3);
                        this.cmd.send('cr over');
                        await sleep(3);
                        this.fbnum -= 1
                        if (this.fbnum === 0) {
                            this.emit('Data',{type:'next'});
                        }
                    }
                } else{
                    this.cmd.send(`shop 0 ${this.fbnum};${this.userConfig.dungeons.third} ${this.fbnum}`)
                }
            }
        case 'room':
            this.room = data.name;
            this.roomPath = data.path
            if(this.room=== '古大陆-平原'){
                if(this.dungeonsList.jindi){
                    this.cmd.send(this.dungeonsList.jindi);
                }else if(this.dungeonsList.guzongmen){
                    this.cmd.send(this.dungeonsList.guzongmen);
                }else if(this.dungeonsList.yaota){
                    this.cmd.send(this.dungeonsList.yaota);
                }
            }else if(this.room === '古大陆-破碎通道'){
                this.cmd.send(`shop 0 2;cr yzjd/pingyuan 0 2`);
                this.userJl = this.userJl - 200
                this.dungeonsList.jindi = null;
                await sleep(5);
                this.cmd.send(this.gameInfo.dungeonWay.start);
            }else if (this.roomPath === 'zc/shanjiao'){
                this.cmd.send(`shop 0 5;cr gmp/shanmen 0 5`);
                this.userJl = this.userJl - 50
                this.dungeonsList.guzongmen = null;
                await sleep(10);
                this.cmd.send(this.gameInfo.dungeonWay.start);
            }else if(this.room === '古大陆-墓园'){
                this.cmd.send('go north')
                if(this.userJl > 0){
                    this.cmd.send(`shop 0 1;saodang muyuan`);
                } else {
                    this.dungeonsList.yaota = null;
                    this.emit('Data',{type:'next'});
                }
            }
            break;
        case 'items':
            if(this.room === '武道塔-塔顶')
                for (const item of data.items) {
                    if (!item || item.p || !item.name) {
                        continue;
                    }
                    if (item.name === '疯癫的老头') {
                        if (this.dungeonsList.jindi ||this.dungeonsList.guzongmen || this.dungeonsList.yaota){
                            this.cmd.send(`ggdl ${item.id}`);
                        }else{
                            this.fbnum = this.userJl / 10
                            this.cmd.send('jh fam 0 start;go south;go east;sell all')
                            if(this.userConfig.dungeons.fourth === true){
                                while (this.fbnum > 0) {
                                    this.cmd.send(`${this.userConfig.dungeons.third} 0`);
                                    await sleep(2);
                                    this.cmd.send('cr over');
                                    await sleep(2);
                                    this.fbnum -= 1
                                }
                                if (this.fbnum === 0) {
                                    this.emit('Data',{type:'next'});
                                }
                            } else{
                                this.cmd.send(`shop 0 ${this.fbnum};${this.userConfig.dungeons.third} ${this.fbnum}`)
                            }
                        }
                    }
                }
            break;
        case 'dialog':
            if(data.dialog === 'pack' && data.name){
                if(this.gameInfo.useLessItems.includes(data.name)){
                    this.cmd.send(`fenjie ${data.id}`);
                }else if(data.name.includes('玉简')){
                    this.cmd.send(`use ${data.id}`);
                }
            }
            break;
        case 'tip':
            if (data.data.includes('说：')) {
                return;
            }
            
            if (data.data.includes('本周进入妖神禁地的次数已经达到上限。')) {
                this.dungeonsList.jindi = null;
            }
            else if (data.data.includes('共获得了261点妖元')) {
                const xhjl = data.data.match(/，(\d+)精力/);
                this.userJl = this.userJl - parseInt(xhjl[1], 10)
                if (this.userJl > 0) {
                    this.cmd.send(`shop 0 1;saodang muyuan`);
                }else if (this.userJl <= 0) {
                    this.dungeonsList.yaota = null;
                    this.emit('Data',{type:'next'}); 
                }
            }
            else if (/打败我|你要进入哪个副本|没有那么多的元宝|精力不够|你尚未通关弑妖塔，不能快速完成/.test(data.data)) {
                console.log(data.data);
                this.emit('Data',{type:'next'}); 
            }
            else if (data.data.includes('扫荡完成') && this.roomPath !== 'zc/shanjiao' && this.room !== '古大陆-破碎通道') {
                this.cmd.send(`jh fam 0 start;go south;go east;sell all`);
                await sleep(5);
                this.emit('Data',{type:'next'});
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