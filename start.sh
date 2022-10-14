#!/bin/bash

set -e

print_usage()
{
	echo "[ USAGE ]"
	echo "./start.sh [RUN_MODE]"
	echo "RUN_MODE = \"real\" or \"test\""
}

if [ $# -lt 1 ]
then
print_usage
exit
fi

if [ $1 = "real" ]
then
export SERVER_IP=$(curl ifconfig.me)
export SERVER_PORT=3000
npm start
elif [ $1 = "test" ]
then
export SERVER_IP="localhost"
export SERVER_PORT=3000
npm run dev
else
print_usage
fi
