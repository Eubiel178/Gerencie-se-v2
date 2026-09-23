"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button, Modal, ModalHeader } from "@/components";

import { resetGuidedTourAction } from "../../actions";

import styles from "./styles.module.css";

/** Rearma o tour guiado (ver `GuidedTour`) e leva pro Dashboard, onde ele
 * de fato toca — chamado de Configurações, pra quem quiser rever depois
 * de já ter pulado ou concluído da primeira vez. Pede confirmação antes
 * (é uma navegação que tira a pessoa de Configurações no meio de algo
 * que ela podia estar fazendo).
 *
 * Existe também no mobile de propósito: o motor do tour (`GuidedTour`)
 * SABE rodar abaixo de `GUIDED_TOUR_MOBILE_BREAKPOINT_PX` — ele abre o
 * painel de navegação mobile sozinho pra apontar pros alvos que só
 * existem dentro dele (`data-tour="nav"`/`data-tour="search"`, ver
 * `MOBILE_NAV_PANEL_TARGETS` no motor) e navega entre as telas. Já teve
 * uma época em que o motor não rodava no mobile e este botão ficava
 * oculto aqui embaixo prometendo algo que nunca aparecia — hoje o
 * bloqueio foi removido do motor, então o botão volta a ser o caminho
 * de reativar o tour também pra quem usa o app por celular. */
export function ReplayTourButton() {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleConfirm() {
    if (isLoading) return;

    setIsLoading(true);
    await resetGuidedTourAction();
    router.push("/home");
  }

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
