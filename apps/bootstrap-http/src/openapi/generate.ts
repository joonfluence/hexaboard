import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildOpenApiDocument } from './document';

/** 사용: node dist/openapi/generate.js <출력 파일>. 서버 DTO를 바꾼 뒤 수동으로 실행하고 생성물을 커밋한다. */
async function main(): Promise<void> {
  const output = process.argv[2];
  if (!output) {
    throw new Error('출력 파일 경로가 필요합니다.');
  }
  const document = await buildOpenApiDocument();
  writeFileSync(resolve(output), `${JSON.stringify(document, null, 2)}\n`);
}

void main();
