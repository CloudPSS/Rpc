#! /bin/bash

sed -i 's@//.*archive.ubuntu.com@//mirrors.ustc.edu.cn@g' /etc/apt/sources.list
sed -i 's/security.ubuntu.com/mirrors.ustc.edu.cn/g' /etc/apt/sources.list
sed -i 's/http:/https:/g' /etc/apt/sources.list
apt-get update
apt-get install -y cmake flex bison

dir="$(dirname "$(realpath "$0")")/temp"

cd $dir
rm -rf ./thrift ./thrift-*/
tar -xf ./thrift.tar.gz
cd ./thrift-*/compiler/cpp
mkdir -p cmake-build && cd cmake-build
cmake ..
make
cp bin/thrift $dir/thrift