import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { parseAllowedOrigins } from './allowed-origins';

/**
 * Hard-rejects (403) any request whose `Origin` header is present but not in
 * the CORS_ORIGIN allowlist. Requests without an `Origin` header (same-origin
 * navigations, server-to-server calls, health checks) are allowed through —
 * browsers always set `Origin` on cross-origin requests, so this still blocks
 * cross-site browser traffic while not breaking non-browser clients.
 *
 * This complements the CORS response headers (which the browser enforces) with
 * server-side enforcement.
 */
@Injectable()
export class OriginGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const origin = request.headers.origin;

    if (!origin) {
      return true;
    }

    const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN);

    if (!allowedOrigins.includes(origin)) {
      throw new ForbiddenException('Origin not allowed');
    }

    return true;
  }
}
