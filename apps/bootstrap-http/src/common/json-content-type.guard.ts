import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { UnsupportedMediaTypeError } from './http-errors';

const JSON_MEDIA_TYPE = /^application\/([\w.+-]+\+)?json\s*(;|$)/i;

/** Content-Type이 있으면 JSON이어야 한다. 프레임워크 기본은 이를 검사하지 않는다. */
@Injectable()
export class JsonContentTypeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | undefined> }>();
    const contentType = request.headers['content-type'];
    if (contentType !== undefined && !JSON_MEDIA_TYPE.test(contentType)) {
      throw new UnsupportedMediaTypeError();
    }
    return true;
  }
}
