const tipback = {
    // 特殊房间财主家 
    // 移花迷宫
    // 移花宫主房间
    // 燕子坞后庭台令牌房间
    // 华山论剑房间单独判定
    specPath: [
        { id: 'yz/lcy/fang2', act: 'tui tai' },
        { id: 'bj/shenlong/lin1', act: 'kan bush' },
        { id: 'cd/wen/tingzi', act: 'tiao zhuang;tiao zhuang' },
        { id: 'cd/yunmeng/zhaoze4', act: 'kan lu' },
        { id: 'huashan/yihua/midao', act: 'fire' },
        { id: 'heimuya/up1', act: 'push xiazi' },
        { id: 'heimuya/up2', act: 'push xiazi' },
        { id: 'heimuya/up3', act: 'push xiazi' },
        { id: 'heimuya/houdian', act: 'circle wan' },
        { id: 'heimuya/midao1', act: 'fire' },
    ],

    // 失败提示信息正则表达式
    fail: new RegExp(
        '你不会撬锁。|' +
        '你不拿武器怎么砍？|' +
        '你身上没有风雷堂令牌。|' +
        '你身上没有青龙堂令牌。|' +
        '你身上没有白虎堂令牌。|' +
        '你身上没有火折子怎么点火？|' +
        '这条铁索晃晃悠悠的，下面就是万丈深渊，你心惊胆颤始终不敢踏上去...'
    ),

    // 成功提示信息正则表达式
    success: new RegExp(
        '你用一把钥匙打开了秘门，可是钥匙却断了。|' +
        '你试着推了推梳妆台，发现可以推动，你再一使力，把梳妆台推到一边，后面露出一个黑乎乎的入口。|' +
        '你累得气喘吁吁,终于砍出一条小路。|' +
        '床板忽然发出轧轧的声音，缓缓向两边移动著，露出一个向下的阶梯。|' +
        '你点燃了火折，发现密道中似乎有一条路可以走过去。|' +
        '墙上的百鸟朝奉图缓缓转动后，出现一个黑黝黝的入口。|' +
        '你拿出一个白虎堂令牌插入匣子，只见一个吊篮从天而降，你不禁一怔！|' +
        '你拿出一个青龙堂令牌插入匣子，只见一个吊篮从天而降！|' +
        '你拿出一个风雷堂令牌插入匣子，只见一个吊篮从天而降！|' +
        '你旋动了碗，只见侧墙打开,露出一个黑幽幽的洞口。|' +
        '你拉动了墙上的铁环，一阵轰隆声后身后开启了一扇石门，有条楼梯直通地上。'
    ),

    // 阻塞提示信息正则表达式
    blocking: new RegExp(
        '拦住你|' +
        '拦住了你|' +
        '挡住了你|' +
        '流氓轻佻的朝你吹了个口哨，嬉皮笑脸的说道：妹妹要到哪里去？|' +
        '嵩山弟子对你喝到：嵩山派此地办事，闲杂人等不得进入。|' +
        '狮吼子一把推开你：滚一边去，星宿老仙也是你能见的吗！|' +
        '花月奴对你说道：移花宫不接待外客'
    )
};

module.exports = {
    tipback
}