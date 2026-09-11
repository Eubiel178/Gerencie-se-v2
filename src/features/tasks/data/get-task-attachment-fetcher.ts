import "server-only";

import { LocalTaskAttachment } from "./local-task-attachment";

export function getTaskAttachmentFetcher() {
  return new LocalTaskAttachment();
}
