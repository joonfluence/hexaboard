import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildOpenApiDocument } from '../src/openapi/document';

const COMMITTED = join(__dirname, '../../../packages/api-client/openapi.json');

describe('OpenAPI 계약 (005)', () => {
  it('TC-API-071: 경로와 메서드가 api_spec과 같다', async () => {
    const { paths } = await buildOpenApiDocument();

    expect(Object.keys(paths).sort()).toEqual([
      '/v1/tickets',
      '/v1/tickets/sort',
      '/v1/tickets/{ticketId}',
      '/v1/tickets/{ticketId}/position',
    ]);
    expect(Object.keys(paths['/v1/tickets']!).sort()).toEqual(['get', 'post']);
    expect(Object.keys(paths['/v1/tickets/{ticketId}']!).sort()).toEqual([
      'delete',
      'get',
      'patch',
    ]);
    expect(Object.keys(paths['/v1/tickets/{ticketId}/position']!)).toEqual([
      'put',
    ]);
  });

  it('TC-API-072: 티켓 응답 스키마는 정해진 8개 필드뿐이다', async () => {
    const document = await buildOpenApiDocument();
    const schema = document.components?.schemas?.['TicketResponse'] as {
      properties: Record<string, unknown>;
    };

    expect(Object.keys(schema.properties).sort()).toEqual([
      'createdAt',
      'description',
      'dueAt',
      'priority',
      'status',
      'ticketId',
      'title',
      'updatedAt',
    ]);
  });

  it('TC-API-073: 이동 요청 스키마에는 position이 없다', async () => {
    const document = await buildOpenApiDocument();
    const schema = document.components?.schemas?.['MovePositionDto'] as {
      properties: Record<string, unknown>;
    };

    expect(Object.keys(schema.properties).sort()).toEqual([
      'anchorTicketId',
      'placement',
      'status',
    ]);
  });

  it('TC-API-074: 커밋된 openapi.json은 서버 DTO에서 생성한 문서와 같다', async () => {
    const generated = JSON.stringify(await buildOpenApiDocument(), null, 2);

    expect(readFileSync(COMMITTED, 'utf8').trim()).toBe(generated.trim());
  });
});
