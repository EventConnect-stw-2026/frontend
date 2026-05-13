/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: stats.component.ts
 * Descripción: Componente encargado de gestionar las estadísticas personales y globales,
 * cargando datos desde el backend y preparando valores calculados para las gráficas.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HeaderComponent } from '../../layout/components/header/header';
import { EventService } from '../../core/services/event.service';

// Tipo usado para representar una estadística agrupada por categoría.
// Incluye la etiqueta visible, el valor numérico y el color de la barra.
type CategoryStat = {
  label: string;
  value: number;
  color: string;
};

// Tipo usado para representar una estadística agrupada por día.
type DayStat = {
  day: string;
  count: number;
};

// Tipo usado para agrupar todas las estadísticas personales del usuario.
type PersonalStats = {
  eventsAttended: number;
  friendsMet: number;
  topCategory: string | null;
  busiestDay: string | null;
  categoryStats: CategoryStat[];
  dayStats: DayStat[];
};

// Componente encargado de mostrar estadísticas personales y globales.
// Carga datos desde el servicio de eventos
// y calcula valores máximos para pintar gráficas proporcionales.
@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss',
})
export class StatsComponent implements OnInit {

  // Pestaña activa de la pantalla de estadísticas.
  activeTab: 'personal' | 'global' = 'global';

  // Identificador de plataforma para ejecutar la carga solo en navegador.
  private platformId = inject(PLATFORM_ID);

  // Servicio utilizado para obtener estadísticas desde el backend.
  private eventService = inject(EventService);

  // Referencia para forzar la detección de cambios tras recibir datos.
  private cdr = inject(ChangeDetectorRef);

  // Estadísticas globales agrupadas por categoría.
  categoryStats: CategoryStat[] = [];

  // Estadísticas globales agrupadas por día de la semana.
  dayStats: DayStat[] = [];

  // Estadísticas personales inicializadas con valores seguros.
  // Se evita trabajar con propiedades undefined en la plantilla.
  personalStats: PersonalStats = {
    friendsMet: 0,
    eventsAttended: 0,
    topCategory: null,
    busiestDay: null,
    categoryStats: [],
    dayStats: [],
  };

  // Getter que devuelve las categorías ordenadas de mayor a menor valor.
  // También elimina categorías con color blanco para evitar barras invisibles.
  // Se utiliza en las gráficas globales y en el ranking de categorías.
  get sortedCategoryStats() {
    const white = ['white', '#fff', '#ffffff'];

    return [...this.categoryStats]
      .filter(c => !white.includes(c.color?.toLowerCase()))
      .sort((a, b) => b.value - a.value);
  }

  // Getter que obtiene el valor máximo entre las categorías globales.
  // Sirve para calcular la altura proporcional de cada barra.
  // Si no hay datos, devuelve 1 para evitar divisiones entre cero.
  get maxCategory() {
    return this.categoryStats.length
      ? Math.max(...this.categoryStats.map(c => c.value))
      : 1;
  }

  // Getter que obtiene el valor máximo entre los días globales.
  // Se usa como referencia para las barras de eventos por día.
  // Si no hay datos, devuelve 1 como valor seguro.
  get maxDay() {
    return this.dayStats.length
      ? Math.max(...this.dayStats.map(d => d.count))
      : 1;
  }

  // Getter que obtiene el valor máximo de categorías personales.
  // Permite escalar correctamente la gráfica personal por categoría.
  // Devuelve 1 si todavía no existen estadísticas personales.
  get maxPersonalCategory() {
    return this.personalStats.categoryStats.length
      ? Math.max(...this.personalStats.categoryStats.map(c => c.value))
      : 1;
  }

  // Getter que obtiene el valor máximo de días personales.
  // Permite calcular la altura proporcional de la gráfica personal por día.
  // Devuelve 1 cuando no hay datos disponibles.
  get maxPersonalDay() {
    return this.personalStats.dayStats.length
      ? Math.max(...this.personalStats.dayStats.map(d => d.count))
      : 1;
  }

  // Método del ciclo de vida ejecutado al inicializar el componente.
  // Comprueba que se está ejecutando en navegador
  // y carga estadísticas globales y personales.
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadGlobalStats();
      this.loadPersonalStats();
    }
  }

  // Método para cargar las estadísticas globales.
  // Solicita al backend datos de categorías y días.
  // Si la respuesta es correcta, actualiza las gráficas globales.
  loadGlobalStats() {
    this.eventService.getGlobalStats().subscribe({
      next: (res) => {
        if (res.success) {
          this.categoryStats = res.data.categoryStats ?? [];
          this.dayStats = res.data.dayStats ?? [];
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error cargando stats globales', err)
    });
  }

  // Método para cargar las estadísticas personales del usuario.
  // Reconstruye el objeto completo para mantener tipos correctos
  // y evitar errores por propiedades undefined en la plantilla.
  loadPersonalStats() {
    this.eventService.getPersonalStats().subscribe({
      next: (res) => {
        if (res.success) {

          // Se reasigna el objeto completo con valores por defecto seguros.
          this.personalStats = {
            friendsMet: res.data.friendsMet ?? 0,
            eventsAttended: res.data.eventsAttended ?? 0,
            topCategory: res.data.topCategory ?? null,
            busiestDay: res.data.busiestDay ?? null,
            categoryStats: res.data.categoryStats ?? [],
            dayStats: res.data.dayStats ?? []
          };

          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error cargando stats personales', err);

        // Fallback usado cuando no se pueden cargar estadísticas personales.
        this.personalStats.topCategory = 'Inicia sesión para ver';
        this.personalStats.busiestDay = 'Inicia sesión para ver';

        this.cdr.detectChanges();
      }
    });
  }

  // Método para cambiar entre estadísticas personales y globales.
  // Actualiza la pestaña activa y fuerza el refresco de la vista.
  setTab(tab: 'personal' | 'global') {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }
}