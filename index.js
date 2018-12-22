const fs = require('fs');
const path = require('path');
const http = require('http');


// 获取端口和静态文件路径
const port = getArgVal('p') || 9527; 
const rootPath = getArgVal('r') || process.cwd();

// 获取命令行参数
function getArgVal(param) {
    let args = process.argv;
    let pIndex = args.indexOf(`-${param}`);
    if (pIndex < 0) {
        return null;
    }
    return args[pIndex + 1];
}

// 读取文件夹目录
function readDir(cPath) {
    let files = fs.readdirSync(cPath);
    return files.map(item => {
        let fStat = fs.statSync(`${cPath}/${item}`);
        if (fStat.isDirectory()) {
            return `/${item}`;
        } else {
            return item;
        }
    });
}

// 获取文件content-type
function getContentType(ext) {
    const mimeType = require('./src/mime');
    let contentType = '';
    for (let i  in mimeType) {
        let item = mimeType[i];
        if (item.includes(ext)) {
            contentType = i;
            break;
        }
    }
    return contentType;
}

// 目录静态页
function menuPage(enterUrl) {
    let newPath = path.join(rootPath, enterUrl);
    // todo 路径待优化
    let r = path.resolve(enterUrl, '..').split(/[\\+\/+]/);
    r.shift();
    r = '/' + r.join('/');

    let tpl = `<div class="item"><a href="${r}">../</a></div>`;

    readDir(newPath).forEach(p => {
        tpl += `<div class="item"><a href="${enterUrl === '/' ? '' : enterUrl}${/^\//.test(p) ? p : '/' + p}">${p}</a></div>`; 
    });

    // todo 返回样式待优化
    let tHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
        <style>
            * {margin:0;padding:0}
            .item {margin: 5px;}
            .wrap {margin:15px;}
        </style>
    </head>
    <body>
        <div class="wrap">${tpl}</div>
    </body>
    </html>`;
    return tHtml;
    
}

// server
let server = http.createServer((req, res) => {
    let newPath = rootPath;
    let enterUrl = decodeURI(req.url);

    // 处理favicon.ico
    if (enterUrl == '/favicon.ico') {
        res.statusCode = 202;
        return;
    } else if (enterUrl !== '/') {
        newPath = path.join(rootPath, enterUrl);
    } 

    // 处理404
    try {
        fs.statSync(newPath);
    } catch (err) {
        res.statusCode = 404;
        res.end('404 not found~');
        return;
    }

    if (fs.statSync(newPath).isFile()) {
        let ext = path.extname(newPath);
        let extName = ext.indexOf('.') >= 0 ? ext.split('.')[1] : ext;

        // mine文件类型
        let contentType = getContentType(extName);

        res.writeHead(200, {'Content-Type': `${contentType}; charset=utf-8`});
        fs.createReadStream(newPath).pipe(res); // todo：缓存等响应头待优化
        
    } else {
        let resHtml = menuPage(enterUrl);
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        res.end(resHtml);
    }
    
});

server.listen(port);

console.log('\x1B[33m%s\x1b[0m',`Server: http://localhost:${port}`);
