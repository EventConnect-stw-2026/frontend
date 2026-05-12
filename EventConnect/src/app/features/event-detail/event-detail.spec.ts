/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: event-detail.spec.ts
 * Descripción: Archivo de pruebas unitarias básicas del componente de detalle de evento.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventDetail } from './event-detail';

// Suite principal de pruebas del componente EventDetail.
// Se encarga de inicializar el entorno de testing
// y comprobar el correcto funcionamiento básico del componente.
describe('EventDetail', () => {

  // Instancia del componente utilizada durante las pruebas.
  let component: EventDetail;

  // Fixture utilizado para acceder al componente y a su template.
  let fixture: ComponentFixture<EventDetail>;

  // Configuración previa ejecutada antes de cada test.
  // Inicializa el módulo de pruebas y crea el componente.
  // También espera a que finalicen las tareas asíncronas pendientes.
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(EventDetail);
    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  // Prueba básica para comprobar que el componente se crea correctamente.
  // Verifica que Angular pueda instanciar el componente sin errores.
  // Se utiliza como test inicial de validación del entorno.
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});