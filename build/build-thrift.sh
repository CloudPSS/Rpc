#! /bin/bash

# apt install flex bison cmake

dir="$(dirname "$(realpath "$0")")/temp"

apt-get update
apt-get install -y cmake flex bison
cd $dir
rm -rf ./thrift ./thrift-*/
tar -xf ./thrift.tar.gz
cd ./thrift-*/compiler/cpp
mkdir -p cmake-build && cd cmake-build
cmake ..
make
cp bin/thrift $dir/thrift