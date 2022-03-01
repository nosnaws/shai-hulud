export const prop = <T, K extends keyof T>(key: K) => (obj: T) => obj[key];

export const log = (thing: any, shouldLog = true) => {
  if (process.env.LOG_LEVEL === "info" && shouldLog) {
    if (typeof thing === "object") {
      console.log(JSON.stringify(thing, null, 2));
    } else {
      console.log(thing);
    }
  }
};
