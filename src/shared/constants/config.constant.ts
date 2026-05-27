
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

export const HTTP_STATUS = {
   OK: 200,
   CREATED: 201,
   BAD_REQUEST: 400,
   UNAUTHORIZED: 401,
   FORBIDDEN: 403,
   NOT_FOUND: 404,
   CONFLICT: 409,
   INTERNAL_SERVER_ERROR: 500,
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
