import { useEffect, useRef } from 'react';

/**
 * Premium animated background — Apple/Google style.
 * Features: slow-drifting gradient orbs, mesh grid, smooth noise-like motion.
 * Only used on the Landing page.
 */
export default function HeroBackground({ theme = 'dark' }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let t = 0;

        const isDark = theme === 'dark';

        // Orb definitions — Apple uses large, soft color blobs
        const orbs = isDark
            ? [
                { x: 0.25, y: 0.3,  r: 0.45, color: [59,  130, 246], speed: 0.00018, ox: 0.08, oy: 0.06 }, // blue
                { x: 0.75, y: 0.65, r: 0.40, color: [99,  102, 241], speed: 0.00024, ox: 0.07, oy: 0.09 }, // indigo
                { x: 0.55, y: 0.15, r: 0.35, color: [14,  165, 233], speed: 0.00020, ox: 0.10, oy: 0.05 }, // cyan
                { x: 0.10, y: 0.75, r: 0.30, color: [139, 92,  246], speed: 0.00015, ox: 0.06, oy: 0.08 }, // violet
                { x: 0.85, y: 0.25, r: 0.32, color: [6,   182, 212], speed: 0.00022, ox: 0.09, oy: 0.07 }, // teal
            ]
            : [
                { x: 0.25, y: 0.3,  r: 0.45, color: [99,  162, 255], speed: 0.00018, ox: 0.08, oy: 0.06 },
                { x: 0.75, y: 0.65, r: 0.40, color: [147, 112, 255], speed: 0.00024, ox: 0.07, oy: 0.09 },
                { x: 0.55, y: 0.15, r: 0.35, color: [56,  189, 248], speed: 0.00020, ox: 0.10, oy: 0.05 },
                { x: 0.10, y: 0.75, r: 0.30, color: [167, 139, 250], speed: 0.00015, ox: 0.06, oy: 0.08 },
                { x: 0.85, y: 0.25, r: 0.32, color: [34,  211, 238], speed: 0.00022, ox: 0.09, oy: 0.07 },
            ];

        function resize() {
            const scale = 0.75; // Lower resolution for background blur effects (huge perf gain)
            canvas.width = window.innerWidth * scale;
            canvas.height = window.innerHeight * scale;
        }

        function lerp(a, b, t) { return a + (b - a) * t; }

        function draw() {
            t++;
            const W = canvas.width;
            const H = canvas.height;

            ctx.clearRect(0, 0, W, H);

            // ── Solid background fill ──────────────────────────────────────
            ctx.fillStyle = isDark ? '#07111f' : '#f0f4ff';
            ctx.fillRect(0, 0, W, H);

            // ── Animated orbs (radial gradients) ──────────────────────────
            // Use globalCompositeOperation for blending like Apple does
            ctx.globalCompositeOperation = 'source-over';

            orbs.forEach(orb => {
                // Smooth Lissajous-like drift
                const drift_x = Math.sin(t * orb.speed * 1.7 + orb.x * 10) * orb.ox;
                const drift_y = Math.cos(t * orb.speed * 1.3 + orb.y * 10) * orb.oy;

                const cx = (orb.x + drift_x) * W;
                const cy = (orb.y + drift_y) * H;
                const radius = orb.r * Math.min(W, H);

                // Gentle pulsing scale
                const pulse = 1 + 0.06 * Math.sin(t * orb.speed * 4);

                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * pulse);
                const [r, g, b] = orb.color;
                grad.addColorStop(0,   `rgba(${r},${g},${b},${isDark ? 0.28 : 0.20})`);
                grad.addColorStop(0.5, `rgba(${r},${g},${b},${isDark ? 0.12 : 0.08})`);
                grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);

                ctx.beginPath();
                ctx.arc(cx, cy, radius * pulse, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.fill();
            });

            // ── Subtle dot-grid overlay ───────────────────────────────────
            ctx.globalCompositeOperation = 'source-over';
            const gridSize = 64; // Increased from 36 for better performance
            const dotR = 0.8;
            const dotAlpha = isDark ? 0.07 : 0.10;
            ctx.fillStyle = isDark
                ? `rgba(99,162,255,${dotAlpha})`
                : `rgba(59,130,246,${dotAlpha})`;

            for (let x = gridSize; x < W; x += gridSize) {
                for (let y = gridSize; y < H; y += gridSize) {
                    // Subtle wave in grid for depth
                    const wave = Math.sin((x + t * 0.06) * 0.04) * Math.cos((y + t * 0.04) * 0.04);
                    const alpha = dotAlpha * (0.4 + 0.6 * ((wave + 1) / 2));
                    ctx.globalAlpha = alpha;
                    ctx.beginPath();
                    ctx.arc(x, y, dotR, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.globalAlpha = 1;

            // ── Top shimmer line (Apple nav gradient) ─────────────────────
            const shimmer = ctx.createLinearGradient(0, 0, W, 0);
            shimmer.addColorStop(0,    'transparent');
            shimmer.addColorStop(0.25, isDark ? 'rgba(59,130,246,0.15)' : 'rgba(99,130,246,0.10)');
            shimmer.addColorStop(0.5,  isDark ? 'rgba(99,102,241,0.20)' : 'rgba(147,112,255,0.12)');
            shimmer.addColorStop(0.75, isDark ? 'rgba(59,130,246,0.15)' : 'rgba(99,130,246,0.10)');
            shimmer.addColorStop(1,    'transparent');
            ctx.fillStyle = shimmer;
            ctx.fillRect(0, 0, W, 2);

            animRef.current = requestAnimationFrame(draw);
        }

        resize();
        draw();

        const onResize = () => resize();
        window.addEventListener('resize', onResize);

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', onResize);
        };
    }, [theme]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0, left: 0,
                width: '100%', height: '100%',
                zIndex: 0,
                display: 'block',
            }}
        />
    );
}
