import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ParticleConfig, ShapeType, GestureState } from '../types';
import { generateGeometry } from '../utils/shapes';

interface ParticleSceneProps {
  config: ParticleConfig;
  gestureState: GestureState;
}

const ParticleScene: React.FC<ParticleSceneProps> = ({ config, gestureState }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const materialRef = useRef<THREE.PointsMaterial | null>(null);
  const targetsRef = useRef<Float32Array | null>(null);
  const expansionRef = useRef<number>(1.0); // Default to expanded (Open state)
  
  // Rotation State Refs
  const rotationRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });
  
  // 关键修复：使用 Ref 来追踪最新的手势状态，以便在动画循环中访问
  const gestureStateRef = useRef<GestureState>(gestureState);

  // 当 props 更新时，同步更新 ref
  useEffect(() => {
    gestureStateRef.current = gestureState;
  }, [gestureState]);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- Init Scene ---
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.05);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // --- Init Particles ---
    const initialPositions = generateGeometry(config.shape);
    targetsRef.current = initialPositions;

    const currentPositions = new Float32Array(initialPositions.length);
    for (let i = 0; i < currentPositions.length; i++) {
        currentPositions[i] = (Math.random() - 0.5) * 10.0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
    geometryRef.current = geometry;

    // Create a circular texture for particles programmatically
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    if (context) {
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.4, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        context.fillStyle = gradient;
        context.fillRect(0,0,32,32);
    }
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.12,
      map: texture,
      transparent: true,
      opacity: 0.8,
      vertexColors: false,
      color: new THREE.Color(config.color),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    materialRef.current = material;

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // --- Interaction Event Handlers (Rotation) ---
    const handleStart = (clientX: number, clientY: number) => {
      isDraggingRef.current = true;
      previousMouseRef.current = { x: clientX, y: clientY };
    };
    
    const handleMove = (clientX: number, clientY: number) => {
      if (!isDraggingRef.current) return;
      const deltaX = clientX - previousMouseRef.current.x;
      const deltaY = clientY - previousMouseRef.current.y;
      
      // Update rotation (sensitivity 0.005)
      rotationRef.current.y += deltaX * 0.005;
      rotationRef.current.x += deltaY * 0.005;
      
      previousMouseRef.current = { x: clientX, y: clientY };
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
    };

    const onMouseDown = (e: MouseEvent) => handleStart(e.clientX, e.clientY);
    const onTouchStart = (e: TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY);
    
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
    
    const onMouseUp = () => handleEnd();
    const onTouchEnd = () => handleEnd();

    // Attach listeners
    // We attach start events to the container, and move/end events to window for drag continuity
    const el = mountRef.current;
    if (el) {
       el.addEventListener('mousedown', onMouseDown);
       el.addEventListener('touchstart', onTouchStart, { passive: false });
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchend', onTouchEnd);

    // --- Animation Loop ---
    const clock = new THREE.Clock();
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Rotation Logic
      if (!isDraggingRef.current) {
         // Auto rotate slowly when not dragging
         rotationRef.current.y += 0.1 * delta;
      }
      
      // Apply accumulated rotation
      points.rotation.x = rotationRef.current.x;
      points.rotation.y = rotationRef.current.y;

      const positions = geometry.attributes.position.array as Float32Array;
      const targets = targetsRef.current;

      const currentGestureState = gestureStateRef.current;
      const targetState = currentGestureState === 'OPEN' ? 1.0 : 0.0;
      
      expansionRef.current = THREE.MathUtils.lerp(expansionRef.current, targetState, delta * 4);
      const explosionFactor = expansionRef.current;

      if (targets && positions.length === targets.length) {
        const moveSpeed = 4.0 * delta;

        for (let i = 0; i < positions.length; i += 3) {
          const tx = targets[i];
          const ty = targets[i + 1];
          const tz = targets[i + 2];

          const d = Math.sqrt(tx*tx + ty*ty + tz*tz) || 0.001;
          const nx = tx / d;
          const ny = ty / d;
          const nz = tz / d;

          const r1 = Math.sin(i * 0.1 + time * 0.2); 
          const r2 = Math.cos(i * 0.1 + time * 0.1); 

          const spreadScale = 4.0;
          const noiseScale = 0.5;

          const targetX = tx + (nx * explosionFactor * spreadScale) + (r1 * explosionFactor * noiseScale);
          const targetY = ty + (ny * explosionFactor * spreadScale) + (r2 * explosionFactor * noiseScale);
          const targetZ = tz + (nz * explosionFactor * spreadScale) + (r1 * r2 * explosionFactor * noiseScale);

          positions[i] += (targetX - positions[i]) * moveSpeed;
          positions[i + 1] += (targetY - positions[i + 1]) * moveSpeed;
          positions[i + 2] += (targetZ - positions[i + 2]) * moveSpeed;
        }
      }

      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchend', onTouchEnd);
      if (el) {
        el.removeEventListener('mousedown', onMouseDown);
        el.removeEventListener('touchstart', onTouchStart);
      }
      cancelAnimationFrame(animationId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [config.shape]); 

  // Update Shape Targets
  useEffect(() => {
    targetsRef.current = generateGeometry(config.shape);
  }, [config.shape]);

  // Update Color
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.color.set(config.color);
    }
  }, [config.color]);

  return <div ref={mountRef} className="w-full h-full absolute inset-0 z-0 touch-none" />;
};

export default ParticleScene;