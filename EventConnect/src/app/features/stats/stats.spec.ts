/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: stats.spec.ts
 * Descripción: Prueba unitaria básica del componente de estadísticas.
 * Verifica que el componente StatsComponent se crea correctamente.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatsComponent } from './stats.component';

// Bloque principal de pruebas del componente de estadísticas.
describe('StatsComponent', () => {

  // Instancia del componente que será utilizada en los tests.
  let component: StatsComponent;

  // Fixture que permite acceder al DOM y al ciclo de vida del componente.
  let fixture: ComponentFixture<StatsComponent>;

  // Configuración previa ejecutada antes de cada test.
  beforeEach(async () => {

    // Se configura el entorno de pruebas importando el componente standalone.
    await TestBed.configureTestingModule({
      imports: [StatsComponent],
    }).compileComponents();

    // Se crea una instancia real del componente.
    fixture = TestBed.createComponent(StatsComponent);

    // Se obtiene la referencia al componente creado.
    component = fixture.componentInstance;

    // Espera a que Angular termine todas las tareas asíncronas pendientes.
    await fixture.whenStable();
  });

  // Test básico que verifica que el componente se crea correctamente.
  it('should create', () => {

    // Comprueba que la instancia del componente existe.
    expect(component).toBeTruthy();
  });
});