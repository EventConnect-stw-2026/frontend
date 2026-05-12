/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: app.spec.ts
 * Descripción: Tests unitarios básicos del componente principal App.
 * Verifica la creación correcta de la aplicación y el renderizado inicial.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { TestBed } from '@angular/core/testing';

import { App } from './app';

describe('App', () => {

  /**
   * Configuración inicial del entorno de pruebas.
   * Se importa el componente standalone principal.
   */
  beforeEach(async () => {

    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  /**
   * Verifica que la aplicación se cree correctamente.
   */
  it('should create the app', () => {

    const fixture = TestBed.createComponent(App);

    const app = fixture.componentInstance;

    expect(app).toBeTruthy();
  });

  /**
   * Verifica que el título inicial se renderice correctamente.
   */
  it('should render title', async () => {

    const fixture = TestBed.createComponent(App);

    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(
      compiled.querySelector('h1')?.textContent
    ).toContain('Hello, EventConnect');
  });

});