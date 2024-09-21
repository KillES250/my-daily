module.exports = function (data) {
  const items = data.items;
  items.forEach(item => {
    if (item.name.includes('<hig>背包扩充石</hig>')) {
      const id = item.id;
      this.cmd.send(`use ${item.id}`); // 使用反引号和模板字符串
    }
  });
};