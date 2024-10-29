const axios = require('axios');

function pushMsg(msg) {
  if (!global.pushplusToken) {
    return;
  }

  axios.post('http://127.0.0.1:8080/report', {
    title: '武神传说日常任务',
    token: global.pushplusToken,
    content: msg,
    send_to: 3479000843
  });
}

module.exports = pushMsg;
