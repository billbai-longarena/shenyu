import { request } from 'http';

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/client-count',
    method: 'GET',
    headers: {
        'Accept': 'application/json'
    }
};

const req = request(options, (res) => {
    console.log('状态码:', res.statusCode);
    console.log('响应头:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('响应数据:', data);
    });
});

req.on('error', (error) => {
    console.error('请求错误:', error);
});

req.end();
