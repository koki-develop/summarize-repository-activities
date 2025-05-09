import { setTimeout } from "node:timers";
import { format } from "date-fns";

export function removeChecklist(text: string): string {
  const checklistRegex = /^[\s]*- \[[x ]\].+(\r?\n|$)/gm;
  return text.replace(checklistRegex, "");
}

export function removeCodeblock(markdown: string): string {
  return markdown.replace(/^```[\s\S]*?```(\r?\n|$)/gm, "");
}

export function removeComment(markdown: string): string {
  return markdown.replace(/^<!--[\s\S]*?-->(\r?\n|$)/gm, "");
}

export function yyyymmdd(date: Date): string {
  return format(date, "yyyy/MM/dd");
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function exponentialBackoff<T>(
  {
    maxRetries,
    initialDelay,
  }: {
    maxRetries: number;
    initialDelay: number;
  },
  fn: () => Promise<T>,
): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (retries >= maxRetries) throw error;
      await sleep(initialDelay * 2 ** retries);
      retries++;
    }
  }
}
