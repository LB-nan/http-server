import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import util from 'util';
import zlib from 'zlib';
import crypto from 'crypto';

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

  gzip(req, res){
    // 拿到浏览器支持的压缩方式
    let acceptEncoding  = req.headers['accept-encoding'];
    // 判断是否支持压缩
    if(acceptEncoding ){
      if(acceptEncoding.indexOf('gzip')!=-1){
        res.setHeader('Content-Encoding', 'gzip');
        return zlib.createGzip();
      } else if(acceptEncoding.indexOf('deflate')!=-1){
        res.setHeader('Content-Encoding', 'deflate');
        return zlib.createDeflate();
      }
    }
    return false;
  }

  cache(filePath, req, res, statObj){
    // 获取文件最后修改时间
    let lastModified = statObj.ctime.toUTCString();
    // 设置last modified
    res.setHeader("Last-Moodified", lastModified);

    // 设置Etag
    let Etag = crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('base64');
    res.setHeader("Etag", Etag);

    let ifModified = req.headers['if-modified-since'];
    let ifNoneMatch = req.headers['if-none-match'];

    // 如果存在且相等，说明有缓存
    if(ifNoneMatch && ifNoneMatch === Etag){
      return true;
    }

    // 如果存在且相等，说明有缓存
    if(ifModified && ifModified === lastModified){
      return true;
    }

    // 没缓存
    return false;
  }

  sendFile(filePath, req, res, statObj){
    res.setHeader("Cache-Control", "max-age=3600");

    // 设置缓存
    let isCache = this.cache(filePath, req, res, statObj);

    if(isCache){
      res.statusCode = 304;
      return res.end();
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', mime.getType(filePath) + ';charset=utf-8');
    let gunzip = this.gzip(req, res);
    if(gunzip){
      fs.createReadStream(filePath).pipe(gunzip).pipe(res);
    } else {
      fs.createReadStream(filePath).pipe(res);
    }
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