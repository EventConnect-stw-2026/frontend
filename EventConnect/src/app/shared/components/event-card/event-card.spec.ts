/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: event-card.spec.ts
 * Descripción: Tests unitarios básicos del componente EventCard.
 * Verifica que el componente se cree correctamente.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventCard } from './event-card';

describe('EventCard', () => {

  // Instancia del componente
  let component: EventCard;

  // Fixture para acceder al DOM y al componente
  let fixture: ComponentFixture<EventCard>;

  /**
   * Configuración inicial del entorno de pruebas.
   * Se importa el componente standalone y se crea la instancia.
   */
  beforeEach(async () => {

    await TestBed.configureTestingModule({
      imports: [EventCard],
    }).compileComponents();

    fixture = TestBed.createComponent(EventCard);
    component = fixture.componentInstance;

    // Espera a que terminen tareas asíncronas del componente
    await fixture.whenStable();
  });

  /**
   * Verifica que el componente se cree correctamente.
   */
  it('should create', () => {
    expect(component).toBeTruthy();
  });

});