import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

type RobotState = 'idle' | 'error' | 'success' | 'thinking' | 'loading' | 'processing' | 'warning' | 'quantum' | 'hyperdrive';

interface AnimatedRobotProps {
    state: RobotState;
    size?: number;
    interactive?: boolean;
}

export const AnimatedRobot: React.FC<AnimatedRobotProps> = ({ state, size = 300, interactive = true }) => {
    const [isBlinking, setIsBlinking] = useState(false);
    const [particles, setParticles] = useState<Array<{ id: number; angle: number; delay: number }>>([]);
    const [heartbeat, setHeartbeat] = useState(0);
    const [breathe, setBreathe] = useState(0);
    const [quantumField, setQuantumField] = useState(0);
    const [dataStream, setDataStream] = useState(0);
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Motion values for mouse tracking
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Initialize particles with more variations
    useEffect(() => {
        const newParticles = Array.from({ length: 48 }, (_, i) => ({
            id: i,
            angle: (i * 7.5),
            delay: i * 0.03,
        }));
        setParticles(newParticles);
    }, []);

    // Mouse tracking for interactivity
    useEffect(() => {
        if (!interactive || !svgRef.current) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = svgRef.current?.getBoundingClientRect();
            if (rect) {
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                mouseX.set(x / 10);
                mouseY.set(y / 10);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [interactive, mouseX, mouseY]);

    // Heartbeat animation
    useEffect(() => {
        const heartInterval = setInterval(() => {
            setHeartbeat(prev => (prev + 1) % 360);
        }, 30);
        return () => clearInterval(heartInterval);
    }, []);

    // Breathing animation
    useEffect(() => {
        const breatheInterval = setInterval(() => {
            setBreathe(prev => (prev + 1) % 360);
        }, 25);
        return () => clearInterval(breatheInterval);
    }, []);

    // Quantum field animation
    useEffect(() => {
        const quantumInterval = setInterval(() => {
            setQuantumField(prev => (prev + 1) % 360);
        }, 40);
        return () => clearInterval(quantumInterval);
    }, []);

    // Data stream animation
    useEffect(() => {
        const dataInterval = setInterval(() => {
            setDataStream(prev => (prev + 3) % 360);
        }, 35);
        return () => clearInterval(dataInterval);
    }, []);

    // Blinking animation for idle state
    useEffect(() => {
        if (state === 'idle') {
            const blinkInterval = setInterval(() => {
                setIsBlinking(true);
                setTimeout(() => setIsBlinking(false), 150);
            }, 3000);
            return () => clearInterval(blinkInterval);
        }
    }, [state]);

    // Eye expressions based on state
    const getEyeScale = () => {
        if (isBlinking && state === 'idle') return 0.1;
        if (state === 'error') return 1.3;
        if (state === 'warning') return 1.1;
        if (state === 'success') return 0.3;
        if (state === 'loading') return 1 + Math.sin(breathe / 10) * 0.15;
        if (state === 'processing') return 1 + Math.cos(heartbeat / 15) * 0.2;
        if (state === 'quantum') return 1 + Math.sin(quantumField / 20) * 0.25;
        if (state === 'hyperdrive') return 1.5 + Math.sin(dataStream / 15) * 0.4;
        return 1;
    };

    const getEyeY = () => {
        if (state === 'error') return -5;
        if (state === 'success') return 2;
        if (state === 'processing') return Math.sin(breathe / 10) * 3;
        if (state === 'quantum') return Math.sin(quantumField / 20) * 5;
        if (state === 'hyperdrive') return Math.sin(dataStream / 15) * 8;
        return 0;
    };

    // Mouth expressions based on state
    const getMouthPath = () => {
        const offset = Math.sin(breathe / 20) * 2;
        switch (state) {
            case 'error':
                return 'M 78 108 Q 100 118 122 108';
            case 'success':
                return 'M 78 105 Q 100 118 122 105';
            case 'thinking':
                return 'M 78 110 L 122 110';
            case 'loading':
                return `M 78 110 Q 100 ${115 + offset} 122 110`;
            case 'processing':
                return `M 78 108 Q 100 ${115 + Math.sin(heartbeat / 10) * 3} 122 108`;
            case 'warning':
                return 'M 78 110 Q 90 115 100 110 Q 110 115 122 110';
            case 'quantum':
                return `M 78 108 Q 100 ${115 + Math.sin(quantumField / 15) * 4} 122 108`;
            case 'hyperdrive':
                return `M 78 105 Q 100 ${118 + Math.sin(dataStream / 12) * 5} 122 105`;
            default:
                return 'M 78 108 Q 100 112 122 108';
        }
    };

    // Colors based on state
    const getBodyColor = () => {
        switch (state) {
            case 'error':
                return '#ef4444';
            case 'success':
                return '#22c55e';
            case 'loading':
                return '#f59e0b';
            case 'processing':
                return '#8b5cf6';
            case 'warning':
                return '#f97316';
            case 'quantum':
                return '#00d9ff';
            case 'hyperdrive':
                return '#ff00ff';
            default:
                return '#3b82f6';
        }
    };

    const getGlowColor = () => {
        switch (state) {
            case 'error':
                return 'rgba(239, 68, 68, 0.4)';
            case 'success':
                return 'rgba(34, 197, 94, 0.4)';
            case 'loading':
                return 'rgba(245, 158, 11, 0.4)';
            case 'processing':
                return 'rgba(139, 92, 246, 0.4)';
            case 'warning':
                return 'rgba(249, 115, 22, 0.4)';
            case 'quantum':
                return 'rgba(0, 217, 255, 0.5)';
            case 'hyperdrive':
                return 'rgba(255, 0, 255, 0.6)';
            default:
                return 'rgba(59, 130, 246, 0.4)';
        }
    };

    return (
        <div 
            ref={containerRef}
            className="flex items-center justify-center relative" 
            style={{ 
                width: size, 
                height: size,
                perspective: '1200px',
                background: state === 'quantum' || state === 'hyperdrive' 
                    ? `radial-gradient(circle, rgba(0,217,255,0.05) 0%, transparent 70%)`
                    : 'transparent'
            }}
        >
            {/* Quantum field background */}
            {(state === 'quantum' || state === 'hyperdrive') && (
                <div 
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: `conic-gradient(from ${dataStream}deg, rgba(0,217,255,0.1), rgba(255,0,255,0.1), rgba(0,217,255,0.1))`,
                        borderRadius: '50%',
                        animation: state === 'hyperdrive' ? 'spin 2s linear infinite' : undefined,
                        pointerEvents: 'none'
                    }}
                />
            )}

            <svg
                ref={svgRef}
                viewBox="0 0 200 220"
                width={size}
                height={size}
                className="overflow-visible"
                style={{
                    filter: state === 'error' ? 'drop-shadow(0 0 30px rgba(239, 68, 68, 0.8))' :
                           state === 'success' ? 'drop-shadow(0 0 30px rgba(34, 197, 94, 0.8))' :
                           state === 'processing' ? 'drop-shadow(0 0 30px rgba(139, 92, 246, 0.8))' :
                           state === 'quantum' ? 'drop-shadow(0 0 40px rgba(0, 217, 255, 1))' :
                           state === 'hyperdrive' ? 'drop-shadow(0 0 50px rgba(255, 0, 255, 1)) drop-shadow(0 0 100px rgba(0, 217, 255, 0.8))' :
                           'drop-shadow(0 0 20px rgba(59, 130, 246, 0.6))',
                    mixBlendMode: state === 'hyperdrive' ? 'screen' : 'normal'
                }}
            >
                {/* Advanced Defs */}
                <defs>
                    {/* Scanline pattern */}
                    <pattern id="scanlines" patternUnits="userSpaceOnUse" width="200" height="2">
                        <line x1="0" y1="0" x2="200" y2="0" stroke="rgba(0,217,255,0.1)" strokeWidth="1" />
                    </pattern>

                    {/* Quantum noise texture */}
                    <filter id="quantumNoise">
                        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="6" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" />
                    </filter>

                    {/* Hyperdrive warp */}
                    <filter id="hyperwarp">
                        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="5" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" />
                    </filter>

                    {/* Chromatic Aberration Filter */}
                    <filter id="chromaticAberration">
                        <feDisplacementMap in="SourceGraphic" scale="3" xChannelSelector="R" yChannelSelector="G" />
                    </filter>

                    {/* Turbulence for processing state */}
                    <filter id="turbulence">
                        <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="4" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
                    </filter>

                    {/* Advanced Glow filters */}
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="innerGlow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="strongGlow">
                        <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Cosmic glow */}
                    <filter id="cosmicGlow">
                        <feGaussianBlur stdDeviation="12" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Glitch Effect */}
                    <filter id="glitch">
                        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
                    </filter>

                    {/* Light displacement for processing */}
                    <filter id="lightDisplacement">
                        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" />
                        <feDisplacementMap in="SourceGraphic" scale="2" />
                    </filter>
                    
                    {/* 3D Gradients */}
                    <radialGradient id="sphereGradient">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                        <stop offset="50%" stopColor={getBodyColor()} stopOpacity="1" />
                        <stop offset="100%" stopColor={getBodyColor()} stopOpacity="0.6" />
                    </radialGradient>
                    
                    <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={getBodyColor()} stopOpacity="1" />
                        <stop offset="50%" stopColor={getBodyColor()} stopOpacity="0.85" />
                        <stop offset="100%" stopColor={getBodyColor()} stopOpacity="0.7" />
                    </linearGradient>
                    
                    <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#e2e8f0" />
                        <stop offset="50%" stopColor="#cbd5e1" />
                        <stop offset="100%" stopColor="#94a3b8" />
                    </linearGradient>
                    
                    <radialGradient id="glassGradient" cx="30%" cy="30%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                        <stop offset="70%" stopColor="#f1f5f9" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.85" />
                    </radialGradient>
                    
                    <linearGradient id="screenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#0f172a" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#1e293b" stopOpacity="0.95" />
                    </linearGradient>

                    {/* Holographic gradient */}
                    <linearGradient id="holographicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00ff88" stopOpacity="0.3" />
                        <stop offset="50%" stopColor="#00ffff" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#0088ff" stopOpacity="0.3" />
                    </linearGradient>

                    {/* Quantum gradient */}
                    <radialGradient id="quantumGradient" cx="50%" cy="50%">
                        <stop offset="0%" stopColor="#00ffff" stopOpacity="0.8" />
                        <stop offset="50%" stopColor="#00d9ff" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#0088ff" stopOpacity="0.2" />
                    </radialGradient>

                    {/* Hyperdrive gradient */}
                    <linearGradient id="hyperdriveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ff00ff" stopOpacity="1" />
                        <stop offset="50%" stopColor="#ff00aa" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#00ffff" stopOpacity="0.4" />
                    </linearGradient>
                </defs>

                {/* Hyperdrive tunnel effect */}
                <AnimatePresence>
                    {state === 'hyperdrive' && (
                        <>
                            {[0, 1, 2, 3, 4].map((i) => (
                                <motion.circle
                                    key={`tunnel-${i}`}
                                    cx="100"
                                    cy="90"
                                    r={120 - i * 15}
                                    fill="none"
                                    stroke={i % 2 === 0 ? '#ff00ff' : '#00ffff'}
                                    strokeWidth="2"
                                    opacity={0.6 - i * 0.1}
                                    initial={{ r: 120 - i * 15 + 20 }}
                                    animate={{ 
                                        r: [120 - i * 15 - 20, 120 - i * 15 + 20],
                                        opacity: [0.6 - i * 0.1, 0.1, 0.6 - i * 0.1]
                                    }}
                                    transition={{
                                        duration: 0.8,
                                        repeat: Infinity,
                                        ease: 'easeInOut'
                                    }}
                                    filter="url(#cosmicGlow)"
                                />
                            ))}
                        </>
                    )}
                </AnimatePresence>

                {/* Quantum vortex */}
                <AnimatePresence>
                    {state === 'quantum' && (
                        <>
                            {[0, 1, 2, 3].map((i) => (
                                <motion.g
                                    key={`quantum-vortex-${i}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <motion.path
                                        d={`M 100 50 A 50 50 0 0 1 150 90 A 50 50 0 0 1 100 130 A 50 50 0 0 1 50 90 A 50 50 0 0 1 100 50`}
                                        fill="none"
                                        stroke="#00d9ff"
                                        strokeWidth="2"
                                        opacity={0.6 - i * 0.15}
                                        initial={{ pathLength: 0, rotate: 0 }}
                                        animate={{
                                            pathLength: 1,
                                            rotate: i % 2 === 0 ? 360 : -360,
                                            opacity: [0.6 - i * 0.15, 0.1]
                                        }}
                                        transition={{
                                            duration: 3 + i * 0.5,
                                            repeat: Infinity,
                                            ease: 'linear'
                                        }}
                                        style={{ originX: '100px', originY: '90px' }}
                                    />
                                </motion.g>
                            ))}
                        </>
                    )}
                </AnimatePresence>

                {/* Pulsing Energy Field - Advanced */}
                <motion.circle
                    cx="100"
                    cy="90"
                    r="70"
                    fill={getGlowColor()}
                    initial={{ scale: 1, opacity: 0.2 }}
                    animate={{
                        scale: state === 'error' ? [1, 1.3, 1] : 
                               state === 'success' ? [1, 1.4, 1.4] : 
                               state === 'thinking' ? [1, 1.15, 1] :
                               state === 'loading' ? [1, 1.2, 1] :
                               state === 'processing' ? [1, 1.25, 1] :
                               state === 'quantum' ? [1, 1.5, 1] :
                               state === 'hyperdrive' ? [1, 2, 1] : 1,
                        opacity: state === 'error' ? [0.2, 0.7, 0.2] : 
                                state === 'success' ? [0.2, 0.9, 0.9] : 
                                state === 'thinking' ? [0.2, 0.5, 0.2] :
                                state === 'loading' ? [0.2, 0.6, 0.2] :
                                state === 'processing' ? [0.2, 0.8, 0.2] :
                                state === 'quantum' ? [0.3, 1, 0.3] :
                                state === 'hyperdrive' ? [0.5, 1, 0.5] : 0.2,
                    }}
                    transition={{
                        duration: state === 'error' ? 0.4 : 
                                 state === 'thinking' ? 2 : 
                                 state === 'processing' ? 1 :
                                 state === 'quantum' ? 1.5 :
                                 state === 'hyperdrive' ? 0.6 :
                                 1.5,
                        repeat: state === 'error' ? 4 : state === 'thinking' || state === 'loading' || state === 'processing' || state === 'quantum' || state === 'hyperdrive' ? Infinity : 0,
                    }}
                    filter={state === 'quantum' ? 'url(#quantumNoise)' : state === 'hyperdrive' ? 'url(#hyperwarp)' : state === 'processing' ? 'url(#lightDisplacement)' : undefined}
                />

                {/* Quantum probability clouds */}
                <AnimatePresence>
                    {state === 'quantum' && (
                        <>
                            {[0, 1, 2].map((i) => (
                                <motion.circle
                                    key={`quantum-cloud-${i}`}
                                    cx={100 + Math.cos((quantumField + i * 120) * Math.PI / 180) * 60}
                                    cy={90 + Math.sin((quantumField + i * 120) * Math.PI / 180) * 60}
                                    r="15"
                                    fill="url(#quantumGradient)"
                                    opacity="0.5"
                                    filter="url(#cosmicGlow)"
                                />
                            ))}
                        </>
                    )}
                </AnimatePresence>

                {/* Holographic rings for processing state */}
                <AnimatePresence>
                    {state === 'processing' && (
                        <>
                            {[0, 1, 2].map((i) => (
                                <motion.circle
                                    key={`holo-ring-${i}`}
                                    cx="100"
                                    cy="90"
                                    r={50 + i * 10}
                                    fill="url(#holographicGradient)"
                                    opacity={0.4}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{
                                        scale: [0.8, 1.3, 1.6],
                                        opacity: [0.4, 0.2, 0],
                                        rotate: [0, 360]
                                    }}
                                    transition={{
                                        duration: 2,
                                        delay: i * 0.3,
                                        repeat: Infinity,
                                        ease: 'linear'
                                    }}
                                />
                            ))}
                        </>
                    )}
                </AnimatePresence>

                {/* Double Antenna System - Enhanced */}
                <motion.g
                    animate={{
                        rotate: state === 'thinking' ? [0, -8, 8, 0] : 
                               state === 'processing' ? [0, -12, 12, 0] :
                               state === 'error' ? [0, -15, 15, -15, 0] : 0,
                    }}
                    transition={{
                        duration: state === 'error' ? 0.4 : 
                                 state === 'processing' ? 1.5 :
                                 2,
                        repeat: state === 'error' ? 4 : state === 'thinking' || state === 'processing' ? Infinity : 0,
                        ease: 'easeInOut',
                    }}
                    style={{ originX: '100px', originY: '25px' }}
                    filter={state === 'error' ? 'url(#glitch)' : undefined}
                >
                    {/* Left Antenna */}
                    <g>
                        <motion.line
                            x1="85"
                            y1="30"
                            x2="80"
                            y2="10"
                            stroke={getBodyColor()}
                            strokeWidth="4"
                            strokeLinecap="round"
                            filter="url(#glow)"
                        />
                        <motion.circle
                            cx="80"
                            cy="8"
                            r="6"
                            fill={getBodyColor()}
                            animate={{
                                scale: state === 'thinking' ? [1, 1.4, 1] : state === 'processing' ? [1, 1.6, 1] : 1,
                                opacity: state === 'thinking' ? [1, 0.4, 1] : state === 'processing' ? [1, 0.3, 1] : 1,
                            }}
                            transition={{
                                duration: state === 'processing' ? 0.8 : 1,
                                repeat: state === 'thinking' || state === 'processing' ? Infinity : 0,
                            }}
                            filter="url(#strongGlow)"
                        />
                        <circle cx="80" cy="8" r="3" fill="#ffffff" opacity="0.8" />
                    </g>
                    
                    {/* Right Antenna */}
                    <g>
                        <motion.line
                            x1="115"
                            y1="30"
                            x2="120"
                            y2="10"
                            stroke={getBodyColor()}
                            strokeWidth="4"
                            strokeLinecap="round"
                            filter="url(#glow)"
                        />
                        <motion.circle
                            cx="120"
                            cy="8"
                            r="6"
                            fill={getBodyColor()}
                            animate={{
                                scale: state === 'thinking' ? [1, 1.4, 1] : state === 'processing' ? [1, 1.6, 1] : 1,
                                opacity: state === 'thinking' ? [1, 0.4, 1] : state === 'processing' ? [1, 0.3, 1] : 1,
                            }}
                            transition={{
                                duration: state === 'processing' ? 0.8 : 1,
                                repeat: state === 'thinking' || state === 'processing' ? Infinity : 0,
                                delay: state === 'processing' ? 0.2 : 0.3,
                            }}
                            filter="url(#strongGlow)"
                        />
                        <circle cx="120" cy="8" r="3" fill="#ffffff" opacity="0.8" />
                    </g>
                    
                    {/* Signal waves when thinking or processing */}
                    <AnimatePresence>
                        {(state === 'thinking' || state === 'processing') && (
                            <>
                                {[0, 1, 2, 3].map((i) => (
                                    <motion.circle
                                        key={`wave-${i}`}
                                        cx="100"
                                        cy="10"
                                        r="5"
                                        fill="none"
                                        stroke={getBodyColor()}
                                        strokeWidth="2"
                                        initial={{ r: 5, opacity: 0.8 }}
                                        animate={{ r: state === 'processing' ? 35 : 25, opacity: 0 }}
                                        transition={{
                                            duration: state === 'processing' ? 1 : 1.5,
                                            repeat: Infinity,
                                            delay: i * (state === 'processing' ? 0.3 : 0.5),
                                        }}
                                    />
                                ))}
                            </>
                        )}
                    </AnimatePresence>

                    {/* Advanced data streams for processing */}
                    <AnimatePresence>
                        {state === 'processing' && (
                            <>
                                {[0, 1, 2].map((i) => (
                                    <motion.path
                                        key={`data-stream-${i}`}
                                        d={`M 100 30 Q ${100 + Math.sin(i) * 30} 20 80 5`}
                                        fill="none"
                                        stroke={getBodyColor()}
                                        strokeWidth="2"
                                        opacity="0.6"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: [0, 1, 0] }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            delay: i * 0.4
                                        }}
                                    />
                                ))}
                            </>
                        )}
                    </AnimatePresence>
                </motion.g>

                {/* Robot Head - Ultra Advanced */}
                <motion.g
                    animate={{
                        y: state === 'error' ? [0, -6, 3, -6, 0] : state === 'success' ? [0, -12, -10] : 0,
                        rotate: state === 'error' ? [0, -4, 4, -4, 0] : 0,
                        scale: state === 'loading' ? 1 + Math.sin(breathe / 15) * 0.05 : 1,
                    }}
                    transition={{
                        duration: state === 'error' ? 0.5 : 0.8,
                        ease: state === 'error' ? 'easeInOut' : 'easeOut',
                    }}
                    style={{ originX: '100px', originY: '90px' }}
                    filter={state === 'error' ? 'url(#glitch)' : undefined}
                >
                    {/* Head Main Sphere with 3D effect */}
                    <motion.circle
                        cx="100"
                        cy="90"
                        r="55"
                        fill="url(#sphereGradient)"
                        stroke="#1e293b"
                        strokeWidth="4"
                        filter="url(#glow)"
                        animate={{
                            r: state === 'loading' ? [55, 57, 55] : state === 'processing' ? [55, 56, 55] : 55
                        }}
                        transition={{
                            duration: state === 'loading' ? 2 : 1,
                            repeat: state === 'loading' || state === 'processing' ? Infinity : 0
                        }}
                    />
                    
                    {/* Head detail panels */}
                    <path
                        d="M 70 65 Q 100 60 130 65"
                        fill="none"
                        stroke="#334155"
                        strokeWidth="2"
                        opacity="0.3"
                    />
                    <path
                        d="M 70 110 Q 100 115 130 110"
                        fill="none"
                        stroke="#334155"
                        strokeWidth="2"
                        opacity="0.3"
                    />
                    
                    {/* Breathing circuit lines for loading state */}
                    <AnimatePresence>
                        {state === 'loading' && (
                            <>
                                {[0, 1, 2].map((i) => (
                                    <motion.path
                                        key={`breath-circuit-${i}`}
                                        d={`M 50 ${90 + i * 15} Q 100 ${85 + i * 15} 150 ${90 + i * 15}`}
                                        fill="none"
                                        stroke={getBodyColor()}
                                        strokeWidth="1.5"
                                        opacity="0.6"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: [0.2, 0.6, 0.2] }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            delay: i * 0.3
                                        }}
                                    />
                                ))}
                            </>
                        )}
                    </AnimatePresence>
                    
                    {/* Decorative Rivets */}
                    {[60, 140].map((x, i) => (
                        <g key={`rivet-${i}`}>
                            <circle cx={x} cy="70" r="3" fill="#64748b" />
                            <circle cx={x} cy="70" r="1.5" fill="#94a3b8" />
                            <circle cx={x} cy="110" r="3" fill="#64748b" />
                            <circle cx={x} cy="110" r="1.5" fill="#94a3b8" />
                        </g>
                    ))}

                    {/* Face Display Panel */}
                    <motion.rect
                        x="60"
                        y="70"
                        width="80"
                        height="50"
                        rx="15"
                        fill="url(#glassGradient)"
                        stroke="#cbd5e1"
                        strokeWidth="3"
                        filter={state === 'processing' ? 'url(#lightDisplacement)' : undefined}
                    />
                    
                    {/* Inner screen */}
                    <rect
                        x="65"
                        y="75"
                        width="70"
                        height="40"
                        rx="12"
                        fill="url(#screenGradient)"
                        opacity="0.3"
                    />

                    {/* Side Panels */}
                    <path
                        d="M 50 85 L 45 90 L 50 95 Z"
                        fill="url(#metalGradient)"
                        stroke="#475569"
                        strokeWidth="1"
                    />
                    <path
                        d="M 150 85 L 155 90 L 150 95 Z"
                        fill="url(#metalGradient)"
                        stroke="#475569"
                        strokeWidth="1"
                    />

                    {/* Advanced Eyes with LED effect and mouse tracking */}
                    <motion.g
                        animate={{
                            scaleY: getEyeScale(),
                            y: getEyeY(),
                        }}
                        transition={{ duration: 0.2 }}
                        style={{ originX: '78px', originY: '88px' }}
                    >
                        {/* Left Eye Container */}
                        <circle cx="78" cy="88" r="14" fill="#0f172a" />
                        <circle cx="78" cy="88" r="12" fill={getBodyColor()} opacity="0.3" filter="url(#innerGlow)" />
                        <motion.ellipse
                            cx="78"
                            cy="88"
                            rx="9"
                            ry="13"
                            fill={getBodyColor()}
                            filter="url(#glow)"
                            animate={{
                                x: interactive ? mouseX.get() * 0.3 : 0,
                                y: interactive ? mouseY.get() * 0.3 : 0,
                            }}
                        />
                        {/* Pupil - Follows Mouse */}
                        <motion.ellipse
                            cx="78"
                            cy="88"
                            rx="5"
                            ry="8"
                            fill="#0f172a"
                            animate={{
                                x: interactive ? mouseX.get() * 0.5 : 0,
                                y: interactive ? mouseY.get() * 0.5 : 0,
                            }}
                        />
                        {/* Highlight */}
                        <AnimatePresence>
                            {state === 'success' && (
                                <motion.circle
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    cx="80"
                                    cy="85"
                                    r="4"
                                    fill="white"
                                    opacity="0.9"
                                />
                            )}
                        </AnimatePresence>
                    </motion.g>

                    {/* Right Eye */}
                    <motion.g
                        animate={{
                            scaleY: getEyeScale(),
                            y: getEyeY(),
                        }}
                        transition={{ duration: 0.2 }}
                        style={{ originX: '122px', originY: '88px' }}
                    >
                        {/* Right Eye Container */}
                        <circle cx="122" cy="88" r="14" fill="#0f172a" />
                        <circle cx="122" cy="88" r="12" fill={getBodyColor()} opacity="0.3" filter="url(#innerGlow)" />
                        <motion.ellipse
                            cx="122"
                            cy="88"
                            rx="9"
                            ry="13"
                            fill={getBodyColor()}
                            filter="url(#glow)"
                            animate={{
                                x: interactive ? mouseX.get() * 0.3 : 0,
                                y: interactive ? mouseY.get() * 0.3 : 0,
                            }}
                        />
                        {/* Pupil */}
                        <motion.ellipse
                            cx="122"
                            cy="88"
                            rx="5"
                            ry="8"
                            fill="#0f172a"
                            animate={{
                                x: interactive ? mouseX.get() * 0.5 : 0,
                                y: interactive ? mouseY.get() * 0.5 : 0,
                            }}
                        />
                        {/* Highlight */}
                        <AnimatePresence>
                            {state === 'success' && (
                                <motion.circle
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    cx="124"
                                    cy="85"
                                    r="4"
                                    fill="white"
                                    opacity="0.9"
                                />
                            )}
                        </AnimatePresence>
                    </motion.g>

                    {/* Error X eyes overlay - Enhanced */}
                    <AnimatePresence>
                        {state === 'error' && (
                            <>
                                {/* Left Eye X */}
                                <motion.g
                                    initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                                >
                                    <line x1="70" y1="80" x2="86" y2="96" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" filter="url(#glow)" />
                                    <line x1="86" y1="80" x2="70" y2="96" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" filter="url(#glow)" />
                                </motion.g>
                                {/* Right Eye X */}
                                <motion.g
                                    initial={{ opacity: 0, scale: 0.5, rotate: 90 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ duration: 0.3, type: "spring", stiffness: 300, delay: 0.1 }}
                                >
                                    <line x1="114" y1="80" x2="130" y2="96" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" filter="url(#glow)" />
                                    <line x1="130" y1="80" x2="114" y2="96" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" filter="url(#glow)" />
                                </motion.g>
                            </>
                        )}
                    </AnimatePresence>

                    {/* Advanced Mouth with expressions */}
                    <motion.path
                        d={getMouthPath()}
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                    
                    {/* Mouth inner glow for success */}
                    <AnimatePresence>
                        {state === 'success' && (
                            <motion.path
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.6 }}
                                exit={{ opacity: 0 }}
                                d={getMouthPath()}
                                fill="none"
                                stroke={getBodyColor()}
                                strokeWidth="2"
                                filter="url(#glow)"
                            />
                        )}
                    </AnimatePresence>

                    {/* Enhanced Cheeks for success state */}
                    <AnimatePresence>
                        {state === 'success' && (
                            <>
                                <motion.ellipse
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    cx="62"
                                    cy="100"
                                    rx="8"
                                    ry="6"
                                    fill="#fca5a5"
                                    opacity="0.7"
                                />
                                <motion.ellipse
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    cx="138"
                                    cy="100"
                                    rx="8"
                                    ry="6"
                                    fill="#fca5a5"
                                    opacity="0.7"
                                />
                                <motion.circle
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    cx="100"
                                    cy="72"
                                    r="5"
                                    fill="#fca5a5"
                                    opacity="0.6"
                                />
                            </>
                        )}
                    </AnimatePresence>

                    {/* Warning eyes (caution) */}
                    <AnimatePresence>
                        {state === 'warning' && (
                            <>
                                <motion.path
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0 }}
                                    d="M 78 75 L 70 95 L 86 95 Z"
                                    fill="none"
                                    stroke={getBodyColor()}
                                    strokeWidth="3"
                                    filter="url(#glow)"
                                />
                                <motion.path
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0 }}
                                    d="M 122 75 L 114 95 L 130 95 Z"
                                    fill="none"
                                    stroke={getBodyColor()}
                                    strokeWidth="3"
                                    filter="url(#glow)"
                                />
                            </>
                        )}
                    </AnimatePresence>

                    {/* Processing state glow lines */}
                    <AnimatePresence>
                        {state === 'processing' && (
                            <>
                                {[0, 1, 2].map((i) => (
                                    <motion.line
                                        key={`glow-line-${i}`}
                                        x1="70"
                                        y1={90 + i * 8}
                                        x2="130"
                                        y2={90 + i * 8}
                                        stroke={getBodyColor()}
                                        strokeWidth="1"
                                        opacity="0.4"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: [0, 1, 0] }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            delay: i * 0.3
                                        }}
                                    />
                                ))}
                            </>
                        )}
                    </AnimatePresence>

                    {/* Enhanced Sweat drops for error - Multiple drops */}
                    <AnimatePresence>
                        {state === 'error' && (
                            <>
                                {[0, 1, 2, 3].map((i) => {
                                    const positions = [
                                        { x: 52, y: 60 },
                                        { x: 148, y: 60 },
                                        { x: 58, y: 70 },
                                        { x: 142, y: 70 }
                                    ];
                                    const pos = positions[i];
                                    return (
                                        <motion.g key={`sweat-${i}`}>
                                            <motion.path
                                                initial={{ opacity: 0, y: -10, scale: 0 }}
                                                animate={{ 
                                                    opacity: [0, 1, 1, 0], 
                                                    y: [0, 8, 16, 24],
                                                    scale: [0, 1, 1, 0.5]
                                                }}
                                                transition={{ 
                                                    duration: 1.2, 
                                                    repeat: Infinity, 
                                                    delay: i * 0.2 
                                                }}
                                                d={`M ${pos.x} ${pos.y} Q ${pos.x - 3} ${pos.y + 4} ${pos.x} ${pos.y + 7} Q ${pos.x + 3} ${pos.y + 4} ${pos.x} ${pos.y} Z`}
                                                fill="#60a5fa"
                                                filter="url(#glow)"
                                            />
                                        </motion.g>
                                    );
                                })}
                            </>
                        )}
                    </AnimatePresence>

                    {/* Loading state pulse effect */}
                    <AnimatePresence>
                        {state === 'loading' && (
                            <>
                                {[0, 1].map((i) => (
                                    <motion.circle
                                        key={`load-pulse-${i}`}
                                        cx={75 + i * 50}
                                        cy="88"
                                        r="8"
                                        fill={getBodyColor()}
                                        initial={{ opacity: 0.3, scale: 1 }}
                                        animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.3, 1] }}
                                        transition={{
                                            duration: 1,
                                            repeat: Infinity,
                                            delay: i * 0.3
                                        }}
                                    />
                                ))}
                            </>
                        )}
                    </AnimatePresence>
                </motion.g>

                {/* Advanced Body with Panels and Details */}
                <motion.g
                    animate={{
                        y: state === 'success' ? [0, -8, 0] : 
                           state === 'loading' ? [0, -3, 0] :
                           state === 'processing' ? [0, -2, 0] : 0,
                    }}
                    transition={{
                        duration: state === 'loading' ? 1.5 : state === 'processing' ? 1 : 0.5,
                        repeat: state === 'success' ? 4 : state === 'loading' || state === 'processing' ? Infinity : 0,
                        ease: "easeInOut"
                    }}
                >
                    {/* Neck */}
                    <rect
                        x="88"
                        y="140"
                        width="24"
                        height="15"
                        rx="3"
                        fill="url(#metalGradient)"
                        stroke="#475569"
                        strokeWidth="2"
                    />
                    
                    {/* Main Body */}
                    <motion.rect
                        x="65"
                        y="150"
                        width="70"
                        height="50"
                        rx="8"
                        fill="url(#bodyGradient)"
                        stroke="#1e293b"
                        strokeWidth="3"
                        filter="url(#glow)"
                        animate={{
                            boxShadow: state === 'processing' ? [
                                'inset 0 0 10px rgba(139, 92, 246, 0)',
                                'inset 0 0 20px rgba(139, 92, 246, 0.3)',
                                'inset 0 0 10px rgba(139, 92, 246, 0)'
                            ] : 'none'
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: state === 'processing' ? Infinity : 0
                        }}
                    />
                    
                    {/* Body Panel Lines */}
                    <line x1="75" y1="155" x2="75" y2="195" stroke="#334155" strokeWidth="2" opacity="0.4" />
                    <line x1="100" y1="155" x2="100" y2="195" stroke="#334155" strokeWidth="2" opacity="0.4" />
                    <line x1="125" y1="155" x2="125" y2="195" stroke="#334155" strokeWidth="2" opacity="0.4" />

                    {/* Animated circuit patterns */}
                    <AnimatePresence>
                        {state === 'processing' && (
                            <>
                                {[0, 1, 2].map((i) => (
                                    <motion.path
                                        key={`circuit-${i}`}
                                        d={`M 70 ${160 + i * 12} Q 85 ${155 + i * 12} 100 ${160 + i * 12} Q 115 ${165 + i * 12} 130 ${160 + i * 12}`}
                                        fill="none"
                                        stroke={getBodyColor()}
                                        strokeWidth="1.5"
                                        opacity="0.6"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: [0, 1, 0] }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            delay: i * 0.4
                                        }}
                                    />
                                ))}
                            </>
                        )}
                    </AnimatePresence>
                    
                    {/* Screen Display on Chest */}
                    <rect
                        x="80"
                        y="165"
                        width="40"
                        height="20"
                        rx="4"
                        fill="url(#screenGradient)"
                        stroke="#0ea5e9"
                        strokeWidth="2"
                    />

                    {/* Screen content animation for different states */}
                    <AnimatePresence>
                        {state === 'loading' && (
                            <>
                                {[0, 1, 2].map((i) => (
                                    <motion.rect
                                        key={`load-bar-${i}`}
                                        x={82 + i * 12}
                                        y="170"
                                        width="10"
                                        height="10"
                                        fill={getBodyColor()}
                                        initial={{ scaleY: 0.2 }}
                                        animate={{ scaleY: [0.2, 1, 0.2] }}
                                        transition={{
                                            duration: 0.8,
                                            repeat: Infinity,
                                            delay: i * 0.2
                                        }}
                                    />
                                ))}
                            </>
                        )}
                    </AnimatePresence>
                    
                    {/* Status LED indicators - Enhanced */}
                    <motion.circle
                        cx="85"
                        cy="175"
                        r="3"
                        fill={getBodyColor()}
                        animate={{ 
                            opacity: state === 'processing' ? [1, 0.1, 1] : [1, 0.3, 1],
                            scale: state === 'processing' ? [1, 1.5, 1] : 1
                        }}
                        transition={{ 
                            duration: state === 'processing' ? 0.6 : 1, 
                            repeat: Infinity 
                        }}
                        filter="url(#glow)"
                    />
                    <motion.circle
                        cx="100"
                        cy="175"
                        r="3"
                        fill={getBodyColor()}
                        animate={{ 
                            opacity: state === 'processing' ? [0.3, 1, 0.3] : [1, 0.3, 1],
                            scale: state === 'processing' ? [1, 1.5, 1] : 1
                        }}
                        transition={{ 
                            duration: state === 'processing' ? 0.6 : 1, 
                            repeat: Infinity, 
                            delay: 0.2
                        }}
                        filter="url(#glow)"
                    />
                    <motion.circle
                        cx="115"
                        cy="175"
                        r="3"
                        fill={getBodyColor()}
                        animate={{ 
                            opacity: state === 'processing' ? [0.1, 0.3, 1] : [1, 0.3, 1],
                            scale: state === 'processing' ? [1, 1.5, 1] : 1
                        }}
                        transition={{ 
                            duration: state === 'processing' ? 0.6 : 1, 
                            repeat: Infinity, 
                            delay: 0.4
                        }}
                        filter="url(#glow)"
                    />
                    
                    {/* Decorative Rivets on Body */}
                    {[70, 130].map((x, i) => (
                        <g key={`body-rivet-${i}`}>
                            <circle cx={x} cy="160" r="3" fill="#64748b" />
                            <circle cx={x} cy="160" r="1.5" fill="#94a3b8" />
                            <circle cx={x} cy="190" r="3" fill="#64748b" />
                            <circle cx={x} cy="190" r="1.5" fill="#94a3b8" />
                        </g>
                    ))}

                    {/* Energy beam effect for processing */}
                    <AnimatePresence>
                        {state === 'processing' && (
                            <>
                                {[0, 1].map((i) => (
                                    <motion.line
                                        key={`energy-beam-${i}`}
                                        x1={85 + i * 30}
                                        y1="165"
                                        x2={85 + i * 30}
                                        y2="185"
                                        stroke={getBodyColor()}
                                        strokeWidth="1.5"
                                        opacity={0.6}
                                        initial={{ pathLength: 0 }}
                                        animate={{ opacity: [0.3, 0.8, 0.3] }}
                                        transition={{
                                            duration: 1,
                                            repeat: Infinity,
                                            delay: i * 0.3
                                        }}
                                    />
                                ))}
                            </>
                        )}
                    </AnimatePresence>
                </motion.g>

                {/* Enhanced Sparkles and Particles for success */}
                <AnimatePresence>
                    {state === 'success' && (
                        <>
                            {particles.map((p) => {
                                const angle = (p.angle * Math.PI) / 180;
                                const radius = 75;
                                const x = 100 + Math.cos(angle) * radius;
                                const y = 90 + Math.sin(angle) * radius;
                                const colors = ['#fbbf24', '#f59e0b', '#22c55e', '#10b981', '#06b6d4', '#3b82f6'];
                                return (
                                    <motion.g
                                        key={`success-particle-${p.id}`}
                                        initial={{ scale: 0, opacity: 0, rotate: 0 }}
                                        animate={{ 
                                            scale: [0, 1.2, 0], 
                                            opacity: [0, 1, 0],
                                            rotate: [0, 180, 360]
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            delay: p.delay,
                                            repeat: Infinity,
                                            repeatDelay: 0.5,
                                            ease: "easeOut"
                                        }}
                                    >
                                        {/* Star shape */}
                                        <path
                                            d={`M ${x} ${y - 6} L ${x + 2} ${y} L ${x + 6} ${y} L ${x + 3} ${y + 3} L ${x + 4} ${y + 7} L ${x} ${y + 4} L ${x - 4} ${y + 7} L ${x - 3} ${y + 3} L ${x - 6} ${y} L ${x - 2} ${y} Z`}
                                            fill={colors[p.id % colors.length]}
                                            filter="url(#glow)"
                                        />
                                    </motion.g>
                                );
                            })}
                            
                            {/* Extra rotating rings */}
                            {[0, 1, 2].map((i) => (
                                <motion.circle
                                    key={`ring-${i}`}
                                    cx="100"
                                    cy="90"
                                    r={50 + i * 15}
                                    fill="none"
                                    stroke={getBodyColor()}
                                    strokeWidth="2"
                                    strokeDasharray="5,10"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ 
                                        opacity: [0, 0.6, 0],
                                        scale: [0.8, 1.2, 1.4],
                                        rotate: [0, 360]
                                    }}
                                    transition={{
                                        duration: 2,
                                        delay: i * 0.3,
                                        repeat: Infinity,
                                        ease: "linear"
                                    }}
                                />
                            ))}
                        </>
                    )}
                </AnimatePresence>

                {/* Loading state floating particles */}
                <AnimatePresence>
                    {state === 'loading' && (
                        <>
                            {particles.slice(0, 8).map((p) => {
                                const angle = (p.angle * Math.PI) / 180;
                                const radius = 85;
                                const x = 100 + Math.cos(angle) * radius;
                                const y = 90 + Math.sin(angle) * radius;
                                return (
                                    <motion.circle
                                        key={`load-particle-${p.id}`}
                                        cx={x}
                                        cy={y}
                                        r="3"
                                        fill={getBodyColor()}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{
                                            opacity: [0, 1, 1, 0],
                                            scale: [0, 1, 1, 0],
                                            cx: [x, x - 20, x],
                                            cy: [y, y - 20, y]
                                        }}
                                        transition={{
                                            duration: 2,
                                            delay: p.delay,
                                            repeat: Infinity,
                                            repeatDelay: 1,
                                            ease: "easeInOut"
                                        }}
                                        filter="url(#glow)"
                                    />
                                );
                            })}
                        </>
                    )}
                </AnimatePresence>

                {/* Processing state volumetric particles */}
                <AnimatePresence>
                    {state === 'processing' && (
                        <>
                            {particles.map((p) => {
                                const angle = (p.angle * Math.PI) / 180;
                                const baseRadius = 65;
                                const x = 100 + Math.cos(angle) * baseRadius;
                                const y = 90 + Math.sin(angle) * baseRadius;
                                return (
                                    <motion.g
                                        key={`process-particle-${p.id}`}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{
                                            opacity: [0.3, 1, 0.3],
                                            scale: [0.5, 1, 0.5],
                                        }}
                                        transition={{
                                            duration: p.delay * 2,
                                            repeat: Infinity,
                                            delay: p.delay * 0.5
                                        }}
                                    >
                                        {/* Hexagon particle */}
                                        <path
                                            d={`M ${x} ${y - 4} L ${x + 3.5} ${y - 2} L ${x + 3.5} ${y + 2} L ${x} ${y + 4} L ${x - 3.5} ${y + 2} L ${x - 3.5} ${y - 2} Z`}
                                            fill={getBodyColor()}
                                            opacity="0.6"
                                            filter="url(#glow)"
                                        />
                                    </motion.g>
                                );
                            })}
                        </>
                    )}
                </AnimatePresence>

                {/* Warning state animated alert rings */}
                <AnimatePresence>
                    {state === 'warning' && (
                        <>
                            {[0, 1, 2].map((i) => (
                                <motion.circle
                                    key={`warning-ring-${i}`}
                                    cx="100"
                                    cy="90"
                                    r={45 + i * 12}
                                    fill="none"
                                    stroke={getBodyColor()}
                                    strokeWidth="2"
                                    strokeDasharray="3,3"
                                    initial={{ opacity: 0 }}
                                    animate={{
                                        opacity: [0.8, 0.2, 0.8],
                                        r: [45 + i * 12, 50 + i * 12, 45 + i * 12],
                                        rotate: [0, 360]
                                    }}
                                    transition={{
                                        duration: 1.2,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                        ease: "easeInOut"
                                    }}
                                />
                            ))}
                        </>
                    )}
                </AnimatePresence>

                {/* Quantum state infinity loop */}
                <AnimatePresence>
                    {state === 'quantum' && (
                        <>
                            {[0, 1].map((i) => (
                                <motion.path
                                    key={`infinity-${i}`}
                                    d="M 75 90 Q 85 70 100 70 Q 115 70 125 90 Q 115 110 100 110 Q 85 110 75 90"
                                    fill="none"
                                    stroke="#00d9ff"
                                    strokeWidth="2"
                                    opacity="0.6"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: [0, 1, 0] }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: i * 1,
                                        ease: 'easeInOut'
                                    }}
                                    filter="url(#cosmicGlow)"
                                />
                            ))}
                        </>
                    )}
                </AnimatePresence>

                {/* Hyperdrive mega explosion */}
                <AnimatePresence>
                    {state === 'hyperdrive' && particles && (
                        <>
                            {particles.map((p: any) => {
                                const angle = (p.angle * Math.PI) / 180;
                                const distance = 100 + Math.sin(dataStream / 20 + p.delay) * 30;
                                const x = 100 + Math.cos(angle) * distance;
                                const y = 90 + Math.sin(angle) * distance;
                                const colors = ['#ff00ff', '#00ffff', '#ff00aa', '#00ff88'];
                                return (
                                    <motion.circle
                                        key={`mega-${p.id}`}
                                        cx={x}
                                        cy={y}
                                        r="2"
                                        fill={colors[p.id % colors.length]}
                                        opacity={0.8}
                                        animate={{
                                            r: [2, 4, 2],
                                            opacity: [0.8, 1, 0.8]
                                        }}
                                        transition={{
                                            duration: 0.8,
                                            repeat: Infinity,
                                            delay: p.delay
                                        }}
                                        filter="url(#cosmicGlow)"
                                    />
                                );
                            })}
                        </>
                    )}
                </AnimatePresence>
            </svg>
        </div>
    );
};
