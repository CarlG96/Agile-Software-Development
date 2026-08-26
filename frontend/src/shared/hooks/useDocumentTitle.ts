import { useEffect } from "react";

// Ensures every page has a descriptive title, per WCAG 2.4.2.
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
