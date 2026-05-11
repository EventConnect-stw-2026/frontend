/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: login.spec.ts
 * Descripción: Pruebas unitarias del componente de inicio de sesión.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';

// Bloque principal de pruebas del componente LoginComponent.
describe('LoginComponent', () => {

  // Instancia del componente que será utilizada en las pruebas.
  let component: LoginComponent;

  // Fixture que permite acceder al componente y al DOM renderizado.
  let fixture: ComponentFixture<LoginComponent>;

  /**
   * Configuración inicial ejecutada antes de cada prueba.
   * Se compila el componente y se crea una nueva instancia limpia.
   */
  beforeEach(async () => {

    // Configuración del entorno de pruebas.
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
    }).compileComponents();

    // Creación del fixture asociado al componente.
    fixture = TestBed.createComponent(LoginComponent);

    // Obtención de la instancia real del componente.
    component = fixture.componentInstance;

    // Espera a que Angular termine de inicializar el componente.
    await fixture.whenStable();
  });

  /**
   * Verifica que el componente se crea correctamente.
   * Esta prueba asegura que Angular puede instanciar el componente
   * sin producir errores de dependencias o inicialización.
   */
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});