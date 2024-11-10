
/* 构造器部分数据结构
        this.userBag = { id:null,data:[], count: 0, };
        this.userStore = { data:[], count: 0 };
        this.userSc1 = { id:null, data:[], count: 0 };
        this.userSc2 = { id:null, data:[], count: 0 };
        this.userSc3 = { id:null, data:[], count: 0 };

        data示例：data:[{name:a,id:b,count:c}]
        
        this.bag = new Map();
        this.store = new Map();
        this.sc1 = new Map();
        this.sc2 = new Map();
        this.sc3 = new Map();
*/
const path = require('path');
const logger = require(path.resolve(__dirname, '../../../../server/logger'));
let creatTidyBody = false;
let tidyBody = [];
let newCmd =[];

module.exports = async function (data) {
    if(!creatTidyBody){
        const that = this; //让tidyBody的内部that指向实例中的this，方便后续使用
    // 新建一个<整理对象>
        tidyBody = [
            {
                get name() { return that.userBag; },//通过getter返回的最新的对象
                indexNum: 0, //该对象.data数组需要获取数据的key值
                findNumOfTimes: that.userBag.data.length, //需要查找的次数
                get seachPriority() { return that.userBag.count - that.userBag.data.length; }//getter返回的数值，遍历的优先级，最终数字越小，越先遍历
            },
            {
                get name() { return that.userStore; },
                indexNum: 0,
                findNumOfTimes: that.userStore.data.length,
                get seachPriority() { return that.userStore.count - that.userStore.data.length; }
            },
            {
                get name() { return that.userSc1; },
                indexNum: 0,
                findNumOfTimes: that.userSc1.data.length,
                get seachPriority() { return that.userSc1.count - that.userSc1.data.length; }
            },
            {
                get name() { return that.userSc2; },
                indexNum: 0,
                findNumOfTimes: that.userSc2.data.length,
                get seachPriority() { return that.userSc2.count - that.userSc2.data.length; }
            },
            {
                get name() { return that.userSc3; },
                indexNum: 0,
                findNumOfTimes: that.userSc3.data.length,
                get seachPriority() { return that.userSc3.count - that.userSc3.data.length; }
            }
        ];
        creatTidyBody = true;
    }
    // 定义用于执行的指令数组(整理对象入参)
    const cmd = (tidyBody) => {
        //------结束判定部分------
        const deepJudge = this.userBag.count + this.userStore.count + this.userSc1.count + this.userSc2.count + this.userSc3.count;
        
        if (deepJudge === 600){ // 深度整理判定
            // 判定tidyBody中findNumOfTimes之和是否等于0，等于的话则返回一个['end']的数组
            const totalFindNumOfTimes = tidyBody.reduce((sum, item) => sum + item.findNumOfTimes, 0);
            // console.log('tidyBody中findNumOfTimes之和',totalFindNumOfTimes);
            if (totalFindNumOfTimes === 0) {
                this.cmd.send('tm 指令已返回');
                return ['end'];
            }
        } else { //浅整理判定,只遍历背包
            if(tidyBody[0].findNumOfTimes === 0) { //如果该对象findNumOfTimes等于0，等于则返回一个['end']的数组
                this.cmd.send('tm 指令已返回');
                return['end'];
             }
        }
        //------结束判定部分------

        // 变量初始化
        let cmd = [];                   //  执行指令数组初始化
        let targetObj = {};             //  定义一个空对象

        if ( deepJudge === 600 ) {  // 深度整理判定
            let minPriority = Infinity;     //  先将最小值设置为无穷大,循环第一次比较时会将第一个比较值设置为最小
            for (const item of tidyBody) {  //开始遍历<整理对象>
                if (item.findNumOfTimes > 0 && item.seachPriority <= minPriority) { //找出还未查找完毕，且空间最小的对象
                    minPriority = item.seachPriority;   //将当前对象设置为最小对象
                    targetObj = item;                   //获得当前需要比对的对象(此时还是tidyBody的元素)
                }
            }
            // console.log('当前最小优先级对象',targetObj);
            const targetItem = targetObj.name.data[targetObj.indexNum]; //从tidyBody.name拿到对象，.data拿到该对象物品数据，.indexNum为该物品数据的key值
            // console.log('当前最小优先级对象待比对物品',targetItem);
            targetObj.findNumOfTimes -= 1;      //对应的tidyBody对元素对象中的findNumOfTimes-1
            // console.log('当前最小优先级对象剩余查找次数',targetObj.findNumOfTimes);
            const targetItemName = targetItem.name.match(/[\u4e00-\u9fa5]+/g)[0];   //key值的name正则获取中文名称，因为yaml中物品数据没有录入标签
            // console.log('当前最小优先级对象待比对物品的中文名',targetItemName);
            dictionaries = [this.bag, this.store, this.sc1, this.sc2, this.sc3];  //需要参与比对的词典
            for (const dict of dictionaries){   //遍历数组
                if(dict.has(targetItemName)){   //如果Map中含有该物品的中文名
                    /*调用创建cmd指令的函数，传入：
                        1、当前比对的对象(参与对比的物品所在对象)、
                        2、物品归属位置、
                        3、该物品的数据(指向注释中的data示例) 
                    */
                    const cmd = creatcmd(targetObj, dict, targetItem);
                    this.cmd.send('tm 指令已返回');
                    return cmd; //返回该指令数组
                }
            }
            if (cmd.length === 0){ //遭遇未录入的物品
                logger.warning(`整理物品时遇到未录入物品：${targetItemName}`);//浅整理会反复触发，测试完成记得删除这句代码
                targetObj.indexNum += 1;    // indexNum+1,下次查找时略过改物品
                this.cmd.send('tm 指令已返回');
                return [null,null];         // 返回一个包含两个为空元素的数组
            };
        } else { //浅整理判定
            const bagItem = this.userBag.data[tidyBody[0].indexNum] //拿到数据
            tidyBody[0].findNumOfTimes -= 1;  // 对应的tidyBody[0](this.userBag)的查找次数findNumOfTimes-1
            const store = this.userStore.data.find(storeItem  => storeItem .name === bagItem.name) //比对名字
            if (store) {  //如果存在，则将物品存入仓库
                cmd = [`store ${bagItem.count} ${bagItem.id}`, null]
                tidyBody[0].indexNum -= 1; //查找位置减1，自动对齐下一项
                this.cmd.send('tm 指令已返回');
                return cmd;
            } else {
                tidyBody[0].indexNum += 1; //查找位置加1 返回空指令执行以跳过改条
                this.cmd.send('tm 指令已返回');
                return [null,null];
            }
        }
    }

    //创建用于执行的执行数组的函数
    const creatcmd = (targetObj, dict, targetItem) => {
        // console.log('开始执行创建指令函数');
        let fromId = null;  //初始化来源id
        let toId = null;    //初始化目标id
        let cmd = [];       //初始化cmd命令数组
        if ( targetObj.name === this.userBag) { fromId = this.userId; }              // 如果数据来源是背包，那么id来源则是玩家
        else if ( targetObj.name === this.userSc1 ) { fromId = this.userSc1.id; }    // 如果数据来源是随从1，那么id来源则是随从1
        else if ( targetObj.name === this.userSc2 ) { fromId = this.userSc2.id; }    // 如果数据来源是随从2，那么id来源则是随从2
        else if ( targetObj.name === this.userSc3 ) { fromId = this.userSc3.id; };   // 如果数据来源是随从3，那么id来源则是随从3
        // console.log('来源id',fromId);
        if ( dict === this.bag ) { toId = this.userId; }                // 如果物品归属是背包，那么id归属则是玩家
        else if ( dict === this.sc1 ) { toId = this.userSc1.id; }       // 如果物品归属是随从1，那么id归属则是随从1
        else if ( dict === this.sc2 ) { toId = this.userSc2.id; }       // 如果物品归属是随从2，那么id归属则是随从2
        else if ( dict === this.sc3 ) { toId = this.userSc3.id; };      // 如果物品归属是随从3，那么id归属则是随从3
        // console.log('目标id',toId);

        if (fromId === toId){           // 如果来源与归属一致则不执行任何动作(表示该物品无需移动)
            targetObj.indexNum += 1;    // indexNum+1,下次查找时略过改物品
            return [null,null];         // 提前返回一个包含两个为空元素的数组
        }
        if (!fromId){                           //如果来源id为空，则代表是要对仓库获取物品，添加一个仓库取东西的动作
            cmd.push(`qu ${targetItem.count} ${targetItem.id}`)
        } else if (fromId === this.userId){     //如果来源id为玩家，则代表物品已经准备好移动了，添加一个为空的指令
            cmd.push(null)
        } else {                                //否则的话来源就是随从，添加一个从随从身上取东西的的动作
            cmd.push(`dc ${fromId} give ${this.userId} ${targetItem.count} ${targetItem.id}`)
        }
        // 在对应的原始对象中删除该条数据，让原对象中的data下一条的indexNum-1自动对齐到当前的indexNum上来
        const indexToDelete = targetObj.name.data.findIndex(item => item.id === targetItem.id)
        targetObj.name.data.splice(indexToDelete, 1);

        if (!toId){         //如果归属id为空，则代表是要对仓库获存物品，添加一个仓库存东西的动作
            cmd.push(`store ${targetItem.count} ${targetItem.id}`)
        } else if (toId === this.userId){
            cmd.push(null)  //如果归属id为玩家，则代表物品已经准备好移动了，添加一个为空的指令
        } else {            //否则的话归属id就是随从，添加一个给随从东西的的动作
            cmd.push(`give ${toId} ${targetItem.count} ${targetItem.id}`)
        }
        // console.log('即将返回指令数组',cmd);
        return cmd;     //返回指令数组
    }
    switch (data.type) {
        case 'startmisc':
            // console.log('开始整理1!-----');
            this.cmd.send('tm 开始整理');
            break;
        case 'msg':
            if(data.ch === 'tm'){
                if(data.content === '开始整理'){
                    // console.log('开始整理2!-----');
                    newCmd = cmd(tidyBody);
                    return;
                }
                if(data.content === '指令已返回'){
                    if ( newCmd[0] === 'end' ) {this.cmd.send('tm 结束归类');break;} //1返回的为end则代表结束
                    if ( newCmd[0] !== null ) {this.cmd.send(newCmd[0]);newCmd[0] = null;break;}  //1不为空，则发送1,并且将1转为空
                    if ( newCmd[0] === null && newCmd[1] === null ) {this.cmd.send('tm 开始整理');break;} //1、2都为空 继续分析流程
                    if ( newCmd[0] === null && newCmd[1] !== null ) {this.cmd.send(newCmd[1]);newCmd[1] = null;break;} //1为空，2不为空，则发送2，并且将2转为空
                }
                if(data.content === '结束归类'){
                    this.emit('Data',{ type:'nextmisc' });
                }
            }
        case 'tip':
            if(/给了你|你给了|你从仓库里取出|存入仓库/.test(data.data)){    //这里的tip返回，至少是执行了1个指令的情况[0]或者[1]
                if(newCmd[1] !== null) {this.cmd.send(newCmd[1]);newCmd[1] = null;break;} //2不为空，则发送2，并且将2转为空 (将会继续跳转到tip判定)
                if(newCmd[0] === null && newCmd[1] === null) {this.cmd.send('tm 开始整理');break;}    //1、2为空，则继续分析流程
            }
            break;
        case 'dialog':
            if ((data.dialog === 'list' && data.store === -1) || (data.dialog === 'pack' && data.name)) {
                // 判定为从仓库取出来,或者从随从背包拿到东西的返回数据
                // 如果2不为空，则将2中的id替换为当前物品的id
                // 这是为了处理当来源物品与背包物品名字一致,id不一致时,来源物品的id会改变为背包id存在背包中。导致newCmd[1]中的id不正确
                if (newCmd[1] !== null) {
                    newCmd[1] = newCmd[1].replace(/(\s+\S+)$/, ` ${data.id}`);
                    // console.log('指令以被更改为',newCmd[1]);
                }
                return;
            }
            break;
        default:
            break;
    }
}