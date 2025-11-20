'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import DegenBackground from './DegenBackground';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface StartScreenProps {
    walletConnected: boolean;
    userSignedUp: boolean;
    walletAddress: string;
    onSignup: () => void;
    onStart: () => void;
    onPlayFree: () => void;
    onDisconnect: () => void;
}

export default function StartScreen({ 
    walletConnected, 
    userSignedUp, 
    walletAddress, 
    onSignup, 
    onStart, 
    onPlayFree,
    onDisconnect 
}: StartScreenProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (titleRef.current) {
            gsap.fromTo(titleRef.current, 
                { opacity: 0, y: -50, scale: 0.9 },
                { opacity: 1, y: 0, scale: 1, duration: 1, ease: "elastic.out(1, 0.5)" }
            );
        }
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText("Coming Soon");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div ref={containerRef} className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center z-20 overflow-hidden">
            {/* 3D Dither Background */}
            <DegenBackground />

            <div className="relative z-10 flex flex-col items-center max-w-md w-full px-4">
                {/* Contract Address Banner */}
                <div className="animate-in fade-in slide-in-from-top-4 duration-700 mb-8">
                    <button 
                        onClick={handleCopy}
                        className="flex items-center gap-3 bg-black/40 backdrop-blur-md border border-green-500/30 px-6 py-2 rounded-full cursor-pointer hover:bg-black/60 hover:border-green-500/60 transition-all group shadow-[0_0_20px_rgba(0,255,0,0.1)]"
                    >
                        <span className="text-gray-400 font-vt323 text-lg uppercase tracking-wider">CONTRACT ADDRESS:</span>
                        <span className="text-white font-bold font-vt323 text-xl tracking-widest group-hover:text-[#00ff00] transition-colors">
                            {copied ? "COPIED!" : "COMING SOON"}
                        </span>
                        {!copied && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-white transition-colors">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        )}
                    </button>
                </div>

                <h1 
                    ref={titleRef}
                    className="text-7xl md:text-8xl text-center text-[#00ff00] mb-2 tracking-widest drop-shadow-[0_0_25px_rgba(0,255,0,0.4)] font-vt323 glitch-text"
                    data-text="FLAPPY CANDLE"
                    style={{ textShadow: '4px 4px 0px rgba(0,0,0,0.8)' }}
                >
                    FLAPPY CANDLE
                </h1>
                <p className="text-gray-400 mb-2 text-xl font-vt323 tracking-[0.2em] uppercase text-center shadow-black drop-shadow-md">
                    Tap to Pump. Avoid the FUD.
                </p>
                <p className="text-[#00ff00] mb-8 text-sm font-vt323 text-center animate-pulse">
                    CONNECT WALLET TO COMPETE FOR 100% OF CREATOR FEES EVERY HOUR
                </p>

                <div className="bg-black/60 backdrop-blur-md border border-green-900/50 p-6 rounded-lg shadow-[0_0_50px_rgba(0,255,0,0.1)] w-full max-w-sm flex flex-col items-center relative overflow-hidden group">
                    {/* Card Shine Effect */}
                    <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:left-[100%] transition-all duration-1000 pointer-events-none"></div>

                    {/* Step 1: Select Wallet */}
                    {!walletConnected && (
                        <div className="text-center w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <p className="text-yellow-400 mb-4 text-lg font-vt323 tracking-wide">INITIALIZE WALLET</p>
                            <div className="flex justify-center transform hover:scale-105 transition-transform mb-4">
                                <WalletMultiButton className="!bg-[#512da8] !text-white !font-vt323 !text-xl !py-2 !px-6 hover:!bg-[#673ab7] !rounded-none !border-2 !border-[#7c4dff] !shadow-[4px_4px_0px_rgba(0,0,0,1)]" />
                            </div>
                            
                            <div className="flex items-center gap-4 my-2 w-full">
                                <div className="h-[1px] bg-gray-700 flex-1"></div>
                                <span className="text-gray-500 font-vt323 text-sm">OR</span>
                                <div className="h-[1px] bg-gray-700 flex-1"></div>
                            </div>

                            <button 
                                onClick={onPlayFree}
                                className="mt-2 text-gray-400 hover:text-white text-lg hover:bg-white/10 px-4 py-2 rounded transition-all font-vt323 tracking-wide border border-transparent hover:border-gray-600 w-full"
                            >
                                PLAY FOR FREE (NO REWARDS)
                            </button>
                        </div>
                    )}

                    {/* Step 2: Sign Up */}
                    {walletConnected && !userSignedUp && (
                        <div className="text-center w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <p className="text-yellow-400 mb-3 text-lg font-vt323">AUTHENTICATION REQUIRED</p>
                            <div className="bg-black/40 p-2 mb-4 rounded border border-gray-800 font-mono text-[10px] text-green-500 break-all">
                                {walletAddress}
                            </div>
                            <button
                                className="w-full bg-[#673ab7] text-white border-2 border-[#9c27b0] py-2 text-xl font-vt323 uppercase cursor-pointer shadow-[0_0_15px_#9c27b0] hover:bg-[#7e57c2] hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden"
                                onClick={onSignup}
                            >
                                <span className="relative z-10">SIGN UP</span>
                            </button>
                        </div>
                    )}

                    {/* Step 3: Start Game */}
                    {walletConnected && userSignedUp && (
                        <div className="flex flex-col items-center gap-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center w-full">
                                <p className="text-green-500 mb-2 text-xl font-vt323 tracking-widest drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]">SYSTEM READY</p>
                                <div className="flex items-center justify-center gap-2 bg-[#111] px-3 py-1 rounded border border-green-900/50 shadow-inner mb-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_#00ff00] animate-pulse"></div>
                                    <p className="text-gray-300 text-base font-vt323 tracking-wide">
                                        {walletAddress.substring(0, 4)}...{walletAddress.substring(walletAddress.length - 4)}
                                    </p>
                                </div>
                            </div>

                            <button
                                className="w-full group relative bg-gradient-to-b from-[#00ff00] to-[#00cc00] text-black border-b-4 border-[#006600] py-2 text-3xl font-vt323 uppercase cursor-pointer shadow-[0_0_20px_rgba(0,255,0,0.4)] hover:translate-y-[2px] hover:border-b-2 active:border-b-0 active:translate-y-[4px] transition-all"
                                onClick={onStart}
                            >
                                <span className="relative z-10 drop-shadow-md">START</span>
                                <div className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>

                            <button 
                                onClick={onDisconnect}
                                className="mt-1 text-red-500/70 text-sm hover:text-red-400 hover:bg-red-950/30 px-4 py-1 rounded border border-transparent hover:border-red-900/50 transition-all font-vt323 tracking-widest uppercase"
                            >
                                [ DISCONNECT ]
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-gray-500 text-xs font-mono tracking-widest opacity-60">
                    SPACE TO JUMP // CLICK TO JUMP
                </div>
            </div>
        </div>
    );
}
