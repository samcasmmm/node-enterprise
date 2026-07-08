import env from './env.config.js';

export const appConfig = {
  port: env.PORT,
  env: env.NODE_ENV,
  apiPrefix: '/api',
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiration: env.JWT_ACCESS_EXPIRATION,
    refreshExpiration: env.JWT_REFRESH_EXPIRATION,
  },
};

export default appConfig;
