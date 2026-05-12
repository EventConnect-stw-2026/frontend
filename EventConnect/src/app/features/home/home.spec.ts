/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: home.component.spec.ts
 * Descripción: Pruebas unitarias básicas del componente HomeComponent.
 * Verifica que el componente principal de la página de inicio se cree correctamente.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeComponent } from './home.component';

// Suite principal de pruebas del componente HomeComponent.
// Se encarga de inicializar el entorno de testing
// y validar el funcionamiento básico del componente.
describe('HomeComponent', () => {

  // Instancia del componente que será utilizada en las pruebas.
  let component: HomeComponent;

  // Fixture utilizado para acceder al componente y al DOM renderizado.
  let fixture: ComponentFixture<HomeComponent>;

  // Configuración inicial ejecutada antes de cada prueba.
  // Inicializa el módulo de testing y crea la instancia del componente.
  beforeEach(async () => {

    await TestBed.configureTestingModule({

      // Se importa directamente el componente standalone.
      imports: [HomeComponent],

    }).compileComponents();

    // Creación del fixture y obtención de la instancia del componente.
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;

    // Espera a que finalicen procesos asíncronos iniciales del componente.
    await fixture.whenStable();
  });

  // Prueba unitaria básica para comprobar que el componente se crea correctamente.
  // Verifica que Angular pueda instanciar el componente sin errores.
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});