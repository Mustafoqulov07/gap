import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerBot } from '../../infrastructure/bot/logger.bot';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';
    let details: unknown;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      code = HttpStatus[statusCode] ?? 'HTTP_ERROR';

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const data = exceptionResponse as {
          error?: string;
          code?: string;
          message?: string | string[];
          details?: unknown;
        };

        code = data.code ?? data.error ?? code;

        if (typeof data.message === 'string') {
          message = data.message;
        } else if (Array.isArray(data.message)) {
          message = data.message.join(', ');
        }

        details = data.details;
      }
    }

    if (exception instanceof Error) {
      this.logger.error(
        `${request.method} ${request.url} -> ${statusCode} ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error(
        `${request.method} ${request.url} -> ${statusCode}`,
        JSON.stringify(exception),
      );
    }

    if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
      void this.sendErrorToTelegram({
        request,
        statusCode,
        code,
        message,
        details,
        errorStack:
          exception instanceof Error
            ? exception.stack
            : JSON.stringify(exception),
      });
    }

    response.status(statusCode).json({
      statusCode,
      code,
      message,
      ...(details !== undefined ? { details } : {}),
      timestamp: new Date().toISOString(),
    });
  }

  private async sendErrorToTelegram(data: {
    request: Request;
    statusCode: number;
    code: string;
    message: string;
    details?: unknown;
    errorStack?: string;
  }) {
    const { request, statusCode, code, message, details, errorStack } = data;

    const path = request.originalUrl ?? request.url;

    const telegramMessage = `
🚨 <b>BACKEND 500 ERROR</b>

<b>Status:</b> ${statusCode}
<b>Code:</b> ${this.escapeHtml(code)}
<b>Method:</b> ${this.escapeHtml(request.method)}
<b>Path:</b> <code>${this.escapeHtml(path)}</code>
<b>IP:</b> ${this.escapeHtml(request.ip ?? 'unknown')}

<b>Message:</b> ${this.escapeHtml(message)}

<b>Details:</b>
<pre>${this.escapeHtml(
      details !== undefined ? JSON.stringify(details, null, 2) : 'N/A',
    )}</pre>

<b>Stack:</b>
<pre>${this.escapeHtml(errorStack ?? 'No stack trace')}</pre>

<b>User-Agent:</b>
<pre>${this.escapeHtml(request.headers['user-agent'] ?? 'unknown')}</pre>

<b>Time:</b> ${new Date().toLocaleString()}
    `.trim();

    await LoggerBot.sendMessage(telegramMessage.slice(0, 3900));
  }

  private escapeHtml(value: unknown): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
