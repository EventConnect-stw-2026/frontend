/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: explore.spec.ts
 * Descripción: Archivo de pruebas unitarias básicas del componente de exploración de eventos.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Explore } from './explore';

// Suite principal de pruebas del componente Explore.
// Configura el entorno de testing necesario
// y valida el funcionamiento básico del componente.
describe('Explore', () => {

  // Instancia del componente utilizada en las pruebas.
  let component: Explore;

  // Fixture utilizado para acceder al componente y su template.
  let fixture: ComponentFixture<Explore>;

  // Configuración ejecutada antes de cada prueba.
  // Inicializa el módulo de testing y crea el componente.
  // También espera a que finalicen las tareas asíncronas pendientes.
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Explore],
    }).compileComponents();

    fixture = TestBed.createComponent(Explore);
    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  // Prueba básica para comprobar que el componente se crea correctamente.
  // Verifica que Angular pueda instanciar el componente sin errores.
  // Sirve como validación inicial del entorno de pruebas.
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});