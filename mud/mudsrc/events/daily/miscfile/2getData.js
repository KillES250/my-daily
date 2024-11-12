const path = require('path');
const logger = require(path.resolve(__dirname, '../../../../server/logger'));
const scName = [
    '小流氓','韦春芳','双儿','鳌拜','程灵素','温仪','夏雪宜','曲霏烟','黄蓉','阿朱',
    '阿碧','王语嫣','张无忌','周芷若','小昭','小龙女','小师妹','青青','地尼','秦梦瑶',
];

module.exports = async function (data) {
    switch (data.type) {
        // 起始位置，将通过items返回开始寻路豪宅地图
        case 'startmisc':
            this.npclist = [];
            this.cmd.send('team dismiss;go enter');
            break;
        // 人物数据返回
        case 'items':
            for (const item of data.items) {
                // 如果返回的数据存在(莫非最后是0，nmd),且不是玩家，且名字存在于scName随从名字列表中则将其添加至随从列表中
                if (item && !item.p && scName.some(name => item.name.includes(name))){
                    this.npclist.push(item.id);
                    this.cmd.send(`dc ${item.id} stopstate;team with ${item.id}`)
                }
                else if (item && !item.p && item.name.includes('书架')) {
                    this.userSj.id = item.id;
                }
            }
            if (this.roomPath === "home/yuanzi") {
                this.cmd.send(`go ${this.haozhaiarrive[0]}`);
                return;
            }
            if (this.roomPath === "home/liangong") {
                this.haozhaiarrive.shift();
                this.cmd.send(`go east`);
                return;
            }
            if (this.roomPath === "home/lianyao") {
                this.haozhaiarrive.shift();
                this.cmd.send(`go west`);
                return;
            }
            if (this.roomPath === "home/huayuan") {
                this.haozhaiarrive.shift();
                this.cmd.send(`go southwest`);
                return;
            }
            if (this.roomPath === "home/woshi" || this.roomPath === "home/danjian" || this.roomPath === "yz/qianzhuang") {
                if( this.userSj.id ){
                    this.cmd.send(`sj ${this.userSj.id}`)
                } else {
                    this.cmd.send('store');
                }
            }
            break;
        case 'dialog':
            // 书架
            if(data.dialog === "list" && data.bookshelf){
                this.userSj.data = data.stores;
                this.userSj.count = data.max_store_count;
                this.cmd.send('store');
                return;
            }
            // 仓库
            if(data.dialog === "list" && !data.bookshelf && !data.id){
                this.userStore.data = data.stores;
                this.userStore.count = data.max_store_count;
                this.cmd.send('pack');
                return;
            }
            // 背包
            if(data.dialog === "pack" && !data.name && !data.id){
                this.userBag.id = this.userId;
                this.userBag.data = data.items;
                this.userBag.count = data.max_item_count;
                // 请求完背包数据后，如果随从列表不为空，则开始请求随从背包数据，否则直接开始整理
                if(this.npclist.length > 0){
                    this.tmpnpclist = [...this.npclist];
                    this.cmd.send(`pack ${this.tmpnpclist[0]}`)
                } else {
                    this.cmd.send('tm 开始整理');
                }
                return;
            }
            // 随从背包
            if (data.dialog === "pack2") {
                // 每次获得一个数据返回后，移除第一个请求的npcId，以方便用于下次请求。
                this.tmpnpclist.shift();

                // 分发数据函数
                const assignUserData = (userSc, data) => {
                    userSc.id = data.id;
                    userSc.data = data.items;
                    userSc.count = data.max_item_count;
                    // 只有临时的随从列表不为空，则继续请求数据
                    if(this.tmpnpclist.length > 0){
                        this.cmd.send(`pack ${this.tmpnpclist[0]}`);
                    } 
                    // 如果临时的随从列表为空,将不再请求数据，则开始整理
                    else {
                        this.cmd.send('tm 开始整理');
                    }
                };
                // 如果随从1为空，且不会继续请求随从背包的时候，强制返回的数据请求分发给随从1
                if(!this.userSc1.id && this.tmpnpclist.length === 0){
                    this.userSc1.id = data.id;
                    this.userSc1.data = data.items;
                    this.userSc1.count = data.max_item_count;
                    this.cmd.send('tm 开始整理')
                    return;
                }
                // 如果随从1为空，且当前数据返回的随从有鱼竿，则将数据插入随从1
                if (!this.userSc1.id && data.eqs[0] && data.eqs[0].name.includes('钓鱼竿')) {
                    assignUserData(this.userSc1, data);
                    return;
                } 
                // 如果随从2为空
                if (!this.userSc2.id) {
                    // 如果当前数据返回的随从有鱼竿，则将鱼竿移除这是为了方便后期整理添加的操作(这段代码只有在随从1不为空时才会执行)
                    if (data.eqs[0] && data.eqs[0].name.includes('钓鱼竿')) {
                        this.cmd.send(`dc ${data.id} uneq ${data.eqs[0].id}`);
                    }
                    assignUserData(this.userSc2, data);
                    return;
                } 
                // 如果随从3为空
                if (!this.userSc3.id) {
                    // 如果当前数据返回的随从有鱼竿，则将鱼竿移除这是为了方便后期整理添加的操作(这段代码只有在随从1不为空时才会执行)
                    if (data.eqs[0] && data.eqs[0].name.includes('钓鱼竿')) {
                        this.cmd.send(`dc ${data.id} uneq ${data.eqs[0].id}`);
                    }
                    assignUserData(this.userSc3, data);
                    return;
                }
            }
            break;
        case 'msg':
            if(data.ch === 'tm' && data.content === '开始整理'){
                this.emit('Data',{ type:'nextmisc' });
            }
            break;
        case 'tip':
            if (data.data.includes('说：')) {
                return;
            }
            if (data.data.includes('管家拦住你')) {
                // 穷光蛋去钱庄…………
                this.cmd.send('jh fam 0 start;go north;go west');
                return;
            }
            break;
        default:
            break;
    }
}