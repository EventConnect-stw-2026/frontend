/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: register.spec.ts
 * Descripción: Pruebas unitarias básicas del componente RegisterComponent.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterComponent } from './register.component';

// Bloque principal de pruebas del componente RegisterComponent.
// Aquí se definen todas las pruebas relacionadas con el componente.
describe('RegisterComponent', () => {

  // Instancia del componente que será utilizada durante las pruebas.
  let component: RegisterComponent;

  // Fixture utilizado para acceder al componente y al DOM asociado.
  let fixture: ComponentFixture<RegisterComponent>;

  // Configuración previa que se ejecuta antes de cada prueba.
  // Inicializa el entorno de testing y crea una instancia del componente.
  beforeEach(async () => {

    // Configuración del módulo de pruebas.
    // Se importa el componente standalone directamente.
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
    }).compileComponents();

    // Creación del fixture asociado al componente.
    fixture = TestBed.createComponent(RegisterComponent);

    // Obtención de la instancia del componente.
    component = fixture.componentInstance;

    // Espera a que finalicen las tareas asíncronas pendientes.
    await fixture.whenStable();
  });

  // Prueba unitaria básica.
  // Verifica que el componente se crea correctamente.
  it('should create', () => {

    // Comprueba que la instancia del componente exista.
    expect(component).toBeTruthy();
  });
});