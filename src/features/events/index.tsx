import styles from "@/styles/workspace.module.css";

import { Calendar, EventList, EventListHeader } from "./components";
import { getEventFetcher } from "./data/get-event-fetcher";

export async function Event() {
  const fetcher = getEventFetcher();

  const eventsList = await fetcher.loadAll();

  return (
    <section className={styles.page}>
      <div><h1 className={styles.title}>Calendário</h1><p className={styles.subtitle}>Organize compromissos e proteja o seu tempo.</p></div>
      <div className={`${styles.panel} ${styles.calendar}`}><Calendar eventsList={eventsList} /></div>
      <div className={styles.panel}>
        <EventListHeader />
        <EventList eventsList={eventsList} />
      </div>
    </section>
  );
}
