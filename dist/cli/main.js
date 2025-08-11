#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const args = process.argv.slice(2);
async function main() {
    var _a, _b, _c, _d;
    if (args[0] === 'gen') {
        if (args[1] === 'openapi') {
            const input = (_a = args[2]) !== null && _a !== void 0 ? _a : './openapi.yaml';
            const output = (_b = args[3]) !== null && _b !== void 0 ? _b : './src/gen/openapi';
            console.log(`Generating OpenAPI client from ${input} to ${output} ...`);
            (0, child_process_1.spawnSync)('npx', ['openapi-typescript-codegen', '--input', input, '--output', output, '--client', 'axios'], {
                stdio: 'inherit',
            });
        }
        else if (args[1] === 'grpc') {
            const protoFolder = (_c = args[2]) !== null && _c !== void 0 ? _c : './protos';
            const output = (_d = args[3]) !== null && _d !== void 0 ? _d : './src/gen/grpc';
            console.log(`Generating gRPC TS client from ${protoFolder} to ${output} ...`);
            (0, child_process_1.spawnSync)('npx', [
                'grpc_tools_node_protoc',
                '--ts_out',
                output,
                '--js_out',
                output,
                '--grpc_out',
                output,
                '-I',
                protoFolder,
                `${protoFolder}/*.proto`,
            ], { stdio: 'inherit' });
        }
        else {
            console.log('Unsupported gen command');
        }
    }
    else {
        console.log('Usage: universal-client gen [openapi|grpc]');
    }
}
main();
