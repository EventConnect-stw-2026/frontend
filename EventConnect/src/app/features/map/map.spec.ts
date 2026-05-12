/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: map.spec.ts
 * Descripción: Archivo de pruebas unitarias básicas del componente de mapa de eventos.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Map } from './map.component';

// Suite principal de pruebas del componente Map.
// Configura el entorno de testing necesario
// y comprueba que el componente pueda crearse correctamente.
describe('Map', () => {

  // Instancia del componente utilizada durante las pruebas.
  let component: Map;

  // Fixture utilizado para acceder al componente y a su template.
  let fixture: ComponentFixture<Map>;

  // Configuración ejecutada antes de cada prueba.
  // Inicializa el módulo de testing y crea el componente.
  // También espera a que finalicen las tareas asíncronas pendientes.
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Map],
    }).compileComponents();

    fixture = TestBed.createComponent(Map);
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