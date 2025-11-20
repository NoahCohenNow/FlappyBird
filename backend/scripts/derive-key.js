"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
const privateKey = '3TzkQNXBheLsVRivvKZTSTfRbhXdeTwnDEXyXwxe9TBxwkU9ek3dP2RswZVNCPWjhihA9zVk779uH38uviB7iPVk';
const secretKey = bs58_1.default.decode(privateKey);
const keypair = web3_js_1.Keypair.fromSecretKey(secretKey);
console.log('Public Key:', keypair.publicKey.toBase58());
//# sourceMappingURL=derive-key.js.map