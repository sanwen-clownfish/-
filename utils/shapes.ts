import { ShapeType } from '../types';
import * as THREE from 'three';

const PARTICLE_COUNT = 15000;
const SCALE = 2.5;

// Helper to get a random point inside a sphere
const randomInSphere = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.sin(phi) * Math.sin(theta),
    z: r * Math.cos(phi)
  };
};

export const generateGeometry = (type: ShapeType): Float32Array => {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  let i = 0;

  const setPoint = (x: number, y: number, z: number) => {
    positions[i] = x * SCALE;
    positions[i + 1] = y * SCALE;
    positions[i + 2] = z * SCALE;
    i += 3;
  };

  if (type === ShapeType.HEART) {
    // Heart Shape Parametric Equation
    for (let j = 0; j < PARTICLE_COUNT; j++) {
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;
      
      // A variant of heart shape math
      const x = 16 * Math.pow(Math.sin(theta), 3) * Math.sin(phi);
      const y = (13 * Math.cos(theta) - 5 * Math.cos(2 * theta) - 2 * Math.cos(3 * theta) - Math.cos(4 * theta));
      const z = 16 * Math.pow(Math.sin(theta), 3) * Math.cos(phi);
      
      // Normalize and add some noise
      const spread = 0.05;
      setPoint(
        (x / 16) + (Math.random() - 0.5) * spread, 
        (y / 16) + (Math.random() - 0.5) * spread, 
        (z / 16) * 0.5 + (Math.random() - 0.5) * spread
      );
    }
  } 
  else if (type === ShapeType.FLOWER) {
    // Rose/Flower shape
    for (let j = 0; j < PARTICLE_COUNT; j++) {
      const theta = Math.random() * Math.PI * 2;
      const u = Math.random(); // radius distribution
      const k = 5; // petals
      
      const r = 1.5 * Math.cos(k * theta) + 1.0; 
      const radius = r * Math.sqrt(u); // Distribute area
      
      const x = radius * Math.cos(theta);
      const y = radius * Math.sin(theta);
      const z = (Math.cos(r * 3) * 0.5) * (1 - u); // Depth based on radius

      setPoint(x, z, y); // Rotate to face camera
    }
  } 
  else if (type === ShapeType.BUDDHA) {
    // Abstract Meditating Figure (Stacked shapes approximation)
    for (let j = 0; j < PARTICLE_COUNT; j++) {
      const r = Math.random();
      let x, y, z;

      if (r < 0.35) {
        // Base/Legs (Flattened ellipsoid)
        const p = randomInSphere(1.2);
        x = p.x * 1.5;
        y = p.y * 0.4 - 1.0;
        z = p.z * 1.2;
      } else if (r < 0.75) {
        // Body (Cylinderish)
        const theta = Math.random() * Math.PI * 2;
        const h = Math.random() * 1.4 - 0.7; // Height
        const rad = 0.6 * (1 - Math.abs(h)*0.3); // Taper
        x = rad * Math.cos(theta) + (Math.random()-0.5)*0.1;
        z = rad * Math.sin(theta) + (Math.random()-0.5)*0.1;
        y = h;
      } else {
        // Head
        const p = randomInSphere(0.45);
        x = p.x;
        y = p.y + 0.9;
        z = p.z;
      }
      setPoint(x, y, z);
    }
  } 
  else if (type === ShapeType.FIREWORKS) {
    // Exploded Sphere
    for (let j = 0; j < PARTICLE_COUNT; j++) {
      const p = randomInSphere(2.0);
      setPoint(p.x, p.y, p.z);
    }
  }

  return positions;
};
