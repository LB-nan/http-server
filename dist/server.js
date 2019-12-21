"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _http = _interopRequireDefault(require("http"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _url = _interopRequireDefault(require("url"));

var _util = _interopRequireDefault(require("util"));

var _mime = _interopRequireDefault(require("mime"));

var _chalk = _interopRequireDefault(require("chalk"));

var _ejs = _interopRequireDefault(require("ejs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let {
  readFile,
  writeFile,
  readdir,
  stat
} = _fs.default.promises; // 读取模板

let template = _fs.default.readFileSync(_path.default.resolve(__dirname, '../assets/template.html'), 'utf8');

class Server {
  constructor(config) {
    this.port = config.port;
    this.template = template;
  }

  async handleRequest(req, res) {
    let {
      pathname
    } = _url.default.parse(req.url); // 处理中文路径


    pathname = decodeURIComponent(pathname); // process.cwd(): 找当前运行命令的目录

    let filePath = _path.default.join(process.cwd(), pathname);

    try {
      // 判断当前文件是否存在
      let statObj = await stat(filePath); // 判断当前查找的是文件夹还是文件

      if (statObj.isDirectory()) {
        let dirs = await readdir(filePath);

        let templateStr = _ejs.default.render(this.template, {
          dirs,
          path: pathname === '/' ? '' : pathname
        });

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html;charset=utf-8');
        res.end(templateStr);
      } else {
        this.sendFile(filePath, req, res, statObj);
      }
    } catch (e) {
      this.sendError(e, req, res);
    }
  }

  sendFile(filePath, req, res, statObj) {
    res.statusCode = 200;
    res.setHeader('Content-Type', _mime.default.getType(filePath) + ';charset=utf-8');

    _fs.default.createReadStream(filePath).pipe(res);
  }

  sendError(e, req, res) {
    res.statusCode = 404;
    res.end('Not Found');
  }

  listen() {
    let server = _http.default.createServer(this.handleRequest.bind(this));

    server.listen(this.port, () => {
      console.log(`${_chalk.default.yellow('Starting up http-server, serving')} ${_chalk.default.blue('./')}
  ${_chalk.default.yellow('Available on:')}
    ${_chalk.default.green('http://127.0.0.1:')}${_chalk.default.green(this.port)}
  Hit ${_chalk.default.red('CTRL-C')} to stop the server`);
    });
  }

}

var _default = Server;
exports.default = _default;