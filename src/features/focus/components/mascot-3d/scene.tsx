"use client";

import { Canvas } from "@react-three/fiber";

import { MascotEvent, MascotSpecies } from "@/features/focus/domain";

import { MascotBody } from "./body";

interface MascotSceneProps {
  species: MascotSpecies;
  mood: MascotEvent;
  level: number;
}

/** Canvas + luzes + câmera — só o necessário pra um personagem pequeno
 * em primeiro plano (sem pós-processamento, sem ambiente/HDRI externo,
 * `dpr` limitado a 2 pra não pesar em telas retina/mobile). */
export function MascotScene({ species, mood, level }: MascotSceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.4, 3.4], fov: 35 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[2, 3, 2]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />
      <directionalLight position={[-2, 1, -1]} intensity={0.3} />

      <MascotBody species={species} mood={mood} level={level} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]} receiveShadow>
        <planeGeometry args={[6, 6]} />
        <shadowMaterial opacity={0.18} />
      </mesh>
    </Canvas>
  );
}
