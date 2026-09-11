// Metadados de um anexo, sem o conteúdo binário — usado pra listar
// anexos de uma tarefa sem precisar carregar potencialmente megabytes de
// dado que ninguém vai renderizar.
export interface ITaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
}

export interface ITaskAttachmentContent extends ITaskAttachment {
  content: Buffer;
}

export type ListTaskAttachments = {
  listAttachments: (taskId: string) => Promise<ITaskAttachment[]>;
};

export interface AddTaskAttachmentParams {
  taskId: string;
  fileName: string;
  mimeType: string;
  content: Buffer;
}

export type AddTaskAttachment = {
  addAttachment: (params: AddTaskAttachmentParams) => Promise<ITaskAttachment>;
};

export type DeleteTaskAttachment = {
  deleteAttachment: (id: string) => Promise<void>;
};

export type GetTaskAttachmentContent = {
  getAttachmentContent: (id: string) => Promise<ITaskAttachmentContent | null>;
};
