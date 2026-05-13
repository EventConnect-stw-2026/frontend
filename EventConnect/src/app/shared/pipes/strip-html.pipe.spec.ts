import { StripHtmlPipe } from './strip-html.pipe';

describe('StripHtmlPipe', () => {
  let pipe: StripHtmlPipe;

  beforeEach(() => {
    pipe = new StripHtmlPipe();
  });

  it('devuelve cadena vacía cuando recibe null o undefined', () => {
    expect(pipe.transform(null as unknown as string)).toBe('');
    expect(pipe.transform(undefined as unknown as string)).toBe('');
  });

  it('devuelve cadena vacía cuando recibe una cadena vacía', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('elimina las etiquetas HTML simples', () => {
    expect(pipe.transform('<p>Hola</p>')).toBe('Hola');
  });

  it('elimina etiquetas anidadas conservando el texto', () => {
    expect(pipe.transform('<p>Hola <strong>mundo</strong></p>')).toBe('Hola mundo');
  });

  it('elimina atributos dentro de las etiquetas', () => {
    expect(pipe.transform('<a href="x" class="y">click</a>')).toBe('click');
  });

  it('aplica trim al resultado final', () => {
    expect(pipe.transform('   <p>texto</p>   ')).toBe('texto');
  });

  it('deja intacto el texto sin etiquetas', () => {
    expect(pipe.transform('texto plano')).toBe('texto plano');
  });
});
