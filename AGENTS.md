nao fazer teste sem antes me consultar independe

Agentes

Nunca execute mais de um agente ou subagente ao mesmo tempo.

Se for necessário utilizar múltiplos agentes para uma tarefa, execute-os sequencialmente: aguarde o agente atual finalizar completamente antes de iniciar o próximo.

Não paralelize agentes, subagentes ou tarefas delegadas.

Imports

Quando múltiplos componentes forem exportados pelo mesmo barrel (@/components), utilize um único import.

Evite:

import { Button, Modal, ModalHeader } from "@/components";
import { Icon } from "@/components/icon";

Prefira:

import { Icon, Button, Modal, ModalHeader } from "@/components";

Antes de utilizar o barrel, confirme que o componente está realmente exportado por @/components. Não altere exports ou crie novos barrels apenas para satisfazer esta regra sem necessidade.

Ao modificar um arquivo existente, se encontrar imports separados que podem ser importados corretamente pelo mesmo barrel já existente, consolide-os.
