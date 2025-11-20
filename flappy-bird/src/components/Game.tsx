'use client';

import { useEffect, useRef, useState } from 'react';
import { api, LeaderboardEntry, PayoutEntry } from '@/lib/api';
import { useWallet } from '@solana/wallet-adapter-react';
import StartScreen from './StartScreen';

export default function Game() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [moonProgress, setMoonProgress] = useState(0);
    const [isMooning, setIsMooning] = useState(false);
    const [walletAddress, setWalletAddress] = useState<string>('');
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [payouts, setPayouts] = useState<PayoutEntry[]>([]);
    const [showPayouts, setShowPayouts] = useState(false);
    const [walletConnected, setWalletConnected] = useState(false);
    const [userSignedUp, setUserSignedUp] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    const wallet = useWallet();

    useEffect(() => {
        // Load high score from local storage on mount
        const storedHighScore = localStorage.getItem('degen_high_score');
        if (storedHighScore) {
            setHighScore(parseInt(storedHighScore, 10));
        }

        // Fetch Initial State
        api.fetchState().then(state => {
            console.log('Initial Game State:', state);
        });
    }, []);

    // Update wallet connection state
    useEffect(() => {
        if (wallet.publicKey) {
            setWalletAddress(wallet.publicKey.toBase58());
            setWalletConnected(true);
            setIsGuest(false); // Reset guest mode if wallet connects
            // Check if user is already signed up
            checkUserSignupStatus();
        } else {
            setWalletConnected(false);
            setUserSignedUp(false);
        }
    }, [wallet.publicKey]);

    const checkUserSignupStatus = async () => {
        if (!wallet.publicKey) {
            setUserSignedUp(false);
            return;
        }
        try {
            // Check if user exists in the database
            const state = await api.fetchState();
            setUserSignedUp(true); // If we can fetch state, user is signed up
        } catch {
            setUserSignedUp(false);
        }
    };

    const handleSignup = async () => {
        if (!wallet.publicKey) {
            alert('Please connect wallet first');
            return;
        }

        try {
            // For now, just mark as signed up. 
            // In a full implementation, this would verify signature or create user in DB
            setUserSignedUp(true);
        } catch (error) {
            console.error('Signup failed:', error);
            alert('Signup failed');
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // --- Configuration ---
        // Colors
        const COLOR_BULL = '#00ff00';
        const COLOR_BEAR = '#ff3b30';
        const COLOR_TEXT = '#ffffff';
        const COLOR_BG = '#131722';
        const COLOR_GRID = '#2a2e39';

        // Logic Constants
        const GRAVITY = 0.25;
        const JUMP = -5.5;
        const SPAWN_RATE = 140; // Frames between pipes
        const OBSTACLE_WIDTH = 60;
        const GAP_SIZE = 170; // Vertical space between obstacles
        const COIN_VALUE = 100; // Fee value
        const MOON_THRESHOLD = 500; // Fees needed for event
        const MOON_DURATION = 500; // Frames the event lasts

        // Obstacle Labels
        const LABELS = ["FUD", "SEC", "IRS", "GAS", "RUG", "DUMP", "HACK", "SCAM", "BEAR"];

        // State
        let frames = 0;
        let currentScore = 0;
        let fees = 0;
        let gamePlaying = false;
        let gameOverState = false;
        let moonMode = false;
        let moonTimer = 0;
        let speed = 2.5;
        let animationFrameId: number;

        // Entities
        let candle: Candle;
        let obstacles: Obstacle[] = [];
        let coins: Coin[] = [];
        let particles: Particle[] = [];
        let bgChartPoints: { x: number, y: number }[] = [];

        // --- Classes ---
        class Candle {
            w: number = 20;
            h: number = 40;
            x: number;
            y: number;
            velocity: number = 0;
            wickHeight: number = 15;
            trail: { x: number, y: number }[] = [];

            constructor() {
                this.x = canvas!.width / 3;
                this.y = canvas!.height / 2;
            }

            draw() {
                if (!ctx) return;
                // Draw Trail
                ctx.beginPath();
                ctx.strokeStyle = moonMode ? '#ffff00' : (this.velocity < 0 ? COLOR_BULL : COLOR_BEAR);
                ctx.lineWidth = 2;
                if (this.trail.length > 1) {
                    ctx.moveTo(this.trail[0].x, this.trail[0].y);
                    for (let i = 1; i < this.trail.length; i++) {
                        ctx.lineTo(this.trail[i].x, this.trail[i].y);
                    }
                }
                ctx.stroke();

                ctx.fillStyle = moonMode ? '#ffff00' : COLOR_BULL;

                // Draw Wick
                ctx.beginPath();
                ctx.strokeStyle = moonMode ? '#ffff00' : COLOR_BULL;
                ctx.lineWidth = 2;
                ctx.moveTo(this.x + this.w / 2, this.y - this.wickHeight);
                ctx.lineTo(this.x + this.w / 2, this.y + this.h + this.wickHeight);
                ctx.stroke();

                // Draw Body
                ctx.shadowBlur = moonMode ? 20 : 10;
                ctx.shadowColor = moonMode ? '#ffff00' : COLOR_BULL;
                ctx.fillRect(this.x, this.y, this.w, this.h);
                ctx.shadowBlur = 0;

                // Reset color for next draws
                ctx.fillStyle = COLOR_TEXT;
            }

            update() {
                this.velocity += GRAVITY;
                this.y += this.velocity;

                // Physics constraints
                if (this.y + this.h > canvas!.height) {
                    this.y = canvas!.height - this.h;
                    triggerGameOver();
                }
                if (this.y < 0) {
                    this.y = 0;
                    this.velocity = 0;
                }

                // Trail Logic
                this.trail.push({ x: this.x + this.w / 2, y: this.y + this.h / 2 });
                if (this.trail.length > 30) this.trail.shift();
                // Shift trail x to match world scrolling
                for (let p of this.trail) {
                    p.x -= speed;
                }
            }

            flap() {
                this.velocity = JUMP;
                createParticles(this.x, this.y + this.h, 5, COLOR_BULL);
            }
        }

        class Obstacle {
            x: number;
            w: number;
            topHeight: number;
            bottomY: number;
            bottomHeight: number;
            markedForDeletion: boolean = false;
            passed: boolean = false;
            label: string;

            constructor() {
                this.x = canvas!.width;
                this.w = OBSTACLE_WIDTH;
                this.topHeight = Math.random() * (canvas!.height - GAP_SIZE - 100) + 50;
                this.bottomY = this.topHeight + GAP_SIZE;
                this.bottomHeight = canvas!.height - this.bottomY;
                this.label = LABELS[Math.floor(Math.random() * LABELS.length)];
            }

            draw() {
                if (!ctx) return;
                ctx.fillStyle = '#2c2f36';
                ctx.strokeStyle = COLOR_BEAR;
                ctx.lineWidth = 2;

                // Top Pipe
                ctx.fillRect(this.x, 0, this.w, this.topHeight);
                ctx.strokeRect(this.x, 0, this.w, this.topHeight);

                // Bottom Pipe
                ctx.fillRect(this.x, this.bottomY, this.w, this.bottomHeight);
                ctx.strokeRect(this.x, this.bottomY, this.w, this.bottomHeight);

                // Labels
                ctx.fillStyle = COLOR_BEAR;
                ctx.font = '20px VT323';
                ctx.textAlign = 'center';

                // Top Label
                ctx.save();
                ctx.translate(this.x + this.w / 2, this.topHeight - 20);
                ctx.fillText(this.label, 0, 0);
                ctx.restore();

                // Bottom Label
                ctx.save();
                ctx.translate(this.x + this.w / 2, this.bottomY + 40);
                ctx.fillText(this.label, 0, 0);
                ctx.restore();
            }

            update() {
                this.x -= speed;
                if (this.x + this.w < 0) {
                    this.markedForDeletion = true;
                }
            }
        }

        class Coin {
            x: number;
            y: number;
            r: number = 12;
            markedForDeletion: boolean = false;
            floatOffset: number;

            constructor(x: number, y: number) {
                this.x = x;
                this.y = y;
                this.floatOffset = Math.random() * Math.PI * 2;
            }

            draw() {
                if (!ctx) return;
                const floatY = Math.sin(frames * 0.1 + this.floatOffset) * 5;

                ctx.beginPath();
                ctx.fillStyle = '#FFD700'; // Gold
                ctx.arc(this.x, this.y + floatY, this.r, 0, Math.PI * 2);
                ctx.fill();

                // "F" symbol for Fee or "Ξ"
                ctx.fillStyle = '#000';
                ctx.font = '16px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Ξ', this.x, this.y + floatY);
            }

            update() {
                this.x -= speed;
                if (this.x + this.r < 0) this.markedForDeletion = true;
            }
        }

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            life: number = 1.0;
            color: string;

            constructor(x: number, y: number, color: string) {
                this.x = x;
                this.y = y;
                this.vx = (Math.random() - 0.5) * 5;
                this.vy = (Math.random() - 0.5) * 5;
                this.color = color;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.life -= 0.03;
            }

            draw() {
                if (!ctx) return;
                ctx.globalAlpha = this.life;
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, 4, 4);
                ctx.globalAlpha = 1.0;
            }
        }

        // --- Functions ---

        function resize() {
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // Re-init background chart on resize
            bgChartPoints = [];
            let y = canvas.height / 2;
            for (let x = 0; x < canvas.width + 50; x += 20) {
                y += (Math.random() - 0.5) * 20;
                bgChartPoints.push({ x, y });
            }
        }

        function createParticles(x: number, y: number, count: number, color: string) {
            for (let i = 0; i < count; i++) {
                particles.push(new Particle(x, y, color));
            }
        }

        function activateMoonMode() {
            moonMode = true;
            setIsMooning(true);
            moonTimer = MOON_DURATION;
            speed = 4.5;
            if (candle) createParticles(candle.x, candle.y, 50, '#ffff00');
        }

        function deactivateMoonMode() {
            moonMode = false;
            setIsMooning(false);
            speed = 2.5;
            fees = 0;
            setMoonProgress(0);
        }

        function drawBackground() {
            if (!ctx || !canvas) return;
            ctx.fillStyle = COLOR_BG;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Grid
            ctx.strokeStyle = COLOR_GRID;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = -(frames * 0.5) % 40; x < canvas.width; x += 40) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
            }
            for (let y = 0; y < canvas.height; y += 40) {
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
            }
            ctx.stroke();

            // Draw Scrolling Background Chart
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 2;

            if (bgChartPoints.length > 0) {
                // Scroll points left
                for (let p of bgChartPoints) p.x -= 0.5;

                // Remove off screen and add new
                if (bgChartPoints[0].x < 0) {
                    bgChartPoints.shift();
                    let lastX = bgChartPoints[bgChartPoints.length - 1].x;
                    let lastY = bgChartPoints[bgChartPoints.length - 1].y;
                    let newY = lastY + (Math.random() - 0.5) * 30;
                    // Keep within bounds
                    if (newY < 100) newY = 100;
                    if (newY > canvas.height - 100) newY = canvas.height - 100;

                    bgChartPoints.push({ x: lastX + 20, y: newY });
                }

                ctx.moveTo(bgChartPoints[0].x, bgChartPoints[0].y);
                for (let i = 1; i < bgChartPoints.length; i++) {
                    ctx.lineTo(bgChartPoints[i].x, bgChartPoints[i].y);
                }
                ctx.stroke();
            }
        }

        function triggerGameOver() {
            gamePlaying = false;
            gameOverState = true;
            setIsGameStarted(false);
            setIsGameOver(true);

            // Update high score
            const stored = localStorage.getItem('degen_high_score');
            let currentHigh = stored ? parseInt(stored, 10) : 0;
            if (currentScore > currentHigh) {
                localStorage.setItem('degen_high_score', currentScore.toString());
                setHighScore(currentScore);
            }

            // Submit Score
            const walletAddr = wallet.publicKey?.toBase58() || 'Anonymous';
            
            if (!wallet.publicKey) {
                // Guest mode: Don't submit score to backend, or submit as guest if backend supports it
                console.log('Guest score: ' + currentScore);
                // Optionally fetch leaderboard just to show it, even if user isn't on it
                api.fetchLeaderboard().then(setLeaderboard);
                return;
            }

            api.submitScore(currentScore, walletAddr).then(() => {
                console.log('Score submitted');
                return Promise.all([api.fetchLeaderboard(), api.fetchPayouts()]);
            }).then(([lb, pay]) => {
                setLeaderboard(lb);
                setPayouts(pay);
            }).catch(err => console.error('Score submission failed:', err));
        }

        function loop() {
            if (!gamePlaying) return;

            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            frames++;

            drawBackground();

            // Manage Moon Mode
            if (moonMode) {
                moonTimer--;
                setMoonProgress((moonTimer / MOON_DURATION) * 100);
                if (moonTimer <= 0) {
                    deactivateMoonMode();
                }
            }

            // Obstacle Logic
            if (frames % Math.floor(SPAWN_RATE / (speed / 2.5)) === 0) {
                let obst = new Obstacle();
                obstacles.push(obst);

                let coinY = obst.topHeight + (GAP_SIZE / 2);
                coins.push(new Coin(obst.x + obst.w / 2, coinY));
            }

            // Update & Draw Obstacles
            for (let i = obstacles.length - 1; i >= 0; i--) {
                let o = obstacles[i];
                o.update();
                o.draw();

                // Collision
                if (!moonMode) {
                    if (
                        candle.x < o.x + o.w &&
                        candle.x + candle.w > o.x &&
                        (candle.y < o.topHeight || candle.y + candle.h > o.bottomY)
                    ) {
                        triggerGameOver();
                    }
                }

                // Score counting
                if (!o.passed && candle.x > o.x + o.w) {
                    currentScore += moonMode ? 50 : 10;
                    setScore(currentScore);
                    o.passed = true;
                }

                if (o.markedForDeletion) obstacles.splice(i, 1);
            }

            // Update & Draw Coins
            for (let i = coins.length - 1; i >= 0; i--) {
                let c = coins[i];
                c.update();
                c.draw();

                // Collision with Coin
                let dx = (candle.x + candle.w / 2) - c.x;
                let dy = (candle.y + candle.h / 2) - c.y;
                let dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < c.r + candle.w / 2) {
                    createParticles(c.x, c.y, 10, '#FFD700');
                    fees += COIN_VALUE;
                    c.markedForDeletion = true;

                    if (!moonMode) {
                        let percent = Math.min(100, (fees / MOON_THRESHOLD) * 100);
                        setMoonProgress(percent);

                        if (fees >= MOON_THRESHOLD) {
                            activateMoonMode();
                        }
                    }
                }

                if (c.markedForDeletion) coins.splice(i, 1);
            }

            // Update & Draw Particles
            for (let i = particles.length - 1; i >= 0; i--) {
                let p = particles[i];
                p.update();
                p.draw();
                if (p.life <= 0) particles.splice(i, 1);
            }

            // Player
            candle.update();
            candle.draw();

            animationFrameId = requestAnimationFrame(loop);
        }

        // --- Input Handling ---
        const handleInput = (e: Event) => {
            // Check if target is an interactive element (button, link, etc.)
            // If so, we want to allow the default browser behavior (click) and NOT trigger game actions
            const target = e.target as HTMLElement;
            const isInteractive = target && target.closest && (
                target.closest('button') || 
                target.closest('a') || 
                target.closest('.wallet-adapter-button') ||
                target.closest('.leaderboard-container')
            );
            
            if (isInteractive && e.type !== 'keydown') {
                return;
            }

            // If it's a click/touch, only allow it if the game is ALREADY playing or if it's the game over screen (to restart)
            // We do NOT want clicks to start the game from the main menu, because that interferes with UI buttons.
            const isMouseOrTouch = e.type === 'mousedown' || e.type === 'touchstart';

            if (e.type === 'keydown') {
                const ke = e as KeyboardEvent;
                if (ke.code !== 'Space' && ke.code !== 'ArrowUp') return;
            }

            // Prevent default behavior (scrolling, etc.)
            // Only prevent default if it's not an interactive element we just allowed (which we handled above)
            // But actually, if we returned above, we wouldn't be here.
            // So we are safe to prevent default here for game interactions.
            if (e.cancelable && !isInteractive) e.preventDefault();

            if (gamePlaying) {
                if (candle) candle.flap();
            } else if (gameOverState) {
                // Restart on click or space is fine for Game Over screen
                initGame();
            } else if (!gamePlaying && !gameOverState) {
                // Main Menu: Only start on Space/ArrowUp (which the Start Button simulates), NOT on click/touch
                if (!isMouseOrTouch) {
                    initGame();
                }
            }
        };

        const initGame = () => {
            if (!canvas) return;
            candle = new Candle();
            obstacles = [];
            coins = [];
            particles = [];
            frames = 0;
            currentScore = 0;
            fees = 0;
            moonMode = false;
            moonTimer = 0;
            speed = 2.5;

            setScore(0);
            setMoonProgress(0);
            setIsMooning(false);
            setIsGameOver(false);
            setIsGameStarted(true);

            gamePlaying = true;
            gameOverState = false;

            loop();
        };

        // Attach listeners
        window.addEventListener('resize', resize);
        window.addEventListener('keydown', handleInput);
        window.addEventListener('mousedown', handleInput);
        window.addEventListener('touchstart', handleInput, { passive: false });

        // Initial resize
        resize();

        // Expose initGame to external controls if needed, or just rely on state
        // Actually, we need to handle the "Start" button click from React state
        // But the event listener above handles it globally. 
        // We'll expose a ref or just use the button to trigger the same logic.

        // Clean up
        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('keydown', handleInput);
            window.removeEventListener('mousedown', handleInput);
            window.removeEventListener('touchstart', handleInput);
            cancelAnimationFrame(animationFrameId);
        };
    }, []); // Empty dependency array - run once on mount

    // We need a way to trigger start/restart from the UI buttons
    // Since the game logic is inside the effect, we can't easily call initGame from outside.
    // A common pattern is to use a ref to store the initGame function or use a custom event.
    // OR, we can just dispatch a keydown event or similar.
    // Simpler: Just use the same logic in the button handlers.

    // Actually, the cleanest way is to not define everything inside useEffect.
    // But for canvas games, it's often easier to keep the loop and state together.
    // Let's just simulate a click or space press for the buttons, OR better yet,
    // we can move `initGame` to a ref that we can call.



    return (
        <div className="relative w-full h-screen flex justify-center items-center bg-[#0a0b0d] overflow-hidden font-vt323">
            <canvas
                ref={canvasRef}
                className="border border-[#333] bg-[#131722] shadow-[0_0_20px_rgba(0,255,0,0.1)]"
            />

            {/* Scanlines */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 bg-scanlines opacity-50"></div>

            {/* HUD */}
            <div className={`absolute top-[10px] left-0 w-full px-[20px] flex justify-between text-[1.5rem] text-white z-15 ${!isGameStarted && !isGameOver ? 'hidden' : ''}`}>
                <div>
                    <div>NET WORTH: <span className="text-[#00ff00]">${score}</span></div>
                    <div className="text-xs text-gray-400">HIGH: <span>${highScore}</span></div>
                    {wallet.publicKey ? (
                        <div className="text-xs text-gray-500 mt-1">WALLET: {wallet.publicKey.toBase58().substring(0, 8)}...</div>
                    ) : (
                        <div className="text-xs text-yellow-400 mt-1">⚠ CONNECT WALLET</div>
                    )}
                </div>
                <div className="text-right flex flex-col items-end">
                    <button
                        className="mb-2 bg-red-900/80 text-white border border-red-500 px-3 py-1 text-sm font-share-tech-mono hover:bg-red-800 transition-colors pointer-events-auto z-50"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsGameStarted(false);
                            setIsGameOver(false);
                            setScore(0);
                            // Reset game state internally if needed, though re-mounting or just resetting flags works
                            // Ideally we should stop the loop.
                            // The loop checks `gamePlaying` flag.
                            // We need to set gamePlaying = false inside the component scope if we could, 
                            // but since we can't easily reach into the closure, we rely on state.
                            // Actually, we need to force a re-render or reload to cleanly stop the loop if it's running.
                            // But since `gamePlaying` is a let variable inside useEffect, we can't change it from here directly.
                            // However, we can force the component to unmount/remount or use a ref to control the loop.
                            // A simple way: reload the page? No, that's bad UX.
                            // Better: Use a ref for `gamePlaying` that is shared.
                            // For now, let's just reload the page to be safe and "degen" style, OR 
                            // we can just hide the canvas and show start screen, but the loop might keep running.
                            // Let's fix the loop control first.
                            window.location.reload();
                        }}
                    >
                        [EXIT GAME]
                    </button>
                    <div>CREATOR FEES</div>
                    <div className="w-[200px] h-[20px] border-2 border-white bg-[#222] relative mt-[5px]">
                        <div
                            className={`h-full transition-all duration-200 ${isMooning ? 'bg-gradient-to-r from-[#00ff00] to-[#ccff00] animate-pulse' : 'bg-gradient-to-r from-[#ffd700] to-[#ffaa00]'}`}
                            style={{ width: `${moonProgress}%` }}
                        ></div>
                    </div>
                    {isMooning && <div className="text-xs text-yellow-400">MEGA GREEN CANDLE ACTIVE!</div>}
                </div>
            </div>

            {/* Start Screen */}
            {!isGameStarted && !isGameOver && (
                <StartScreen 
                    walletConnected={walletConnected || isGuest}
                    userSignedUp={userSignedUp || isGuest}
                    walletAddress={isGuest ? "GUEST PLAYER" : walletAddress}
                    onSignup={handleSignup}
                    onStart={() => {
                        window.dispatchEvent(new KeyboardEvent('keydown', { 'code': 'Space' }));
                    }}
                    onPlayFree={() => {
                        setIsGuest(true);
                    }}
                    onDisconnect={() => {
                        if (isGuest) {
                            setIsGuest(false);
                            setWalletAddress('');
                        } else {
                            wallet.disconnect();
                        }
                    }}
                />
            )}

            {/* Game Over Screen */}
            {isGameOver && (
                <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center z-20 bg-black/80 backdrop-blur-md">
                    <h1 className="text-6xl text-red-500 mb-2 font-vt323">REKT / NGMI</h1>
                    <p className="text-white text-2xl mb-4 font-vt323">Your Portfolio: <span>${score}</span></p>
                    <button
                        className="bg-[#ff3b30] text-black border-none py-[15px] px-[40px] text-[2rem] font-vt323 uppercase cursor-pointer shadow-[0_0_15px_#ff3b30] rounded hover:scale-105 active:scale-95 transition-all"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent click from propagating to canvas listeners immediately
                            window.dispatchEvent(new KeyboardEvent('keydown', { 'code': 'Space' }));
                        }}
                    >
                        BUY THE DIP
                    </button>
                </div>
            )}

            {/* Leaderboard / Payouts Overlay (on Game Over) */}
            {isGameOver && (
                <div className="leaderboard-container absolute bottom-10 right-10 bg-black/80 border border-gray-700 p-4 rounded text-white font-vt323 z-30 max-h-[300px] overflow-y-auto w-[300px]">
                    <div className="flex justify-between mb-2 border-b border-gray-600 pb-1">
                        <h3
                            className={`text-xl cursor-pointer ${!showPayouts ? 'text-[#ffd700]' : 'text-gray-500'}`}
                            onClick={() => setShowPayouts(false)}
                        >
                            LEADERBOARD
                        </h3>
                        <h3
                            className={`text-xl cursor-pointer ${showPayouts ? 'text-[#00ff00]' : 'text-gray-500'}`}
                            onClick={() => setShowPayouts(true)}
                        >
                            PAYOUTS
                        </h3>
                    </div>

                    {!showPayouts ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-400 text-left">
                                    <th className="pr-4">PLAYER</th>
                                    <th className="text-right">SCORE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((entry, i) => (
                                    <tr key={i} className={entry.wallet_address === walletAddress ? 'text-[#00ff00]' : ''}>
                                        <td className="pr-4">{entry.display_name || entry.wallet_address.substring(0, 8) + '...'}</td>
                                        <td className="text-right">${entry.high_score}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-sm">
                            {payouts.length === 0 ? (
                                <div className="text-gray-500 text-center py-4">No recent payouts</div>
                            ) : (
                                payouts.map((p, i) => (
                                    <div key={i} className="mb-2 border-b border-gray-800 pb-1 last:border-0">
                                        <div className="flex justify-between text-[#00ff00]">
                                            <span>${parseFloat(p.amount_usd.toString()).toFixed(2)}</span>
                                            <span className="text-gray-400 text-xs">{new Date(p.created_at).toLocaleTimeString()}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                            To: {p.wallet_address}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
