import { spawn } from 'node:child_process';
import { chmodSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * 运行随包分发的 Thrift 编译器。
 * @param {string[]} args 编译器参数
 */
export function runThrift(args) {
    const executable = fileURLToPath(
        new URL(process.platform === 'win32' ? './thrift.exe' : './thrift', import.meta.url),
    );
    chmodSync(executable, 0o755);

    spawn(executable, args, { stdio: 'inherit' }).on('close', (code) => {
        process.exitCode = code ?? 1;
    });
}
