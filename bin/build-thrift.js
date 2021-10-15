const { spawn } = require('child_process');
const path = require('path');

if (process.platform !== 'win32') {
    spawn(path.resolve(__dirname, 'build-thrift.sh'), {
        stdio: 'inherit',
    }).on('close', (code) => {
        process.exit(code);
    });
}
