import { NumberAbbrPipe } from './number-abbr.pipe';

describe('NumberAbbrPipe', () => {
  it('create an instance', () => {
    const pipe = new NumberAbbrPipe();
    expect(pipe).toBeTruthy();
  });
});
