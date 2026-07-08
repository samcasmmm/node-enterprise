
export const APP = {
   NAME: "Vocial Backend",
   VERSION: "1.0.0",
   DEFAULT_TIMEZONE: "UTC",
};

export const API = {
   PREFIX: "/api",
   VERSION: "v1",
   DEFAULT_PAGE: 1,
   DEFAULT_LIMIT: 20,
   MAX_LIMIT: 100,
};


export const AUTH = {
   TOKEN_PREFIX: "Bearer",
   HEADER_KEY: "authorization",
};

export const CACHE_KEYS = {
   USER: (id: number | string) => `user:${id}`,
   USER_LIST: "users:list",
};

export const REGEX = {
   EMAIL: /^[^\s@]+@[^\s@]+.[^\s@]+$/,
   USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
};
