import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export type AuthUser = { userId: string; email?: string };
export type PortalPrincipal = { clientId: string; jti: string; scope: "portal" };

/** The verified bookkeeper from the Supabase access token. */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user,
);

/** The verified magic-link portal principal. Never a bookkeeper. */
export const Portal = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): PortalPrincipal => ctx.switchToHttp().getRequest().portal,
);
