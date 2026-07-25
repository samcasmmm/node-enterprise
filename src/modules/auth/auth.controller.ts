import { inject, injectable } from 'tsyringe';
import asyncHandler from 'express-async-handler';
import type { Request, Response } from 'express';
import { TOKENS } from '@/core/container/tokens.js';
import { HTTP_STATUS_CODES } from '@/shared/constants/index.js';
import { UnauthorizedError } from '@/core/errors/index.js';
import type { AuthService, OtpService, MfaService, DeviceService } from './auth.service.js';

@injectable()
export class AuthController {
  constructor(
    @inject(TOKENS.AuthService) private readonly authService: AuthService,
    @inject(TOKENS.OtpService) private readonly otpService: OtpService,
    @inject(TOKENS.MfaService) private readonly mfaService: MfaService,
    @inject(TOKENS.DeviceService) private readonly deviceService: DeviceService,
  ) {}

  /** Onboarding: Create Tenant + Owner User + Default Data in a single transaction */
  registerTenant = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.registerTenant(req.body);
    res.build
      .withModule('auth')
      .withStatus(HTTP_STATUS_CODES.CREATED)
      .withMessage('Tenant and administrator account created successfully.')
      .withData({
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
        },
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          slug: result.tenant.slug,
          status: result.tenant.status,
        },
        roles: result.roles.map((r) => ({ id: r.id, name: r.name, description: r.description })),
        permissions: result.permissions,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      })
      .send();
  });

  /** Register additional user under an existing tenant */
  register = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenant?.tenantId ?? req.body.tenantId;
    if (!tenantId) throw new UnauthorizedError('Tenant context is required for user registration.');
    const user = await this.authService.registerUser({ ...req.body, tenantId });
    res.build
      .withModule('auth')
      .withStatus(HTTP_STATUS_CODES.CREATED)
      .withMessage('Account created.')
      .withData({ id: user.id, email: user.email })
      .send();
  });

  /** Login — requires email & password (no tenant ID required) */
  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.login({
      ...req.body,
      tenantId: req.tenant?.tenantId ?? req.body.tenantId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    if (result.requiresTenantSelection) {
      res.build
        .withModule('auth')
        .withStatus(HTTP_STATUS_CODES.OK)
        .withMessage('Multiple tenant accounts found. Please select a tenant to log in.')
        .withData({
          requiresTenantSelection: true,
          tenants: result.tenants?.map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
        })
        .send();
      return;
    }

    if (req.body.deviceFingerprint && result.user) {
      await this.deviceService.registerOrTouch(result.user.id, req.body.deviceFingerprint, {
        name: req.body.deviceName,
        platform: req.body.platform,
        ipAddress: req.ip,
      });
    }

    res.build
      .withModule('auth')
      .withStatus(HTTP_STATUS_CODES.OK)
      .withMessage('Login successful.')
      .withData({
        user: {
          id: result.user!.id,
          name: result.user!.name,
          email: result.user!.email,
          tenantId: result.user!.tenantId,
        },
        tenant: {
          id: result.tenant!.id,
          name: result.tenant!.name,
          slug: result.tenant!.slug,
          status: result.tenant!.status,
        },
        roles: result.roles?.map((r) => ({ id: r.id, name: r.name, description: r.description })),
        permissions: result.permissions,
        accessToken: result.tokens!.accessToken,
        refreshToken: result.tokens!.refreshToken,
      })
      .send();
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const tokens = await this.authService.refresh(req.body.refreshToken);
    res.build
      .withModule('auth')
      .withStatus(HTTP_STATUS_CODES.OK)
      .withMessage('Token refreshed.')
      .withData(tokens)
      .send();
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    await this.authService.logout(req.user.id, req.body.refreshToken);
    res.build.withModule('auth').withStatus(HTTP_STATUS_CODES.OK).withMessage('Logged out.').send();
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    res.build
      .withModule('auth')
      .withStatus(HTTP_STATUS_CODES.OK)
      .withMessage('Current user.')
      .withData(req.user)
      .send();
  });

  sendOtp = asyncHandler(async (req: Request, res: Response) => {
    await this.otpService.send(
      req.body.destination,
      req.body.purpose,
      req.user?.id,
      req.body.channel,
    );
    res.build.withModule('auth').withStatus(HTTP_STATUS_CODES.OK).withMessage('OTP sent.').send();
  });

  verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    await this.otpService.verify(req.body.destination, req.body.purpose, req.body.code);
    res.build
      .withModule('auth')
      .withStatus(HTTP_STATUS_CODES.OK)
      .withMessage('OTP verified.')
      .send();
  });

  enrollMfa = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const factor = await this.mfaService.enroll(req.user.id, req.body.type);
    res.build
      .withModule('auth')
      .withStatus(HTTP_STATUS_CODES.CREATED)
      .withMessage('MFA factor created.')
      .withData(factor)
      .send();
  });

  verifyMfa = asyncHandler(async (req: Request, res: Response) => {
    const factor = await this.mfaService.verifyEnrollment(req.body.factorId, req.body.code);
    res.build
      .withModule('auth')
      .withStatus(HTTP_STATUS_CODES.OK)
      .withMessage('MFA verified.')
      .withData(factor)
      .send();
  });

  listDevices = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const devices = await this.deviceService.listForUser(req.user.id);
    res.build
      .withModule('auth')
      .withStatus(HTTP_STATUS_CODES.OK)
      .withMessage('Devices fetched.')
      .withData(devices)
      .send();
  });

  revokeDevice = asyncHandler(async (req: Request, res: Response) => {
    await this.deviceService.revoke(Number(req.params.id));
    res.build
      .withModule('auth')
      .withStatus(HTTP_STATUS_CODES.OK)
      .withMessage('Device revoked.')
      .send();
  });
}
