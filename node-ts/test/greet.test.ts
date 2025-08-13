import { describe, expect, it } from 'vitest';
import { greet } from '../src/index';

describe('greet', () => {
  it('greets by name', () => {
    expect(greet('Alice')).toBe('Hello, Alice!');
  });
});
