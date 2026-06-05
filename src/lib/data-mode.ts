export type DataMode = "local" | "api-shadow" | "api";

export const DATA_MODE: DataMode = parseDataMode(process.env.NEXT_PUBLIC_DATA_MODE);

export function shouldCallApiInParallel() {
  return DATA_MODE === "api-shadow" || DATA_MODE === "api";
}

export function runApiShadowCall(action: () => Promise<unknown>) {
  if (!shouldCallApiInParallel()) {
    return;
  }

  void action().catch((error) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn("API shadow call failed", error);
    }
  });
}

function parseDataMode(value: string | undefined): DataMode {
  if (value === "api-shadow" || value === "api") {
    return value;
  }

  return "local";
}
