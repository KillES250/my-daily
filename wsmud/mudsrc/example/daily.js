// 这是daily.js文件
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Socket = require(path.resolve(__dirname, '../../server/socket'));
const gameInfo = yaml.load(fs.readFileSync(path.resolve(__dirname, 'gameInfo.yaml')));

module.exports = class Daily extends Socket {
    constructor(config) {
        super(config);
        this.setMaxListeners(50);
        this.loadEvents();
        this.sect = null;
        this.dungeonNum = 0;
        this.userId = null;
        this.userLevel = null;
        this.gameInfo = gameInfo;
        this.sectTaskInfo = {
            taskerId: null,
            taskItem: null,
            seller: null,
          };
        this.huntTaskInfo = {
            taskFailedNum: 0,
            taskerId: null,
            nowTaskWay: [],
            name: null,
            place: null,
            cai: false,
        };
        this.cd = new Set();
        this.gcd = false;
        this.isCombat = false;
        this.userSkills = null;
        this.userStatus = new Set();
        this.combatFailedNum = 0;
        this.towerGuardianId = null;
        this.nowRoomId = null;
        this.room = null;
        this.roomPath = null;
        this.timers = {
            up: null,
            pfm: null,
            fix: null,
        };
        
        this.skillsBanList = [];
        this.taskList = [];
        this.userJl = 0;
        this.allTaskList = this.allTask();
        this.dungeonsList = {
            jindi:null,
            guzongmen:null,
            yaota:null
        }
        this.weapon = null;
        
        this.bossId = null;
        this.bossName = null;
        this.tanlong = null;
        this.npclist = [];
        this.fbPath = [];
        this.pushBedLeftNum = 0;
        this.pushBedRightNum = 0;
        this.relive = true;
        this.bossFightTestNum = 0;
        
        this.mapdata = {};
    }

    loadEvents() {
        const [onClose] = this.listeners('CLOSE');
        this.removeAllListeners();
        onClose && this.on('CLOSE', onClose);
        this.on('Data',require(`../events/daily/Data.js`));
        this.on('Data',require(`../events/autopfm/autopfm.js`));
        this.on('Data',require(`../events/daily/map.js`));
    }

    allTask() {
        const directoryPath = path.join(__dirname, '../events/daily/');
        const files = fs.readdirSync(directoryPath);
        const allTaskLIist = files
            .filter(file => file.endsWith('.js') && file !== 'Data.js' && file !== 'end.js' && file !== 'map.js')
            .map(file => file.replace('.js', ''))
        return allTaskLIist;
    }
}    
