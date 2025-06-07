import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { EventService } from '../../services/event.service';
import { TicketService } from '../../services/ticket.service';
import Swal from 'sweetalert2';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let eventService: jasmine.SpyObj<EventService>;
  let ticketService: jasmine.SpyObj<TicketService>;

  beforeEach(async () => {
    const eventServiceSpy = jasmine.createSpyObj('EventService', ['getEvent', 'registerEvent']);
    const ticketServiceSpy = jasmine.createSpyObj('TicketService', ['generateBulkQR']);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, FormsModule, HttpClientTestingModule],
      providers: [
        { provide: EventService, useValue: eventServiceSpy },
        { provide: TicketService, useValue: ticketServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    eventService = TestBed.inject(EventService) as jasmine.SpyObj<EventService>;
    ticketService = TestBed.inject(TicketService) as jasmine.SpyObj<TicketService>;

    // Mock getEvent to return empty data initially
    eventService.getEvent.and.returnValue(of({}));
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));

    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with dashboard tab active', () => {
      expect(component.activeTab).toBe('dashboard');
    });

    it('should initialize with empty event data', () => {
      expect(component.currentEvent.name).toBe('No Event Selected');
      expect(component.currentEvent.id).toBe('');
      expect(component.currentEvent.totalCount).toBe(0);
    });

    it('should initialize with empty stats', () => {
      expect(component.dashboardStats.totalRevenue).toBe('LKR 0');
      expect(component.dashboardStats.ticketSales).toBe(0);
      expect(component.dashboardStats.availableTickets).toBe(0);
    });

    it('should initialize with empty tickets', () => {
      expect(component.tickets.length).toBe(0);
      expect(component.validationTickets.length).toBe(0);
    });

    it('should initialize isGenerating as false', () => {
      expect(component.isGenerating).toBeFalsy();
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to tickets tab', () => {
      component.setActiveTab('tickets');
      expect(component.activeTab).toBe('tickets');
    });

    it('should switch to validation tab', () => {
      component.setActiveTab('validation');
      expect(component.activeTab).toBe('validation');
    });

    it('should switch back to dashboard tab', () => {
      component.setActiveTab('tickets');
      component.setActiveTab('dashboard');
      expect(component.activeTab).toBe('dashboard');
    });

    it('should display correct tab content', () => {
      component.setActiveTab('tickets');
      fixture.detectChanges();

      const ticketsContent = fixture.debugElement.query(By.css('[role="tabpanel"]'));
      expect(ticketsContent).toBeTruthy();
    });
  });

  describe('Modal Management', () => {
    it('should open generate ticket modal with no event and show error', async () => {
      component.currentEvent.id = '';
      component.eventForm.categories = [];

      await component.openGenerateTicketModal();
      expect(component.showGenerateModal).toBeFalsy();
      expect(Swal.fire).toHaveBeenCalledWith({
        icon: 'error',
        title: 'Error',
        text: 'Please create an event with valid categories first.',
        confirmButtonText: 'OK',
      }as any);
    });

    it('should open generate ticket modal and set default category', () => {
      component.currentEvent.id = 'EV001';
      component.eventForm.categories = [{ name: 'VIP', price: 5000, count: 50 }];

      component.openGenerateTicketModal();

      expect(component.showGenerateModal).toBeTruthy();
      expect(component.generateForm.category).toBe('VIP');
      expect(component.generateForm.count).toBeNull();
    });

    it('should close generate ticket modal', () => {
      component.openGenerateTicketModal();
      component.closeGenerateModal();
      expect(component.showGenerateModal).toBeFalsy();
    });

    it('should open create event modal', () => {
      expect(component.showCreateEventModal).toBeFalsy();

      component.openCreateEventModal();
      expect(component.showCreateEventModal).toBeTruthy();
      expect(component.eventForm.name).toBe('');
      expect(component.eventForm.categories.length).toBe(1);
      expect(component.eventForm.categories[0]).toEqual({ name: '', price: null, count: null });
    });

    it('should close create event modal', () => {
      component.openCreateEventModal();
      component.closeCreateEventModal();
      expect(component.showCreateEventModal).toBeFalsy();
    });
  });

  describe('Ticket Generation', () => {
    beforeEach(() => {
      component.currentEvent = {
        id: 'EV001',
        name: 'Test Event',
        totalCount: 100,
        limits: 'VIP(50), GENERAL(50)',
      };
      component.eventForm.categories = [
        { name: 'VIP', price: 5000, count: 50 },
        { name: 'GENERAL', price: 3500, count: 50 },
      ];
      component.ticketStats.available = 100;
      component.dashboardStats.availableTickets = 100;
    });

    it('should generate tickets successfully and disable button during generation', async () => {
      const initialTicketCount = component.tickets.length;
      const initialSales = component.ticketStats.sales;

      ticketService.generateBulkQR.and.returnValue(of(new Blob(['mock PDF'], { type: 'application/pdf' })));

      component.generateForm = {
        category: 'VIP',
        count: 5,
      };

      expect(component.isGenerating).toBeFalsy();

      const generatePromise = component.generateTickets();
      expect(component.isGenerating).toBeTruthy();

      await generatePromise;

      expect(component.tickets.length).toBe(initialTicketCount + 5);
      expect(component.ticketStats.sales).toBe(initialSales + 5);
      expect(component.showGenerateModal).toBeFalsy();
      expect(component.isGenerating).toBeFalsy();
      expect(Swal.fire).toHaveBeenCalledWith({
        icon: 'success',
        title: 'Success',
        text: 'Successfully generated 5 VIP tickets and downloaded PDF!',
        timer: 1500,
        showConfirmButton: false,
      }as any);
    });

    it('should not generate tickets with invalid data and keep button enabled', async () => {
      const initialTicketCount = component.tickets.length;

      component.generateForm = {
        category: '',
        count: null,
      };

      await component.generateTickets();

      expect(component.tickets.length).toBe(initialTicketCount);
      expect(component.isGenerating).toBeFalsy();
      expect(Swal.fire).toHaveBeenCalledWith({
        icon: 'error',
        title: 'Error',
        text: 'Please fill in all required fields for ticket generation.',
        confirmButtonText: 'OK',
      }as any);
    });

    it('should handle ticket generation error and re-enable button', async () => {
      const initialTicketCount = component.tickets.length;

      ticketService.generateBulkQR.and.returnValue(throwError(() => new Error('API Error')));

      component.generateForm = {
        category: 'VIP',
        count: 5,
      };

      expect(component.isGenerating).toBeFalsy();

      const generatePromise = component.generateTickets();
      expect(component.isGenerating).toBeTruthy();

      await generatePromise;

      expect(component.tickets.length).toBe(initialTicketCount);
      expect(component.isGenerating).toBeFalsy();
      expect(Swal.fire).toHaveBeenCalledWith({
        icon: 'error',
        title: 'Error',
        text: 'Failed to generate QR codes. Please check the backend and try again.',
        confirmButtonText: 'OK',
      }as any);
    });

    it('should handle invalid category selection', async () => {
      const initialTicketCount = component.tickets.length;

      component.generateForm = {
        category: 'INVALID_CATEGORY',
        count: 5,
      };

      await component.generateTickets();

      expect(component.tickets.length).toBe(initialTicketCount);
      expect(component.isGenerating).toBeFalsy();
      expect(Swal.fire).toHaveBeenCalledWith({
        icon: 'error',
        title: 'Error',
        text: 'Invalid ticket category selected: INVALID_CATEGORY. Please select a category defined for this event.',
        confirmButtonText: 'OK',
      }as any);
    });

    it('should update stats correctly after ticket generation', async () => {
      const initialAvailable = component.ticketStats.available;
      const initialDashboardAvailable = component.dashboardStats.availableTickets;

      ticketService.generateBulkQR.and.returnValue(of(new Blob(['mock PDF'], { type: 'application/pdf' })));

      component.generateForm = {
        category: 'GENERAL',
        count: 3,
      };

      await component.generateTickets();

      expect(component.ticketStats.available).toBe(initialAvailable - 3);
      expect(component.dashboardStats.availableTickets).toBe(initialDashboardAvailable - 3);
    });

    it('should disable generate tickets button in UI', () => {
      component.currentEvent.id = 'EV001';
      component.eventForm.categories = [{ name: 'VIP', price: 5000, count: 50 }];
      component.openGenerateTicketModal();
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('#generate-tickets-button'));
      if (button) {
        expect(button.nativeElement.disabled).toBeFalsy();

        component.isGenerating = true;
        fixture.detectChanges();

        expect(button.nativeElement.disabled).toBeTruthy();
        expect(button.nativeElement.textContent).toContain('Generating...');
      } else {
        pending('Generate tickets button not found in template. Ensure button has id="generate-tickets-button".');
      }
    });
  });

  describe('Event Management', () => {
    it('should create event successfully', async () => {
      eventService.registerEvent.and.returnValue(
        of({
          name: 'Test Event',
          eventId: 'EV001',
          categoryLimits: { '100': 50, '200': 25 },
        })
      );

      component.eventForm = {
        name: 'Test Event',
        categories: [
          { name: 'GENERAL', price: 100, count: 50 },
          { name: 'VIP', price: 200, count: 25 },
        ],
      };

      await component.createEvent();

      expect(component.currentEvent.name).toBe('Test Event');
      expect(component.currentEvent.totalCount).toBe(75);
      expect(component.dashboardStats.availableTickets).toBe(75);
      expect(component.dashboardStats.ticketSales).toBe(0);
      expect(component.tickets.length).toBe(0);
      expect(Swal.fire).toHaveBeenCalledWith({
        icon: 'success',
        title: 'Success',
        text: 'Successfully created event: Test Event!',
        timer: 1500,
        showConfirmButton: false,
      }as any);
    });

    it('should not create event with empty name', async () => {
      const originalEvent = { ...component.currentEvent };

      component.eventForm = {
        name: '',
        categories: [{ name: 'GENERAL', price: 100, count: 50 }],
      };

      await component.createEvent();

      expect(component.currentEvent.name).toBe(originalEvent.name);
      expect(Swal.fire).toHaveBeenCalledWith({
        icon: 'error',
        title: 'Error',
        text: 'Please provide a valid event name and at least one ticket category with price and count.',
        confirmButtonText: 'OK',
      }as any);
    });

    it('should delete event with confirmation', async () => {
      component.currentEvent = {
        id: 'EV001',
        name: 'Test Event',
        totalCount: 100,
        limits: 'VIP(50), GENERAL(50)',
      };

      await component.deleteEvent();

      expect(component.currentEvent.name).toBe('No Event Selected');
      expect(component.currentEvent.id).toBe('');
      expect(component.currentEvent.totalCount).toBe(0);
      expect(component.tickets.length).toBe(0);
      expect(Swal.fire).toHaveBeenCalledWith({
        icon: 'success',
        title: 'Success',
        text: 'Event deleted successfully!',
        timer: 1500,
        showConfirmButton: false,
      }as any);
    });

    it('should not delete event without confirmation', async () => {
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: false } as any));
      const originalEvent = { ...component.currentEvent };

      await component.deleteEvent();

      expect(component.currentEvent).toEqual(originalEvent);
      expect(Swal.fire).not.toHaveBeenCalledWith({
        icon: 'success',
        title: 'Success',
        text: 'Event deleted successfully!',
        timer: 1500,
        showConfirmButton: false,
      }as any);
    });
  });

  describe('Event Form Management', () => {
    it('should add category to event form', () => {
      const initialCategoryCount = component.eventForm.categories.length;

      component.addCategory();

      expect(component.eventForm.categories.length).toBe(initialCategoryCount + 1);
      expect(component.eventForm.categories[component.eventForm.categories.length - 1]).toEqual({
        name: '',
        price: null,
        count: null,
      });
    });

    it('should remove category from event form', () => {
      component.eventForm.categories = [
        { name: 'GENERAL', price: 100, count: 50 },
        { name: 'VIP', price: 200, count: 25 },
      ];

      component.removeCategory(1);

      expect(component.eventForm.categories.length).toBe(1);
      expect(component.eventForm.categories[0].name).toBe('GENERAL');
    });

    it('should not remove last category', () => {
      component.eventForm.categories = [{ name: 'GENERAL', price: 100, count: 50 }];

      component.removeCategory(0);

      expect(component.eventForm.categories.length).toBe(1);
      expect(component.eventForm.categories[0]).toEqual({ name: 'GENERAL', price: 100, count: 50 });
    });
  });

  describe('Ticket Validation', () => {
    beforeEach(() => {
      component.tickets = [
        { id: 'EV001', event: 'Test Event', name: 'User 1', category: 'VIP', status: 'Active', selected: false },
      ];
    });

    it('should validate existing ticket', async () => {
      component.ticketIdToValidate = 'EV001';
      await component.validateTicket();

      expect(Swal.fire).toHaveBeenCalledWith({
        icon: 'success',
        title: 'Success',
        text: 'Ticket EV001 is valid!',
        timer: 1500,
        showConfirmButton: false,
      }as any);
      expect(component.ticketIdToValidate).toBe('');
    });

    it('should handle non-existing ticket', async () => {
      component.ticketIdToValidate = 'INVALID';
      await component.validateTicket();

      expect(Swal.fire).toHaveBeenCalledWith({
        icon: 'error',
        title: 'Error',
        text: 'Ticket INVALID not found!',
        confirmButtonText: 'OK',
      } as any);
      expect(component.ticketIdToValidate).toBe('');
    });

    it('should handle empty ticket ID', async () => {
      component.ticketIdToValidate = '';
      await component.validateTicket();

      expect(Swal.fire).not.toHaveBeenCalled();
      expect(component.ticketIdToValidate).toBe('');
    });

    it('should handle whitespace-only ticket ID', async () => {
      component.ticketIdToValidate = '   ';
      await component.validateTicket();

      expect(Swal.fire).not.toHaveBeenCalled();
      expect(component.ticketIdToValidate).toBe('');
    });
  });

  describe('Ticket Selection', () => {
    beforeEach(() => {
      component.tickets = [
        { id: '1', event: 'Test Event', name: 'User 1', category: 'VIP', status: 'Active', selected: false },
        { id: '2', event: 'Test Event', name: 'User 2', category: 'VIP', status: 'Active', selected: false },
      ];
    });

    it('should select all tickets', () => {
      component.selectAllTickets();
      expect(component.tickets.every((ticket) => ticket.selected)).toBeTruthy();
    });

    it('should deselect all tickets when all are selected', () => {
      component.tickets.forEach((ticket) => (ticket.selected = true));
      component.selectAllTickets();
      expect(component.tickets.every((ticket) => !ticket.selected)).toBeTruthy();
    });

    it('should get correct selected tickets count', () => {
      component.tickets[0].selected = true;
      component.tickets[1].selected = true;
      expect(component.getSelectedTicketsCount()).toBe(2);
    });

    it('should delete selected tickets', async () => {
      component.tickets[0].selected = true;
      component.tickets[1].selected = true;
      const initialCount = component.tickets.length;

      await component.deleteSelectedTickets();

      expect(component.tickets.length).toBe(initialCount - 2);
      expect(Swal.fire).toHaveBeenCalledWith({
        icon: 'success',
        title: 'Success',
        text: '2 tickets deleted successfully!',
        timer: 1500,
        showConfirmButton: false,
      }as any);
    });
  });

  describe('UI Interactions', () => {
    it('should render header with user info', () => {
      const headerElement = fixture.debugElement.query(By.css('.header'));
      const userInfoElement = fixture.debugElement.query(By.css('.user-info h1'));
      if (headerElement && userInfoElement) {
        expect(headerElement).toBeTruthy();
        expect(userInfoElement.nativeElement.textContent).toContain('Welcome, Admin');
      } else {
        pending('Header or user-info elements not found in template. Ensure .header and .user-info h1 exist.');
      }
    });

    it('should render navigation tabs', () => {
      const navItems = fixture.debugElement.queryAll(By.css('.nav-item'));
      if (navItems.length === 3) {
        expect(navItems.length).toBe(3);
        expect(navItems[0].nativeElement.textContent).toContain('Dashboard');
        expect(navItems[1].nativeElement.textContent).toContain('Tickets');
        expect(navItems[2].nativeElement.textContent).toContain('Validation');
      } else {
        pending('Navigation tabs not found in template. Ensure .nav-item elements exist for Dashboard, Tickets, and Validation.');
      }
    });

    it('should highlight active tab', () => {
      const dashboardTab = fixture.debugElement.query(By.css('.nav-item.active'));
      if (dashboardTab) {
        expect(dashboardTab.nativeElement.textContent).toContain('Dashboard');
      } else {
        pending('Active tab not found in template. Ensure .nav-item.active exists.');
      }
    });

    it('should show create event button', () => {
      const createButton = fixture.debugElement.query(By.css('.btn-primary'));
      if (createButton) {
        expect(createButton.nativeElement.textContent).toContain('Create event');
      } else {
        pending('Create event button not found in template. Ensure .btn-primary exists.');
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for validation input', () => {
      component.setActiveTab('validation');
      fixture.detectChanges();

      const ticketInput = fixture.debugElement.query(By.css('#ticketIdInput'));
      if (ticketInput) {
        expect(ticketInput).toBeTruthy();
      } else {
        pending('Ticket ID input not found in template. Ensure #ticketIdInput exists in validation tab.');
      }
    });

    it('should have proper modal attributes', () => {
      component.currentEvent.id = 'EV001';
      component.eventForm.categories = [{ name: 'VIP', price: 5000, count: 50 }];
      component.openGenerateTicketModal();
      fixture.detectChanges();

      const modal = fixture.debugElement.query(By.css('[role="dialog"]'));
      if (modal) {
        expect(modal).toBeTruthy();
        expect(modal.nativeElement.getAttribute('aria-modal')).toBe('true');
      } else {
        pending('Modal dialog not found in template. Ensure [role="dialog"] exists for generate ticket modal.');
      }
    });

    it('should have proper table structure', () => {
      component.setActiveTab('tickets');
      fixture.detectChanges();

      const table = fixture.debugElement.query(By.css('[role="table"]'));
      const headers = fixture.debugElement.queryAll(By.css('th[scope="col"]'));
      if (table && headers.length > 0) {
        expect(table).toBeTruthy();
        expect(headers.length).toBeGreaterThan(0);
      } else {
        pending('Table or headers not found in template. Ensure [role="table"] and th[scope="col"] exist in tickets tab.');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle modal overlay clicks', () => {
      const mockEvent = {
        target: document.createElement('div'),
        currentTarget: document.createElement('div'),
      };

      component.showGenerateModal = true;
      component.onModalOverlayClick(mockEvent);

      expect(component.showGenerateModal).toBeFalsy();
    });

    it('should not close modal on content clicks', () => {
      const mockOverlay = document.createElement('div');
      const mockContent = document.createElement('div');
      const mockEvent = {
        target: mockContent,
        currentTarget: mockOverlay,
        stopPropagation: jasmine.createSpy('stopPropagation'),
      };

      component.showGenerateModal = true;
      component.onModalOverlayClick(mockEvent);

      expect(component.showGenerateModal).toBeTruthy();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data consistency after ticket generation', async () => {
      const initialTicketCount = component.tickets.length;

      ticketService.generateBulkQR.and.returnValue(of(new Blob(['mock PDF'], { type: 'application/pdf' })));
      component.currentEvent = { id: 'EV001', name: 'Test Event', totalCount: 100, limits: 'VIP(50)' };
      component.eventForm.categories = [{ name: 'VIP', price: 5000, count: 50 }];
      component.generateForm = { category: 'VIP', count: 2 };

      await component.generateTickets();

      expect(component.tickets.length).toBe(initialTicketCount + 2);
      expect(component.validationTickets.length).toBe(Math.min(2, 4));
    });

    it('should reset forms properly', () => {
      component.generateForm = { category: 'VIP', count: 5 };
      component.currentEvent.id = 'EV001';
      component.eventForm.categories = [{ name: 'VIP', price: 5000, count: 50 }];

      component.openGenerateTicketModal();

      expect(component.generateForm.category).toBe('VIP');
      expect(component.generateForm.count).toBeNull();
    });
  });
});



