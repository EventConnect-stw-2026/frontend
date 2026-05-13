/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: stats.spec.ts
 * Descripción: Prueba unitaria básica del componente de estadísticas.
 * Verifica que el componente StatsComponent se crea correctamente.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { StatsComponent } from './stats.component';

describe('StatsComponent', () => {
  let component: StatsComponent;
  let fixture: ComponentFixture<StatsComponent>;

  // Instancia del componente que será utilizada en los tests.
  let component: StatsComponent;

  // Fixture que permite acceder al DOM y al ciclo de vida del componente.
  let fixture: ComponentFixture<StatsComponent>;

  // Configuración previa ejecutada antes de cada test.
  beforeEach(async () => {

    // Se configura el entorno de pruebas importando el componente standalone.
    await TestBed.configureTestingModule({
      imports: [StatsComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StatsComponent);
    component = fixture.componentInstance;
  });

  // Test básico que verifica que el componente se crea correctamente.
  it('should create', () => {

    // Comprueba que la instancia del componente existe.
    expect(component).toBeTruthy();
  });
});