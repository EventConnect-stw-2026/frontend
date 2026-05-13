/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: event-card.spec.ts
 * Descripción: Tests unitarios básicos del componente EventCard.
 * Verifica que el componente se cree correctamente.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EventCardComponent } from './event-card';

describe('EventCardComponent', () => {
  let component: EventCardComponent;
  let fixture: ComponentFixture<EventCardComponent>;

  /**
   * Configuración inicial del entorno de pruebas.
   * Se importa el componente standalone y se crea la instancia.
   */
  beforeEach(async () => {

    await TestBed.configureTestingModule({
      imports: [EventCardComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(EventCardComponent);
    component = fixture.componentInstance;
  });

  /**
   * Verifica que el componente se cree correctamente.
   */
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renderiza el título y la ubicación del evento', () => {
    component.event = {
      _id: 'e1',
      title: 'Concierto',
      locationName: 'Auditorio',
      startDate: '2026-06-01T10:00:00Z',
      description: 'Texto',
      category: 'Música'
    };
    fixture.detectChanges();

    const html = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(html).toContain('Concierto');
    expect(html).toContain('Auditorio');
  });

  it('no muestra el badge de categoría cuando el evento no la incluye', () => {
    component.event = { _id: 'e1', title: 'T', locationName: 'L' };
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.card-category')).toBeNull();
  });

  it('muestra el badge de categoría cuando el evento la incluye', () => {
    const fresh = TestBed.createComponent(EventCardComponent);
    fresh.componentInstance.event = { _id: 'e1', title: 'T', locationName: 'L', category: 'Música' };
    fresh.detectChanges();
    expect((fresh.nativeElement as HTMLElement).querySelector('.card-category')?.textContent).toContain('Música');
  });

  it('limpia el HTML de la descripción mediante stripHtml', () => {
    component.event = {
      _id: 'e1',
      title: 'T',
      locationName: 'L',
      description: '<p>Hola <strong>mundo</strong></p>'
    };
    fixture.detectChanges();

    const desc = (fixture.nativeElement as HTMLElement).querySelector('.description')?.textContent ?? '';
    expect(desc).toContain('Hola mundo');
    expect(desc).not.toContain('<');
  });

  describe('getImage', () => {
    it('devuelve la imagen por defecto cuando imageUrl está ausente', () => {
      expect(component.getImage({})).toBe(component.defaultImage);
    });

    it('devuelve la imagen por defecto cuando imageUrl es una cadena vacía', () => {
      expect(component.getImage({ imageUrl: '   ' })).toBe(component.defaultImage);
    });

    it('devuelve imageUrl cuando es válida', () => {
      const url = 'https://example.com/foto.jpg';
      expect(component.getImage({ imageUrl: url })).toBe(url);
    });

    it('devuelve la imagen por defecto cuando imageUrl no es string', () => {
      expect(component.getImage({ imageUrl: 123 })).toBe(component.defaultImage);
    });
  });

  it('onImageError sustituye el src por la imagen por defecto', () => {
    const evt = { target: { src: 'roto.jpg' } };
    component.onImageError(evt);
    expect(evt.target.src).toBe(component.defaultImage);
  });
});
