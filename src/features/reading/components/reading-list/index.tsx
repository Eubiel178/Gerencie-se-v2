import { IReadingItem } from "@/features/reading/domain";
import { AddForm } from "./add-form";
import { Item } from "./item";

import styles from "../../reading.module.css";

interface ReadingListProps {
  items: IReadingItem[];
}

export function ReadingList({ items }: ReadingListProps) {
  return (
    <div>
      <AddForm />

      {items.length === 0 ? (
        <p className={styles.emptyMessage}>Sua lista de leitura está vazia.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <Item key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}
