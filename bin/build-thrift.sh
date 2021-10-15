#! /bin/bash

# apt install flex bison cmake

pwd="$(pwd)"
dir="$(dirname "$(realpath "$0")")"

missing=

if [ ! -x "$(which cmake)" ]
then
  missing="$missing cmake"
fi

if [ ! -x "$(which flex)" ]
then
  missing="$missing flex"
fi

if [ ! -x "$(which bison)" ]
then
  missing="$missing bison"
fi

if [ -n "$missing" ]
then
  color="$(tput setaf 3)$(tput bold setaf 3)"
  reset="$(tput sgr0)"
  echo "Prerequisites not installed:${color}${missing}${reset}"
  echo "Run ${color}sudo apt install -y${missing}${reset} to install them"
  exit 1
fi

cd $dir

rm -rf ./thrift ./thrift-*/
tar -xf ./thrift.tar.gz
cd ./thrift-*/compiler/cpp
mkdir -p cmake-build && cd cmake-build
cmake ..
make
cp bin/thrift $dir/thrift

cd $pwd