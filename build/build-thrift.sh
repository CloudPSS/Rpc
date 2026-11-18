#! /bin/bash

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