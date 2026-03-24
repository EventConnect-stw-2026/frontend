import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminTopbarComponent } from '../../components/admin-topbar/admin-topbar.component';

interface AdminEvent {
  name: string;
  date: string;
  enrolled: string;
  category: string;
  status: 'Activo' | 'Pendiente';
}

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminTopbarComponent],
  templateUrl: './admin-events.component.html',
  styleUrl: './admin-events.component.scss'
})
export class AdminEventsComponent {
  search = '';
  selectedStatus = 'Todos';

  events: AdminEvent[] = [
    {
      name: 'Rock en el Parque Grande',
      date: '23 Feb 2026',
      enrolled: '1,234',
      category: 'Música',
      status: 'Activo'
    },
    {
      name: 'Exposición de Arte Moderno',
      date: '25 Feb 2026',
      enrolled: '892',
      category: 'Arte',
      status: 'Activo'
    },
    {
      name: 'Mercadillo del Barrio',
      date: '28 Feb 2026',
      enrolled: '567',
      category: 'Compras',
      status: 'Activo'
    },
    {
      name: 'Clase de Yoga Amanecida',
      date: '02 Mar 2026',
      enrolled: '450',
      category: 'Bienestar',
      status: 'Activo'
    },
    {
      name: 'Senderismo por Pinares',
      date: '08 Mar 2026',
      enrolled: '340',
      category: 'Deporte',
      status: 'Pendiente'
    },
    {
      name: 'Concierto Música Electrónica',
      date: '15 Mar 2026',
      enrolled: '2,100',
      category: 'Música',
      status: 'Activo'
    },
    {
      name: 'Festival Gastronómico',
      date: '22 Mar 2026',
      enrolled: '1,800',
      category: 'Gastronomía',
      status: 'Activo'
    },
    {
      name: 'Taller de Fotografía',
      date: '25 Mar 2026',
      enrolled: '120',
      category: 'Educación',
      status: 'Activo'
    }
  ];

  get filteredEvents(): AdminEvent[] {
    return this.events.filter((event) => {
      const matchesSearch =
        event.name.toLowerCase().includes(this.search.toLowerCase()) ||
        event.category.toLowerCase().includes(this.search.toLowerCase());

      const matchesStatus =
        this.selectedStatus === 'Todos' || event.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  createEvent(): void {
    console.log('Crear evento');
  }

  editEvent(event: AdminEvent): void {
    console.log('Editar evento', event);
  }

  viewEvent(event: AdminEvent): void {
    console.log('Ver evento', event);
  }

  deleteEvent(event: AdminEvent): void {
    console.log('Eliminar evento', event);
  }
}