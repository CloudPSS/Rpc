#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"
mkdir thrift-src
tar -xf thrift.tar.gz --strip-components=1 -C thrift-src

cmake -S thrift-src/compiler/cpp -B thrift-build
cmake --build thrift-build --parallel 4
