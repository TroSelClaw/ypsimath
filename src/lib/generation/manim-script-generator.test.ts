import { describe, it, expect } from 'vitest';
import { validateManimScript } from './manim-script-generator';

describe('validateManimScript', () => {
  const validScript = `from manim import *

class ExampleScene(Scene):
    def construct(self):
        title = Text("Derivasjon av x²")
        self.play(Write(title))
        self.wait(2)
`;

  it('accepts a valid Manim CE script', () => {
    expect(validateManimScript(validScript)).toBeNull();
  });

  it('rejects script without manim import', () => {
    const script = `class ExampleScene(Scene):
    def construct(self):
        pass`;
    expect(validateManimScript(script)).toContain('Missing');
  });

  it('rejects script without construct method', () => {
    const script = `from manim import *

class ExampleScene(Scene):
    def setup(self):
        pass`;
    expect(validateManimScript(script)).toContain('construct');
  });

  it('rejects script using manimlib (old API)', () => {
    const script = `from manimlib.imports import *

class ExampleScene(Scene):
    def construct(self):
        pass`;
    expect(validateManimScript(script)).toContain('manimlib');
  });

  it('rejects script with unbalanced parentheses', () => {
    const script = `from manim import *

class ExampleScene(Scene):
    def construct(self):
        self.play(Write(Text("hei")
`;
    const result = validateManimScript(script);
    expect(result).toContain('Unbalanced');
  });
});
