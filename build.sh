#!/bin/sh

SCRIPT_DIR=$(cd $(dirname $0); pwd)
cd $SCRIPT_DIR

PACKAGE=false

# parse options
while :
do
    case $1 in
        -p|--package)
            PACKAGE=true
            ;;
        *)
            break
    esac
    shift
done

rm -f src/*.js
npm run compile

if [ $PACKAGE = true ]; then
    echo "## creating package."
    #vsce package --baseImagesUrl https://raw.githubusercontent.com/Yasuo-Higano/vscode-gleam-outliner/main/
    #sce package
    npx vsce package
else
    echo "## to create package, use -p or --package option."
fi
