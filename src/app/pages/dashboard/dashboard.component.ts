import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../services/event.service';

interface Event {
  id: string;
  name: string;
  totalCount: number;
  limits: string;
}

interface DashboardStats {
  totalRevenue: string;
  ticketSales: number;
  availableTickets: number;
}

interface TicketStats {
  sales: number;
  available: number;
}

interface ValidationStats {
  activeTickets: number;
  participants: number;
}

interface Ticket {
  id: string;
  event: string;
  name: string;
  category: string;
  status: string;
  selected: boolean;
}

interface GenerateForm {
  category: string;
  count: number | null;
}

interface TicketCategory {
  name: string;
  price: number | null;
  count: number | null;
}

interface EventForm {
  name: string;
  categories: TicketCategory[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  activeTab = 'dashboard';
  showGenerateModal = false;
  showCreateEventModal = false;
  ticketIdToValidate = '';

  constructor(private eventService: EventService) {}

  ngOnInit(): void {
    this.loadFromLocalStorage();
    this.updateValidationTickets();
  }

  icons = {
    dashboard: 'dashboard.png',
    tickets: 'tickets.png',
    validation: 'validation.png',
    edit: 'edit.png',
    delete: 'delete.png',
    add: 'add.png',
    revenue: 'revenue.png',
    sales: 'sales.png',
    available: 'available.png',
    user: 'user.png',
    search: 'search.png',
    check: 'check.png',
  };

  categoryOptions = [
    { value: 'VVIP', label: 'VVIP' },
    { value: 'VIP', label: 'VIP' },
    { value: 'General', label: 'General' },
  ];

  priceOptions = [
    { value: 7500, label: 'LKR 7,500' },
    { value: 5000, label: 'LKR 5,000' },
    { value: 3500, label: 'LKR 3,500' },
  ];

  currentEvent: Event = {
    name: 'No Event Selected',
    id: '',
    totalCount: 0,
    limits: '',
  };

  dashboardStats: DashboardStats = {
    totalRevenue: 'LKR 0',
    ticketSales: 0,
    availableTickets: 0,
  };

  ticketStats: TicketStats = {
    sales: 0,
    available: 0,
  };

  validationStats: ValidationStats = {
    activeTickets: 0,
    participants: 0,
  };

  tickets: Ticket[] = [];
  validationTickets: Ticket[] = [];

  generateForm: GenerateForm = {
    category: '',
    count: null,
  };

  eventForm: EventForm = {
    name: '',
    categories: [{ name: '', price: null, count: null }],
  };

  registertedEventData: any = {};

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  openGenerateTicketModal(): void {
    this.showGenerateModal = true;
    this.resetGenerateForm();
  }

  closeGenerateModal(): void {
    this.showGenerateModal = false;
  }

  openCreateEventModal(): void {
    this.showCreateEventModal = true;
    this.resetEventForm();
  }

  closeCreateEventModal(): void {
    this.showCreateEventModal = false;
  }

  generateTickets(): void {
    if (
      this.generateForm.category &&
      this.generateForm.count &&
      this.generateForm.count > 0
    ) {
      const newTickets: Ticket[] = [];

      for (let i = 0; i < this.generateForm.count; i++) {
        newTickets.push({
          id: this.currentEvent.id,
          event: this.currentEvent.name,
          name: `Generated User ${this.tickets.length + i + 1}`,
          category: this.generateForm.category,
          status: 'Active',
          selected: false,
        });
      }

      this.tickets = [...this.tickets, ...newTickets];
      this.updateStats(this.generateForm.count);
      this.updateValidationTickets();
      this.saveToLocalStorage();
      this.closeGenerateModal();

      this.showSuccessMessage(
        `Successfully generated ${this.generateForm.count} ${this.generateForm.category} tickets!`
      );
    }
  }

  createEvent(): void {
    if (this.eventForm.name && this.eventForm.categories.length > 0) {
      const result = {
        categoryLimits: this.eventForm.categories.reduce(
          (acc: any, category: any) => {
            acc[category.price] = category.count;
            return acc;
          },
          {} as Record<string, number>
        ),
      };

      this.eventService
        .registerEvent(this.eventForm.name, this.generateEventId(), result)
        .subscribe({
          next: (data: any) => {
            this.registertedEventData = data;

            let totalCount = 0;
            const limits: string[] = [];

            this.eventForm.categories.forEach((category) => {
              if (category.name && category.count && category.count > 0) {
                totalCount += category.count;
                limits.push(`${category.name}(${category.count})`);
              }
            });

            if (totalCount > 0) {
              this.currentEvent = {
                name: this.registertedEventData.name,
                id: this.registertedEventData.eventId,
                totalCount: totalCount,
                limits: limits.join(','),
              };

              this.resetStatsForNewEvent(totalCount);
              this.clearTickets();
              this.saveToLocalStorage();
              this.closeCreateEventModal();
            }

            this.showSuccessMessage(
              `Successfully created event: ${this.eventForm.name}!`
            );
          },
          error: (error) => {
            console.log(error);
          },
        });
    }
  }

  isEventFormValid(): boolean {
    if (!this.eventForm.name.trim()) {
      return false;
    }

    return this.eventForm.categories.some(
      (category) =>
        category.name &&
        category.name.trim() &&
        category.price !== null &&
        category.price >= 0 &&
        category.count !== null &&
        category.count > 0
    );
  }

  addCategory(): void {
    this.eventForm.categories.push({
      name: '',
      price: null,
      count: null,
    });
  }

  removeCategory(index: number): void {
    if (this.eventForm.categories.length > 1) {
      this.eventForm.categories.splice(index, 1);
    }
  }

  deleteEvent(): void {
    if (this.confirmAction('Are you sure you want to delete this event?')) {
      this.currentEvent = {
        name: 'No Event Selected',
        id: '',
        totalCount: 0,
        limits: '',
      };
      this.resetStatsForNewEvent(0);
      this.clearTickets();
      this.saveToLocalStorage();
      this.showSuccessMessage('Event deleted successfully!');
    }
  }

  editEvent(): void {
    this.showInfoMessage(
      'Edit event functionality would open an edit modal here.'
    );
  }

  validateTicket(): void {
    if (this.ticketIdToValidate.trim()) {
      const found = this.tickets.find(
        (ticket) =>
          ticket.id.toLowerCase() ===
          this.ticketIdToValidate.toLowerCase().trim()
      );

      if (found) {
        this.showSuccessMessage(`Ticket ${this.ticketIdToValidate} is valid!`);
      } else {
        this.showErrorMessage(`Ticket ${this.ticketIdToValidate} not found!`);
      }

      this.ticketIdToValidate = '';
    }
  }

  onModalOverlayClick(event: any): void {
    if (event.target === event.currentTarget) {
      this.closeGenerateModal();
      this.closeCreateEventModal();
    }
  }

  selectAllTickets(): void {
    const allSelected = this.tickets.every((ticket) => ticket.selected);
    this.tickets.forEach((ticket) => (ticket.selected = !allSelected));
  }

  getSelectedTicketsCount(): number {
    return this.tickets.filter((ticket) => ticket.selected).length;
  }

  deleteSelectedTickets(): void {
    const selectedCount = this.getSelectedTicketsCount();
    if (
      selectedCount > 0 &&
      this.confirmAction(`Delete ${selectedCount} selected tickets?`)
    ) {
      this.tickets = this.tickets.filter((ticket) => !ticket.selected);
      this.updateValidationTickets();
      this.saveToLocalStorage();
      this.showSuccessMessage(`${selectedCount} tickets deleted successfully!`);
    }
  }

  trackByTicketId(index: number, ticket: Ticket): string {
    return ticket.id + ticket.name + ticket.category;
  }

  // === Private Methods ===

  private resetGenerateForm(): void {
    this.generateForm = {
      category: '',
      count: null,
    };
  }

  private resetEventForm(): void {
    this.eventForm = {
      name: '',
      categories: [{ name: '', price: null, count: null }],
    };
  }

  private updateStats(count: number): void {
    this.ticketStats.sales += count;
    this.dashboardStats.ticketSales += count;
    this.ticketStats.available = Math.max(
      0,
      this.ticketStats.available - count
    );
    this.dashboardStats.availableTickets = Math.max(
      0,
      this.dashboardStats.availableTickets - count
    );
  }

  private resetStatsForNewEvent(totalCount: number): void {
    this.dashboardStats = {
      totalRevenue: 'LKR 0',
      ticketSales: 0,
      availableTickets: totalCount,
    };

    this.ticketStats = {
      sales: 0,
      available: totalCount,
    };

    this.validationStats = {
      activeTickets: 0,
      participants: 0,
    };
  }

  private clearTickets(): void {
    this.tickets = [];
    this.validationTickets = [];
  }

  private updateValidationTickets(): void {
    this.validationTickets = this.tickets.slice(0, 4);
    this.validationStats.activeTickets = this.tickets.length;
    this.validationStats.participants = this.tickets.length;
  }

  private generateEventId(): string {
    return `EV${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  }

  private showSuccessMessage(message: string): void {
    alert(message);
  }

  private showErrorMessage(message: string): void {
    alert(message);
  }

  private showInfoMessage(message: string): void {
    alert(message);
  }

  private confirmAction(message: string): boolean {
    return confirm(message);
  }

  private saveToLocalStorage(): void {
    localStorage.setItem('currentEvent', JSON.stringify(this.currentEvent));
    localStorage.setItem('tickets', JSON.stringify(this.tickets));
    localStorage.setItem('dashboardStats', JSON.stringify(this.dashboardStats));
    localStorage.setItem('ticketStats', JSON.stringify(this.ticketStats));
  }

  private loadFromLocalStorage(): void {
    const event = localStorage.getItem('currentEvent');
    const tickets = localStorage.getItem('tickets');
    const dashboard = localStorage.getItem('dashboardStats');
    const stats = localStorage.getItem('ticketStats');

    if (event) this.currentEvent = JSON.parse(event);
    if (tickets) this.tickets = JSON.parse(tickets);
    if (dashboard) this.dashboardStats = JSON.parse(dashboard);
    if (stats) this.ticketStats = JSON.parse(stats);
  }
}
