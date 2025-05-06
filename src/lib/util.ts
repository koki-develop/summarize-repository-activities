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
