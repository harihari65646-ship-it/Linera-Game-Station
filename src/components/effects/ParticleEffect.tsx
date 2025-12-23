/**
 * Particle Effects Component
 * 
 * Canvas-based particle system for celebrations, wins, and achievements.
 * Creates beautiful, performant visual effects.
 */

import React, { useEffect, useRef, useCallback } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
    shape: 'circle' | 'square' | 'star' | 'confetti';
}

interface ParticleEffectProps {
    type: 'confetti' | 'explosion' | 'sparkle' | 'firework';
    trigger: boolean;
    duration?: number;
    particleCount?: number;
    colors?: string[];
    className?: string;
}

const DEFAULT_COLORS = [
    '#00d4ff', // Cyan
    '#a855f7', // Purple
    '#22c55e', // Green
    '#f43f5e', // Pink
    '#f59e0b', // Orange
    '#3b82f6', // Blue
];

export function ParticleEffect({
    type,
    trigger,
    duration = 2000,
    particleCount = 50,
    colors = DEFAULT_COLORS,
    className = '',
}: ParticleEffectProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationRef = useRef<number>(0);
    const isActiveRef = useRef(false);

    const createParticle = useCallback((centerX: number, centerY: number): Particle => {
        const angle = Math.random() * Math.PI * 2;
        const speed = type === 'explosion'
            ? 2 + Math.random() * 8
            : type === 'firework'
                ? 1 + Math.random() * 5
                : 0.5 + Math.random() * 3;

        const shapes: Particle['shape'][] = ['circle', 'square', 'star', 'confetti'];

        return {
            x: centerX,
            y: type === 'confetti' ? -10 : centerY,
            vx: Math.cos(angle) * speed * (type === 'confetti' ? 0.3 : 1),
            vy: type === 'confetti'
                ? 2 + Math.random() * 3
                : Math.sin(angle) * speed,
            life: 1,
            maxLife: duration / 1000,
            size: 4 + Math.random() * 8,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
            shape: type === 'sparkle' ? 'star' : shapes[Math.floor(Math.random() * shapes.length)],
        };
    }, [type, duration, colors]);

    const drawParticle = useCallback((ctx: CanvasRenderingContext2D, particle: Particle) => {
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = particle.color;

        const size = particle.size * (0.5 + particle.life * 0.5);

        switch (particle.shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'square':
                ctx.fillRect(-size, -size, size * 2, size * 2);
                break;

            case 'star':
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                    const x = Math.cos(angle) * size;
                    const y = Math.sin(angle) * size;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                break;

            case 'confetti':
                ctx.fillRect(-size * 0.5, -size, size, size * 2);
                break;
        }

        ctx.restore();
    }, []);

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const gravity = type === 'confetti' ? 0.05 : 0.15;
        const friction = type === 'sparkle' ? 0.98 : 0.99;

        particlesRef.current = particlesRef.current.filter(particle => {
            particle.vy += gravity;
            particle.vx *= friction;
            particle.vy *= friction;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.rotation += particle.rotationSpeed;
            particle.life -= 1 / (60 * particle.maxLife);

            if (particle.life > 0) {
                drawParticle(ctx, particle);
                return true;
            }
            return false;
        });

        if (particlesRef.current.length > 0) {
            animationRef.current = requestAnimationFrame(animate);
        } else {
            isActiveRef.current = false;
        }
    }, [type, drawParticle]);

    const startEffect = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const centerX = canvas.width / 2;
        const centerY = type === 'confetti' ? 0 : canvas.height / 2;

        for (let i = 0; i < particleCount; i++) {
            const x = type === 'confetti' ? Math.random() * canvas.width : centerX;
            const y = type === 'confetti' ? -10 - Math.random() * 100 : centerY;
            particlesRef.current.push(createParticle(x, y));
        }

        if (!isActiveRef.current) {
            isActiveRef.current = true;
            animate();
        }
    }, [type, particleCount, createParticle, animate]);

    useEffect(() => {
        if (trigger) {
            startEffect();
        }
    }, [trigger, startEffect]);

    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={`pointer-events-none absolute inset-0 ${className}`}
            style={{ width: '100%', height: '100%' }}
        />
    );
}

// Convenience hook for triggering particles
export function useParticleEffect() {
    const [trigger, setTrigger] = React.useState(false);

    const fire = useCallback(() => {
        setTrigger(false);
        // Small delay to reset state
        setTimeout(() => setTrigger(true), 10);
    }, []);

    return { trigger, fire };
}

export default ParticleEffect;
