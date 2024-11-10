const path = require('path');
const logger = require(path.resolve(__dirname, '../../../../server/logger'));
let i = 0;
let cmds = null;

module.exports = async function (data) {
    const cmd = (data) => {
        const item = data[i]
        if(!item){
            this.cmd.send('结束流程')
            return;
        }

        if((item.name.includes('秘籍') || item.name === '<hio>武道</hio>') && !item.name.includes('门派秘籍更换券')){
            this.cmd.send(`qu ${item.count} ${item.id}`)
            cmds = `store ${item.count} ${item.id}`
        } else {
            i++;
            cmd(data);
        }
    }
    switch (data.type) {
        case 'startmisc':
            if ( this.userSj.id && this.userSj.count > 150){
                this.cmd.send('store')
            } else {
                this.cmd.send('tm 结束流程')
            }
            break;
        case 'dialog':
            // 仓库
            if(data.dialog === "list" && !data.bookshelf && !data.id){
                this.userStore.data = data.stores;
                this.userStore.count = data.max_store_count;
                this.cmd.send('pack');
                return;
            }
            break;
        case 'tip':
            if(data.data.includes('你从仓库里取出')){
                this.cmd.send(cmds);
                return;
            }
            if(data.data.includes('存入仓库')){
                cmd(this.userStore.data);
            }
            break;
        case 'msg':
            if(data.ch === 'tm')
                if(data.content === '结束流程'){
                this.emit('Data',{ type:'nextmisc' });
            }
            break;
        default:
            break;
    }
}