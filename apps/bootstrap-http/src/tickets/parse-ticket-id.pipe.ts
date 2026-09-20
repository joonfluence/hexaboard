import { Injectable, type PipeTransform } from '@nestjs/common';
import { InvalidTicketIdError } from '../common/http-errors';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 경로의 ticketId가 UUID 형식인지 확인한다. 존재 여부는 유스케이스가 판단한다. */
@Injectable()
export class ParseTicketIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!UUID.test(value)) {
      throw new InvalidTicketIdError(value);
    }
    return value;
  }
}
