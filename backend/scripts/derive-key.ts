import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

const privateKey = '3TzkQNXBheLsVRivvKZTSTfRbhXdeTwnDEXyXwxe9TBxwkU9ek3dP2RswZVNCPWjhihA9zVk779uH38uviB7iPVk';
const secretKey = bs58.decode(privateKey);
const keypair = Keypair.fromSecretKey(secretKey);

console.log('Public Key:', keypair.publicKey.toBase58());
