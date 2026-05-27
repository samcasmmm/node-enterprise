// import { HTTP_STATUS_CODES } from '@/constants/HttpStatus.constants.js';
// import HTTP_STATUS_MESSAGE from '@/constants/messages.constants.js';
// import { UserModel } from '@/models/users.schema.js';
// import { redisAction } from '@/utils/redis.js';
// import type { NextFunction, Request, Response } from 'express';
// import jwt, { type JwtPayload } from 'jsonwebtoken';

// interface DecodedToken extends JwtPayload {
//   id: string;
// }

// export const isAuth = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const token = req.cookies?.accessToken;

//     if (!token) {
//       return res.build
//         .withStatus(HTTP_STATUS_CODES.FORBIDDEN)
//         .withMessage(HTTP_STATUS_MESSAGE.UNAUTHORIZED)
//         .send();
//     }

//     const secret = process.env.JWT_SECRET;
//     if (!secret) {
//       throw new Error('JWT_SECRET not defined');
//     }

//     const decodedData = jwt.verify(token, secret) as DecodedToken;

//     if (!decodedData?.id) {
//       return res.build
//         .withStatus(HTTP_STATUS_CODES.BAD_REQUEST)
//         .withMessage(HTTP_STATUS_MESSAGE.TOKEN_EXPIRED)
//         .send();
//     }

//     const cachedUser = await redisAction.get(`user:${decodedData.id}`);

//     if (cachedUser) {
//       req.user = JSON.parse(cachedUser);
//     }

//     const user = await UserModel.findById(decodedData?.id);
//     if (!user) {
//       return res.build
//         .withStatus(HTTP_STATUS_CODES.BAD_REQUEST)
//         .withMessage(HTTP_STATUS_MESSAGE.USER_NOT_FOUND)
//         .send();
//     }
//     await redisAction.setEX(`user:${user?.id}`, 3600, JSON.stringify(user));
//     req.user = user;
//     next();
//   } catch (error) {
//     return res.build
//       .withStatus(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
//       .withMessage(HTTP_STATUS_MESSAGE.INTERNAL_SERVER_ERROR)
//       .send();
//   }
// };
