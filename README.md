# Post Void Trainer

## Usage

Download and extract the [latest release](/releases), start Post Void, start the `post-void-trainer.exe`.

You will need to restart the trainer after each restart of the game (will change in the future)

## Features

### Level skipping and looping

## Building

Requires a **32-bit version of node**, `build-tools`, probably more stuff for gyp?


```sh
yarn

# rebuild memoryjs for 32-bit
cd node_modules/memoryjs
yarn build32
cd ../..

yarn release
cp node_modules/memoryjs/build/Release/memoryjs.node release
zip -rj release.zip release/*
```
