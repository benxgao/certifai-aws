export const logger = {
  info: (message: string, meta?: unknown): void => {
    console.log(
      JSON.stringify({
        level: "info",
        message,
        timestamp: new Date().toISOString(),
        meta,
      })
    );
  },

  error: (message: string, error?: Error | unknown, meta?: unknown): void => {
    console.error(
      JSON.stringify({
        level: "error",
        message,
        timestamp: new Date().toISOString(),
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
        meta,
      })
    );
  },

  warn: (message: string, meta?: unknown): void => {
    console.warn(
      JSON.stringify({
        level: "warn",
        message,
        timestamp: new Date().toISOString(),
        meta,
      })
    );
  },

  debug: (message: string, meta?: unknown): void => {
    if (process.env.NODE_ENV === "dev") {
      console.debug(
        JSON.stringify({
          level: "debug",
          message,
          timestamp: new Date().toISOString(),
          meta,
        })
      );
    }
  },
};
