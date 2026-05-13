/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: map.spec.ts
 * Descripción: Archivo de pruebas unitarias básicas del componente de mapa de eventos.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { MapComponent } from './map.component';

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;

  // Configuración ejecutada antes de cada prueba.
  // Inicializa el módulo de testing y crea el componente.
  // También espera a que finalicen las tareas asíncronas pendientes.
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
  });

  // Prueba básica para comprobar que el componente se crea correctamente.
  // Verifica que Angular pueda instanciar el componente sin errores.
  // Sirve como validación inicial del entorno de pruebas.
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});