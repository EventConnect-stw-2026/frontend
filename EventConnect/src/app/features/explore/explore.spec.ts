/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: explore.spec.ts
 * Descripción: Archivo de pruebas unitarias básicas del componente de exploración de eventos.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ExploreComponent } from './explore.component';

describe('ExploreComponent', () => {
  let component: ExploreComponent;
  let fixture: ComponentFixture<ExploreComponent>;

  // Configuración ejecutada antes de cada prueba.
  // Inicializa el módulo de testing y crea el componente.
  // También espera a que finalicen las tareas asíncronas pendientes.
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExploreComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExploreComponent);
    component = fixture.componentInstance;
  });

  // Prueba básica para comprobar que el componente se crea correctamente.
  // Verifica que Angular pueda instanciar el componente sin errores.
  // Sirve como validación inicial del entorno de pruebas.
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});