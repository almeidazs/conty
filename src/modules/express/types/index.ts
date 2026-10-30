import type { IncomingMessage, ServerResponse } from 'node:http';

/** The part of an Express request the handler reads. */
export type ExpressRequest = IncomingMessage & { body?: unknown };

/** The part of an Express response the handler writes. */
export type ExpressResponse = ServerResponse;
