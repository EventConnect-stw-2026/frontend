/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: header.spec.ts
 * Descripción: Prueba unitaria básica del componente HeaderComponent.
 * Verifica que el encabezado principal de la aplicación se crea correctamente.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderComponent } from './header';

// Bloque principal de pruebas del componente de cabecera.
describe('HeaderComponent', () => {

  // Instancia del componente que será utilizada en los tests.
  let component: HeaderComponent;

  // Fixture que permite acceder al DOM y controlar el ciclo de vida del componente.
  let fixture: ComponentFixture<HeaderComponent>;

  // Configuración previa ejecutada antes de cada prueba.
  beforeEach(async () => {

    // Se configura el entorno de pruebas importando el componente standalone.
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
    }).compileComponents();

    // Se crea una instancia real del componente.
    fixture = TestBed.createComponent(HeaderComponent);

    // Se obtiene la referencia a la instancia creada.
    component = fixture.componentInstance;

    // Espera a que Angular finalice las tareas asíncronas pendientes.
    await fixture.whenStable();
  });

  // Test básico que comprueba que el componente existe correctamente.
  it('should create', () => {

    // Verifica que la instancia del componente ha sido creada.
    expect(component).toBeTruthy();
  });
});