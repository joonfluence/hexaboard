import { InvalidTagsError } from '../src/errors';
import { Position } from '../src/position';
import { normalizeTags } from '../src/tags';
import { Ticket } from '../src/ticket';

describe('normalizeTags (007)', () => {
  it('TC-DOM-061: 앞뒤 공백을 제거하고 소문자로 바꾼다', () => {
    expect(normalizeTags(['  Docs '])).toEqual(['docs']);
  });

  it('TC-DOM-062: 정규화 뒤 중복은 하나로 합치고 이름 오름차순이다', () => {
    expect(normalizeTags(['b', 'Docs', 'a', 'docs '])).toEqual([
      'a',
      'b',
      'docs',
    ]);
  });

  it('TC-DOM-063: 빈 이름·공백뿐·31자는 거부하고 30자는 허용한다', () => {
    for (const bad of ['', '   ', 'a'.repeat(31)]) {
      expect(() => normalizeTags([bad])).toThrow(InvalidTagsError);
    }
    expect(normalizeTags(['a'.repeat(30)])).toHaveLength(1);
  });

  it('TC-DOM-064: 11개는 거부, 10개는 허용, 중복 제거 뒤 10개면 허용한다', () => {
    const names = Array.from({ length: 11 }, (_, i) => `t${i}`);
    expect(() => normalizeTags(names)).toThrow(InvalidTagsError);
    expect(normalizeTags(names.slice(0, 10))).toHaveLength(10);
    expect(normalizeTags([...names.slice(0, 10), 'T0'])).toHaveLength(10);
  });

  it.each([
    ['문자열', 'a'],
    ['객체', {}],
    ['null', null],
    ['숫자 항목', [1]],
  ])('TC-DOM-065: %s은 거부하고 field는 tags다', (_l, raw) => {
    try {
      normalizeTags(raw);
      throw new Error('던져지지 않음');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidTagsError);
      expect((error as InvalidTagsError).field).toBe('tags');
    }
  });
});

describe('Ticket 태그 (007)', () => {
  const position = Position.first();
  const stored = () =>
    Ticket.rehydrate({
      ticketId: '0194f0a6-1b2c-4d3e-8f4a-5b6c7d8e9f00',
      title: 't',
      description: null,
      status: 'TODO',
      priority: 'MEDIUM',
      dueAt: null,
      position: 'a0',
      tags: ['a', 'b'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  it('TC-DOM-066: 생성은 정규화해 보관하고 없으면 빈 배열, 수정은 교체·비움·유지한다', () => {
    expect(
      Ticket.create({ title: 't', tags: [' X ', 'x'], position }).tags,
    ).toEqual(['x']);
    expect(Ticket.create({ title: 't', position }).tags).toEqual([]);
    expect(stored().update({ tags: ['z'] }).tags).toEqual(['z']);
    expect(stored().update({ tags: [] }).tags).toEqual([]);
    expect(stored().update({ title: 'n' }).tags).toEqual(['a', 'b']);
  });

  it('TC-DOM-067: 복원과 이동은 태그를 유지한다', () => {
    expect(stored().tags).toEqual(['a', 'b']);
    expect(stored().moveTo('DONE', Position.from('a1')).tags).toEqual([
      'a',
      'b',
    ]);
  });
});
