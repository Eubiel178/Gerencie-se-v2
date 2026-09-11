"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { MascotEvent, MascotSpecies } from "@/features/focus/domain";

const BODY_COLOR = "#38bdf8";
const ACCENT_COLOR = "#0369a1";
const EYE_COLOR = "#2b2b33";
const CHEEK_COLOR = "#ff9db8";

interface MascotBodyProps {
  species: MascotSpecies;
  mood: MascotEvent;
  level: number;
}

/**
 * Corpo procedural do mascote (nenhum asset comprado/importado — tudo
 * geometria primitiva do Three.js). Base low-poly (icosaedro com 0
 * subdivisões + flat shading) igual pros três bichos; espécie só muda
 * enfeites por cima, mesmo princípio do `MascotCreature` em CSS.
 */
export function MascotBody({ species, mood, level }: MascotBodyProps) {
  const groupRef = useRef<THREE.Group>(null);
  // Deslocamento de fase determinístico (não Math.random(), que é impuro
  // durante o render) — só pra dessincronizar o bounce entre instâncias
  // (ex.: preview de Configurações + Focus abertos ao mesmo tempo).
  const bounceSeed = (level * 0.73) % (Math.PI * 2);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    group.rotation.y += mood === "working" ? 0.0015 : 0.006;

    group.position.y =
      mood === "happy"
        ? Math.sin(state.clock.elapsedTime * 6 + bounceSeed) * 0.08
        : Math.sin(state.clock.elapsedTime * 1.2 + bounceSeed) * 0.02;
  });

  // Olhos semicerrados enquanto "trabalha", virados pra baixo (feliz) —
  // mesma linguagem do mascote em CSS, só que via escala em vez de troca
  // de borda/recorte.
  const eyeScaleY = mood === "working" ? 0.35 : mood === "happy" ? 0.5 : 1;

  // A partir do nível 5 o corpo ganha um brilho emissivo crescente — dá
  // uma leitura de progresso sem precisar de acessório/asset novo.
  const emissiveIntensity = level >= 5 ? Math.min(0.15 + level * 0.01, 0.6) : 0;

  return (
    <group ref={groupRef}>
      <mesh castShadow receiveShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={BODY_COLOR}
          flatShading
          roughness={0.45}
          metalness={0.05}
          emissive={BODY_COLOR}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      <mesh position={[-0.35, 0.15, 0.85]} scale={[1, eyeScaleY, 1]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial color={EYE_COLOR} flatShading />
      </mesh>
      <mesh position={[0.35, 0.15, 0.85]} scale={[1, eyeScaleY, 1]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial color={EYE_COLOR} flatShading />
      </mesh>

      <mesh position={[-0.55, -0.05, 0.75]}>
        <circleGeometry args={[0.13, 8]} />
        <meshStandardMaterial color={CHEEK_COLOR} flatShading transparent opacity={0.8} />
      </mesh>
      <mesh position={[0.55, -0.05, 0.75]}>
        <circleGeometry args={[0.13, 8]} />
        <meshStandardMaterial color={CHEEK_COLOR} flatShading transparent opacity={0.8} />
      </mesh>

      {species === "gato" && (
        <>
          <mesh position={[-0.45, 0.85, 0]} rotation={[0, 0, -0.3]} castShadow>
            <coneGeometry args={[0.22, 0.5, 4]} />
            <meshStandardMaterial color={ACCENT_COLOR} flatShading />
          </mesh>
          <mesh position={[0.45, 0.85, 0]} rotation={[0, 0, 0.3]} castShadow>
            <coneGeometry args={[0.22, 0.5, 4]} />
            <meshStandardMaterial color={ACCENT_COLOR} flatShading />
          </mesh>
          <mesh position={[0, -0.2, -0.9]} rotation={[1.1, 0, 0]} castShadow>
            <capsuleGeometry args={[0.07, 0.55, 4, 6]} />
            <meshStandardMaterial color={ACCENT_COLOR} flatShading />
          </mesh>
        </>
      )}

      {species === "cachorro" && (
        <>
          <mesh position={[-0.75, 0.25, 0.1]} rotation={[0, 0, -0.5]} castShadow>
            <capsuleGeometry args={[0.16, 0.4, 4, 6]} />
            <meshStandardMaterial color={BODY_COLOR} flatShading />
          </mesh>
          <mesh position={[0.75, 0.25, 0.1]} rotation={[0, 0, 0.5]} castShadow>
            <capsuleGeometry args={[0.16, 0.4, 4, 6]} />
            <meshStandardMaterial color={BODY_COLOR} flatShading />
          </mesh>
          <mesh position={[0, -0.15, 1]} castShadow>
            <sphereGeometry args={[0.22, 8, 6]} />
            <meshStandardMaterial color={BODY_COLOR} flatShading />
          </mesh>
        </>
      )}

      {mood === "happy" && (
        <>
          <mesh position={[0.9, 0.9, 0.3]}>
            <octahedronGeometry args={[0.09, 0]} />
            <meshStandardMaterial color="#ffd166" flatShading emissive="#ffd166" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[-0.95, 0.6, 0.5]}>
            <octahedronGeometry args={[0.06, 0]} />
            <meshStandardMaterial color="#ffd166" flatShading emissive="#ffd166" emissiveIntensity={0.6} />
          </mesh>
        </>
      )}
    </group>
  );
}
