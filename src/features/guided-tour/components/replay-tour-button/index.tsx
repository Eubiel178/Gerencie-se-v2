"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { Button, Modal, ModalHeader } from "@/components";
import { resetGuidedTourAction } from "../../actions";
import { GUIDED_TOUR_MOBILE_BREAKPOINT_PX } from "../../domain/steps";

import styles from "./styles.module.css";

const MOBILE_QUERY = `(max-width: ${GUIDED_TOUR_MOBILE_BREAKPOINT_PX}px)`;

function subscribeToMobileQuery(callback: () => void) {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getIsMobileSnapshot(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getIsMobileServerSnapshot(): boolean {
  return false;
}

/** Rearma o tour guiado (ver `GuidedTour`) e leva pro Dashboard, onde ele
 * de fato toca — chamado de Configurações, pra quem quiser rever depois
 * de já ter pulado ou concluído da primeira vez. Pede confirmação antes
 * (é uma navegação que tira a pessoa de Configurações no meio de algo
 * que ela podia estar fazendo). */
export function ReplayTourButton() {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // O motor do tour (`GuidedTour`) se recusa a mostrar qualquer passo
  // abaixo de `GUIDED_TOUR_MOBILE_BREAKPOINT_PX` (a navegação vira um
  // menu escondido atrás de um clique, sem os alvos que o tour aponta) -
  // sem esta checagem, o botão ficava visível no mobile prometendo algo
  // que nunca acontecia: clicar marcava no banco e navegava pro
  // Dashboard, mas nenhum passo aparecia na tela (achado relatado).
  const isMobile = useSyncExternalStore(
    subscribeToMobileQuery,
    getIsMobileSnapshot,
    getIsMobileServerSnapshot,
  );

  async function handleConfirm() {
    if (isLoading) return;

    setIsLoading(true);
    await resetGuidedTourAction();
    router.push("/home");
  }

  if (isMobile) return null;

  return (
    <>
      <Button.Root variant="secondary" type="button" onClick={() => setIsConfirming(true)}>
        Ver tutorial novamente
      </Button.Root>

      {isConfirming && (
        <Modal onClose={() => setIsConfirming(false)}>
          <ModalHeader title="Rever o tutorial?" onClose={() => setIsConfirming(false)} />

          <p className={styles.text}>
            Você vai passar novamente pelas principais funcionalidades do Gerencie-se, começando pela Visão geral.
          </p>

          <div className={styles.actions}>
            <Button.Root type="button" variant="secondary" onClick={() => setIsConfirming(false)}>
              Cancelar
            </Button.Root>
            <Button.Root type="button" loading={isLoading} onClick={handleConfirm}>
              Rever tutorial
            </Button.Root>
          </div>
        </Modal>
      )}
    </>
  );
}
