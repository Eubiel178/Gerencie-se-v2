// Reexports pra permitir `import { X } from "@/features/connections"` em
// vez de caminhos profundos.
export * from "./domain";
export * from "./actions";
export { getConnectionFetcher } from "./data/get-connection-fetcher";
export { PeoplePanel } from "./components/people-panel";
export { SharedBadge } from "./components/shared-badge";
export { ShareReadOnlyNote } from "./components/share-readonly-note";
export { ShareSelect } from "./components/share-select";
