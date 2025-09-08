import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extracts the error message from an API error object
 * @param err - The error object from a catch block
 * @param fallbackMessage - Default message if no API message is found
 * @returns The extracted error message
 */
export function extractApiErrorMessage(
  err: unknown,
  fallbackMessage: string = "An error occurred"
): string {
  if (
    err &&
    typeof err === "object" &&
    "response" in err &&
    err.response &&
    typeof err.response === "object" &&
    "data" in err.response &&
    err.response.data &&
    typeof err.response.data === "object" &&
    "message" in err.response.data
  ) {
    return err.response.data.message as string;
  } else if (err instanceof Error) {
    return err.message;
  } else {
    return fallbackMessage;
  }
}
