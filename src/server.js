import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import util from 'util';
import mime from 'mime';
import chalk from 'chalk';
import ejs from 'ejs';

let {readFile, writeFile, readdir, stat} = fs.promises;

// 读取模板
let template = fs.readFileSync(path.resolve(__dirname, '../assets/template.html'), 'utf8');

class Server {
  constructor(config) {
    this.port = config.port;
    this.template = template;
  }
  async handleRequest(req, res) {
    let {pathname} = url.parse(req.url);
    // 处理中文路径
    pathname = decodeURIComponent(pathname);
    // process.cwd(): 找当前运行命令的目录
    let filePath = path.join(process.cwd(), pathname);
    try { // 判断当前文件是否存在
      let statObj =await stat(filePath);

      // 判断当前查找的是文件夹还是文件
      if(statObj.isDirectory()){
        let dirs = await readdir(filePath);
        let templateStr = ejs.render(this.template, {dirs, path:pathname === '/'?'':pathname});
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html;charset=utf-8');
        res.end(templateStr);
      } else {
        this.sendFile(filePath, req, res, statObj);
      }

    } catch(e) {
      this.sendError(e, req, res);
    }
  }

  sendFile(filePath, req, res, statObj){
    res.statusCode = 200;
    res.setHeader('Content-Type', mime.getType(filePath) + ';charset=utf-8');
    fs.createReadStream(filePath).pipe(res);
  }

  sendError(e, req, res){
    res.statusCode = 404;
    res.end('Not Found');
  }

  listen() {
    let server = http.createServer(this.handleRequest.bind(this));
    server.listen(this.port, () => {
      console.log(`${chalk.yellow('Starting up http-server, serving')} ${chalk.blue('./')}
  ${chalk.yellow('Available on:')}
    ${chalk.green('http://127.0.0.1:')}${chalk.green(this.port)}
  Hit ${chalk.red('CTRL-C')} to stop the server`)
    });
  }
}
export default Server;