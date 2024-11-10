const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const logger = require(path.resolve(__dirname, '../../../server/logger'));

const misclist = fs.readdirSync(path.resolve(__dirname, '../daily/misc'))
    .filter(file => path.extname(file).toLowerCase() === '.js')
    .map(file => path.basename(file, '.js'));

module.exports = function (data) {
    switch (data.type) {
        case 'start':
            this.cmd.send("jh fam 0 start;go west;go west;go north");
            this.off('Data', require(`./misc/${misclist[0]}.js`));
            this.on('Data', require(`./misc/${misclist[0]}.js`));
            this.emit('Data',{type:'startmisc'});
            break;
        case 'nextmisc':
            if (misclist.length > 0) {
                this.off('Data' , require(`./misc/${misclist[0]}.js`));
                misclist.shift();
            }
            if (misclist.length > 0){
                this.on('Data', require(`./misc/${misclist[0]}.js`));
                this.emit('Data',{type:'startmisc'});
            } else if (misclist.length === 0){
                this.emit('Data',{type:'next'});
            }
            break;
        case 'room':
            this.room = data.name
            this.roomPath = data.path
            break;
        default:
            break;
    }
}