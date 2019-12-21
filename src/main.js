import program from 'commander';
import Server from './server'

// 设置命令行参数并监听用户命令行输入
program.option('-p, --port <val>', 'set server port [val]')
      .parse(process.argv);


let config = {
      port: 8080
}

Object.assign(config, program);

let server = new Server(config);
server.listen(); // 启动服务
