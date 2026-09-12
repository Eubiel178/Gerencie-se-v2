"use client";

import { useState } from "react";
import Image from "next/image";
import { Lottie } from "lottie-react";

import { Icon, IconName } from "@/components/icon";
import { MascotBreed, MascotEvent, MascotSpecies } from "@/features/focus/domain";

import styles from "./mascot-sprite.module.css";

const SPECIES_LABEL: Record<MascotSpecies, string> = {
  gato: "Gato",
  cachorro: "Cachorro",
  coelho: "Coelho",
  galinha: "Galinha",
};

// Ícone de emergência: se nem o Lottie nem o sprite estático (PNG/GIF em
// public/mascot/) existirem - ex.: alguém apagou os arquivos - mostra
// isso em vez de deixar o navegador exibir um ícone de imagem quebrada.
const SPECIES_FALLBACK_ICON: Record<MascotSpecies, IconName> = {
  gato: "FaCat",
  cachorro: "FaDog",
  coelho: "MdCrueltyFree",
  galinha: "FaKiwiBird",
};

// Sprites pequenos/em pixel art (ver public/mascot/CREDITS.txt) —
// precisam de `image-rendering: pixelated` ao serem ampliados, senão o
// navegador borra os pixels. Os de gato/cachorro são desenhos vetoriais
// em alta resolução, escalam bem com suavização normal.
const PIXELATED_SPECIES = new Set<MascotSpecies>(["coelho", "galinha"]);

function pngSrc(species: MascotSpecies, breed: MascotBreed): string {
  const extension = species === "galinha" ? "gif" : "png";
  return `/mascot/${species}-${breed}.${extension}`;
}

// Uma animação Lottie por espécie (não por raça — a raça continua
// distinguindo só o sprite estático usado como fallback). Nem toda
// espécie precisa ter uma ainda: se o arquivo não existir, o `error` do
// player cai pro sprite estático abaixo, sem precisar de uma lista
// travada aqui do que já foi adicionado.
function lottieSrc(species: MascotSpecies): string {
  return `/mascot/lottie/${species}.json`;
}

interface MascotSpriteProps {
  species: MascotSpecies;
  breed: MascotBreed;
  mood: MascotEvent;
  /** Anima o vaivém de um lado pro outro (usado no Focus); desativado na
   * pré-visualização de Configurações, onde um bicho se mexendo sozinho
   * dentro de um formulário só distrai. */
  roaming?: boolean;
  /** "sm" encolhe o mesmo sprite (via transform) pro avatar do widget do
   * assistente — é o mesmo mascote, só menor. */
  size?: "sm" | "lg";
}

interface MascotBodyContentProps {
  species: MascotSpecies;
  breed: MascotBreed;
  size: "sm" | "lg";
}

/** Só a decisão Lottie-ou-fallback, isolada num componente próprio pra
 * poder ser remontada (via `key={species}` em quem a usa) sempre que a
 * espécie muda — assim `lottieFailed` sempre nasce `false` de novo pra
 * cada espécie nova, sem precisar de um `useEffect` só pra resetar
 * estado (o que o React Compiler já rejeita como anti-padrão). */
function MascotBodyContent({ species, breed, size }: MascotBodyContentProps) {
  const [lottieFailed, setLottieFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  if (lottieFailed && imageFailed) {
    return (
      <div className={styles.fallbackIcon} data-size={size}>
        <Icon name={SPECIES_FALLBACK_ICON[species]} aria-label={SPECIES_LABEL[species]} />
      </div>
    );
  }

  if (lottieFailed) {
    return (
      <Image
        src={pngSrc(species, breed)}
        alt={SPECIES_LABEL[species]}
        width={128}
        height={128}
        unoptimized={species === "galinha"}
        className={`${styles.image} ${PIXELATED_SPECIES.has(species) ? styles.pixelated : ""}`}
        priority={size === "lg"}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <Lottie
      src={lottieSrc(species)}
      loop
      autoplay
      className={styles.image}
      subscriptions={{ error: () => setLottieFailed(true) }}
    />
  );
}

/**
 * Corpo do mascote. Tenta uma animação Lottie da espécie primeiro (mais
 * viva — tem movimento de verdade, não só CSS fingindo); se não existir
 * `public/mascot/lottie/<especie>.json` ainda, cai pro sprite estático
 * (PNG/GIF por espécie+raça) animado só via CSS — o mesmo mecanismo de
 * sempre, preservado como fallback enquanto as animações Lottie vão
 * sendo adicionadas aos poucos.
 *
 * Reaproveitado no Focus (`Mascot`), na pré-visualização de
 * Configurações (`MascotSettings`) e no avatar do widget do assistente
 * (`Widget`) — os três mostram o MESMO personagem.
 */
export function MascotSprite({ species, breed, mood, roaming = false, size = "lg" }: MascotSpriteProps) {
  return (
    <div className={styles.stage} data-roaming={roaming} data-size={size}>
      <div className={styles.roamer}>
        <div className={styles.body} data-mood={mood}>
          <MascotBodyContent key={species} species={species} breed={breed} size={size} />

          {mood === "happy" && (
            <>
              <span className={`${styles.sparkle} ${styles.sparkleOne}`}>✦</span>
              <span className={`${styles.sparkle} ${styles.sparkleTwo}`}>✦</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
