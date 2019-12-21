"use strict";

var _commander = _interopRequireDefault(require("commander"));

var _server = _interopRequireDefault(require("./server"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// 设置命令行参数并监听用户命令行输入
_commander.default.option('-p, --port <val>', 'set server port [val]').parse(process.argv);

let config = {
  port: 8080
};
Object.assign(config, _commander.default);
let server = new _server.default(config);
server.listen(); // 启动服务