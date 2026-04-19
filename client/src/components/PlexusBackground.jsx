import { useEffect, useRef } from 'react';

export default function PlexusBackground({ theme = 'dark' }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const particlesRef = useRef([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const isDark = theme === 'dark';

        // Colors
        const dotColor = isDark ? 'rgba(59,130,246,0.75)' : 'rgba(59,130,246,0.35)';
        const lineColor = isDark ? 'rgba(59,130,246,' : 'rgba(100,160,255,';
        const bgColor = isDark ? '#080e1a' : '#e8f0fb';

        const PARTICLE_COUNT = 80;
        const MAX_DIST = 160;
        const SPEED = 0.4;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        function createParticle() {
            return {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * SPEED,
                vy: (Math.random() - 0.5) * SPEED,
                r: Math.random() * 2 + 1.5,
                opacity: Math.random() * 0.5 + 0.5,
            };
        }

        function initParticles() {
            particlesRef.current = Array.from({ length: PARTICLE_COUNT }, createParticle);
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Background
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const pts = particlesRef.current;

            // Update positions
            pts.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            });

            // Draw lines
            for (let i = 0; i < pts.length; i++) {
                for (let j = i + 1; j < pts.length; j++) {
                    const dx = pts[i].x - pts[j].x;
                    const dy = pts[i].y - pts[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < MAX_DIST) {
                        const alpha = (1 - dist / MAX_DIST) * (isDark ? 0.55 : 0.25);
                        ctx.beginPath();
                        ctx.strokeStyle = lineColor + alpha + ')';
                        ctx.lineWidth = isDark ? 0.8 : 0.6;
                        ctx.moveTo(pts[i].x, pts[i].y);
                        ctx.lineTo(pts[j].x, pts[j].y);
                        ctx.stroke();
                    }
                }
            }

            // Draw dots
            pts.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = dotColor;
                ctx.fill();
            });

            animRef.current = requestAnimationFrame(draw);
        }

        resize();
        initParticles();
        draw();

        window.addEventListener('resize', () => {
            resize();
            initParticles();
        });

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [theme]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                display: 'block',
            }}
        />
    );
}
