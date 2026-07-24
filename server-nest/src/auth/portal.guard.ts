import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Portal-only guard. Attaches the principal to req.portal (never req.user) so
 * a handler can never mistake a client for a bookkeeper.
 */
@Injectable()
export class PortalGuard extends AuthGuard("portal") {
  handleRequest<T>(err: unknown, principal: T, _info: unknown, context: ExecutionContext): T {
    if (err || !principal) throw err ?? new (require("@nestjs/common").UnauthorizedException)();
    context.switchToHttp().getRequest().portal = principal;
    return principal;
  }
}
