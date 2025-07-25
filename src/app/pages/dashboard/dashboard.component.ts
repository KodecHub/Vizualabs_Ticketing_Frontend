import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { EventService } from '../../services/event.service';
import { TicketService } from '../../services/ticket.service';
import Swal from 'sweetalert2';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';

// Interfaces for type safety
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
  quantity?: number;
  seatRange?: string;
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
  imports: [CommonModule, FormsModule, ZXingScannerModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  BarcodeFormat = BarcodeFormat;
  isGenerating = false; // Fixed syntax error

  // UI state
  activeTab = 'dashboard';
  showGenerateModal = false;
  showCreateEventModal = false;
  ticketIdToValidate = '';

  // QR Scanner state
  isScanning = false;
  availableDevices: MediaDeviceInfo[] = [];
  selectedDevice?: MediaDeviceInfo;

  // Dependencies
  constructor(
    private eventService: EventService,
    private ticketService: TicketService
  ) {}

  ngOnInit(): void {
    this.loadEventData();
    this.updateValidationTickets();
  }

  // Icon paths (adjust as needed)
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

  // Category options for createEvent modal
  categoryOptions = [
    { value: 'VVIP_TABLE', label: 'VVIP TABLE' },
    { value: 'VVIP', label: 'VVIP' },
    { value: 'VIP', label: 'VIP' },
    { value: 'GENERAL', label: 'GENERAL' },
  ];

  // Price options for createEvent modal
  priceOptions = [
    { value: 75000, label: 'LKR 75,000' },
    { value: 7500, label: 'LKR 7,500' },
    { value: 5000, label: 'LKR 5,000' },
    { value: 3500, label: 'LKR 3,500' },
  ];

  // Current event state
  currentEvent: Event = {
    name: 'No Event Selected',
    id: '',
    totalCount: 0,
    limits: '',
  };

  // Dashboard statistics
  dashboardStats: DashboardStats = {
    totalRevenue: 'LKR 0',
    ticketSales: 0,
    availableTickets: 0,
  };

  // Ticket statistics
  ticketStats: TicketStats = {
    sales: 0,
    available: 0,
  };

  // Validation statistics
  validationStats: ValidationStats = {
    activeTickets: 0,
    participants: 0,
  };

  // Ticket lists
  tickets: Ticket[] = [];
  validationTickets: Ticket[] = [];
  ticketDetails: any = null;

  // Ticket generation form
  generateForm: GenerateForm = {
    category: '',
    count: null,
  };

  // Event creation form
  eventForm: EventForm = {
    name: '',
    categories: [{ name: '', price: null, count: null }],
  };

  // Store registered event data
  registertedEventData: any = {};

  // Normalize category names to prevent mismatches
  private normalizeCategoryName(name: string): string {
    return name.toUpperCase().replace(' ', '_');
  }

  // Map price to category name
  private getCategoryNameByPrice(price: number): string {
    switch (price) {
      case 75000:
        return 'VVIP_TABLE';
      case 7500:
        return 'VVIP';
      case 5000:
        return 'VIP';
      case 3500:
        return 'GENERAL';
      default:
        return '';
    }
  }

  // Sync eventForm.categories with current event
  private syncCategories(): void {
    if (this.currentEvent.id && this.registertedEventData?.categoryLimits) {
      this.eventForm.categories = Object.entries(
        this.registertedEventData.categoryLimits
      ).map(([price, count]) => ({
        name: this.getCategoryNameByPrice(Number(price)),
        price: Number(price),
        count: Number(count),
      }));
    } else {
      // Fallback to categoryOptions if no event data
      this.eventForm.categories = this.categoryOptions.map((option) => ({
        name: option.value,
        price:
          this.priceOptions.find((p) => p.label.includes(option.value))
            ?.value || null,
        count: null,
      }));
    }
    // Normalize category names
    this.eventForm.categories = this.eventForm.categories.map((category) => ({
      ...category,
      name: this.normalizeCategoryName(category.name),
    }));
  }

  // Load event data on initialization
  private loadEventData(): void {
    const eventId = 'EV001'; // Hardcoded for demo; adjust as needed
    this.eventService.getEvent(eventId).subscribe({
      next: (data) => {
        if (data) {
          this.registertedEventData = data;
          this.currentEvent = {
            name: data.name,
            id: data.eventId,
            totalCount: Object.values(data.categoryLimits).reduce(
              (sum: number, count: unknown) => sum + Number(count),
              0
            ),
            limits: Object.entries(data.categoryLimits)
              .map(
                ([price, count]) =>
                  `${this.getCategoryNameByPrice(Number(price))} (${count})`
              )
              .join(', '),
          };
          this.syncCategories();
          this.dashboardStats = {
            totalRevenue: 'LKR 0',
            ticketSales: Object.values(data.categorySoldTickets || {}).reduce(
              (sum: number, count: unknown) => sum + Number(count),
              0
            ),
            availableTickets:
              this.currentEvent.totalCount - this.dashboardStats.ticketSales,
          };
          this.ticketStats = {
            sales: this.dashboardStats.ticketSales,
            available: this.dashboardStats.availableTickets,
          };
        }
      },
      error: (error) => {
        console.error('Error fetching event data:', error);
        this.showErrorMessage('Failed to load event data. Please try again.');
      },
    });
  }

  // Set active tab
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Open ticket generation modal
  openGenerateTicketModal(): void {
    if (this.currentEvent.id === '' || this.eventForm.categories.length === 0) {
      this.showErrorMessage(
        'Please create an event with valid categories first.'
      );
      return;
    }
    this.showGenerateModal = true;
    this.resetGenerateForm();
    // Set default category
    const firstValidCategory = this.eventForm.categories.find(
      (cat) => cat.name && cat.price !== null
    );
    if (firstValidCategory) {
      this.generateForm.category = firstValidCategory.name;
    }
  }

  // Close ticket generation modal
  closeGenerateModal(): void {
    this.showGenerateModal = false;
  }

  // Open create event modal
  openCreateEventModal(): void {
    this.showCreateEventModal = true;
    this.resetEventForm();
  }

  // Close create event modal
  closeCreateEventModal(): void {
    this.showCreateEventModal = false;
  }

  // Generate tickets and call backend
  generateTickets(): void {
    if (
      this.generateForm.category &&
      this.generateForm.count &&
      this.generateForm.count > 0 &&
      this.currentEvent.id
    ) {
      this.isGenerating = true; // Disable the button
      const normalizedCategory = this.normalizeCategoryName(
        this.generateForm.category
      );

      const selectedCategory = this.eventForm.categories.find(
        (cat) => cat.name === normalizedCategory
      );

      if (!selectedCategory || selectedCategory.price === null) {
        this.showErrorMessage(
          `Invalid ticket category selected: ${this.generateForm.category}. Please select a category defined for this event.`
        );
        this.isGenerating = false; // Re-enable button on validation failure
        return;
      }

      const eventId = this.currentEvent.id;
      const count = this.generateForm.count;
      const category = selectedCategory.price;

      this.ticketService.generateBulkQR(eventId, count, category).subscribe({
        next: (response: Blob) => {
          const url = window.URL.createObjectURL(response);
          const a = document.createElement('a');
          a.href = url;
          a.download = `bulk_qr_codes_${eventId}_${category}_${new Date().toISOString()}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

          const newTickets: Ticket[] = [];
          for (let i = 0; i < count; i++) {
            newTickets.push({
              id: `${eventId}_${Date.now()}_${i}`,
              event: this.currentEvent.name,
              name: `Generated User ${this.tickets.length + i + 1}`,
              category: normalizedCategory,
              status: 'Active',
              selected: false,
              quantity: 1, // Set quantity to 1 for generated tickets
            });
          }

          this.tickets = [...this.tickets, ...newTickets];
          this.updateStats(count);
          this.updateValidationTickets();
          this.updateStatsAfterChange();
          this.closeGenerateModal();

          this.showSuccessMessage(
            `Successfully generated ${count} ${normalizedCategory} tickets and downloaded PDF!`
          );
          this.isGenerating = false; // Re-enable button on success
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error generating QR codes:', error);
          const errorMessage =
            typeof error.error === 'object' && error.error?.message
              ? error.error.message
              : 'Failed to generate QR codes. Please check the backend and try again.';
          this.showErrorMessage(errorMessage);
          this.isGenerating = false; // Re-enable button on error
        },
      });
    } else {
      this.showErrorMessage(
        'Please fill in all required fields for ticket generation.'
      );
      this.isGenerating = false; // Ensure button is re-enabled if validation fails
    }
  }

  // Create a new event
  createEvent(): void {
    if (this.eventForm.name && this.isEventFormValid()) {
      const normalizedCategories = this.eventForm.categories.map(
        (category) => ({
          name: this.normalizeCategoryName(category.name),
          price: category.price,
          count: category.count,
        })
      );

      const result = {
        categoryLimits: normalizedCategories.reduce(
          (acc: Record<string, number>, category) => {
            if (category.price !== null && category.count !== null) {
              acc[category.price.toString()] = category.count;
            }
            return acc;
          },
          {}
        ),
      };

      this.eventService
        .registerEvent(this.eventForm.name, 'EV001', result)
        .subscribe({
          next: (data: any) => {
            this.registertedEventData = data;
            let totalCount = 0;
            const limits: string[] = [];

            normalizedCategories.forEach((category) => {
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
                limits: limits.join(', '),
              };
              this.syncCategories();
              this.resetStatsForNewEvent(totalCount);
              this.clearTickets();
              this.closeCreateEventModal();
            }

            console.log(
              'After createEvent, eventForm.categories:',
              this.eventForm.categories
            );
            this.showSuccessMessage(
              `Successfully created event: ${this.eventForm.name}!`
            );
          },
          error: (error) => {
            console.error('Error creating event:', error);
            this.showErrorMessage('Failed to create event. Please try again.');
          },
        });
    } else {
      this.showErrorMessage(
        'Please provide a valid event name and at least one ticket category with price and count.'
      );
    }
  }

  // Validate event form
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

  // Add a new category to eventForm
  addCategory(): void {
    this.eventForm.categories.push({
      name: '',
      price: null,
      count: null,
    });
  }

  // Remove a category from eventForm
  removeCategory(index: number): void {
    if (this.eventForm.categories.length > 1) {
      this.eventForm.categories.splice(index, 1);
    }
  }

  // Delete the current event
  deleteEvent(): void {
    this.confirmAction('Are you sure you want to delete this event?').then(
      (confirmed) => {
        if (confirmed) {
          this.currentEvent = {
            name: 'No Event Selected',
            id: '',
            totalCount: 0,
            limits: '',
          };
          this.eventForm.categories = [{ name: '', price: null, count: null }];
          this.registertedEventData = {};
          this.resetStatsForNewEvent(0);
          this.clearTickets();
          this.showSuccessMessage('Event deleted successfully!');
        }
      }
    );
  }

  // Placeholder for edit event
  editEvent(): void {
    this.showInfoMessage(
      'Edit event functionality would open an edit modal here.'
    );
  }

  // Validate a ticket by ID
  validateTicket(ticketId: string): void {
    if (ticketId) {
      this.ticketService.validateAndUseTicket(ticketId).subscribe({
        next: (response: any) => {
          if (response.valid) {
            // Fetch ticket details
            this.ticketService.getTicketById(ticketId).subscribe({
              next: (ticketDetails: any) => {
                // Check if ticket is already in the list
                const existingIndex = this.validationTickets.findIndex(
                  (t) => t.id === ticketId
                );
                const ticketObj = {
                  id: response.ticketId,
                  event: ticketDetails.eventId,
                  name: ticketDetails.name,
                  category: ticketDetails.category,
                  status: response.status,
                  selected: false,
                  quantity: ticketDetails.quantity,
                  seatRange: response.seatRange, // Add seat range from validation response
                };
                if (existingIndex === -1) {
                  this.validationTickets.push(ticketObj);
                } else {
                  // Update status and seat range if already present
                  this.validationTickets[existingIndex].status =
                    response.status;
                  this.validationTickets[existingIndex].seatRange =
                    response.seatRange;
                }
                this.updateStatsAfterChange();

                // Show success message with seat range if available
                let successMessage = `Ticket ID: ${response.ticketId} is valid!\nRemaining Quantity: ${response.remainingQuantity}`;
                if (response.seatRange) {
                  successMessage += `\nSeat Range: ${response.seatRange}`;
                }
                this.showSuccessMessage(successMessage);
              },
              error: () => {
                this.showErrorMessage('Could not fetch ticket details.');
              },
            });
          } else {
            this.showErrorMessage(
              response.message ||
                `Ticket ${ticketId} is invalid or already used!`
            );
          }
        },
        error: (error: any) => {
          this.showErrorMessage(
            `Error validating ticket: ${error.message || 'Unknown error'}`
          );
        },
      });
    }
  }

  // Handle modal overlay click
  onModalOverlayClick(event: any): void {
    if (event.target === event.currentTarget) {
      this.closeGenerateModal();
      this.closeCreateEventModal();
    }
  }

  // Select all tickets
  selectAllTickets(): void {
    const allSelected = this.tickets.every((ticket) => ticket.selected);
    this.tickets.forEach((ticket) => (ticket.selected = !allSelected));
  }

  // Get count of selected tickets
  getSelectedTicketsCount(): number {
    return this.tickets.filter((ticket) => ticket.selected).length;
  }

  // Delete selected tickets
  deleteSelectedTickets(): void {
    const selectedCount = this.getSelectedTicketsCount();
    if (selectedCount > 0) {
      this.confirmAction(`Delete ${selectedCount} selected tickets?`).then(
        (confirmed) => {
          if (confirmed) {
            this.tickets = this.tickets.filter((ticket) => !ticket.selected);
            this.updateValidationTickets();
            this.showSuccessMessage(
              `${selectedCount} tickets deleted successfully!`
            );
          }
        }
      );
    }
  }

  // Track tickets for *ngFor
  trackByTicketId(index: number, ticket: Ticket): string {
    return ticket.id + ticket.name + ticket.category;
  }

  // Reset ticket generation form
  private resetGenerateForm(): void {
    this.generateForm = {
      category: '',
      count: null,
    };
  }

  // Reset event creation form
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
    const totalSold = this.tickets.reduce(
      (sum, t) => sum + (t.quantity || 1),
      0
    );
    const totalValidated = this.validationTickets.reduce(
      (sum, t) => sum + (t.quantity || 1),
      0
    );
    this.validationStats.activeTickets = totalSold - totalValidated;
    this.validationStats.participants = totalValidated;
  }

  updateStatsAfterChange() {
    const totalSold = this.tickets.reduce(
      (sum, t) => sum + (t.quantity || 1),
      0
    );
    const totalValidated = this.validationTickets.reduce(
      (sum, t) => sum + (t.quantity || 1),
      0
    );
    this.validationStats.activeTickets = totalSold - totalValidated;
    this.validationStats.participants = totalValidated;
  }

  // --- QR Scanner Methods ---

  toggleScanner(): void {
    if (this.isScanning) {
      this.stopScanner();
    } else {
      this.startScanner();
    }
  }

  startScanner(): void {
    this.isScanning = true;
  }

  stopScanner(): void {
    this.isScanning = false;
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    // Select rear camera if available
    const rearCamera = devices.find((device) =>
      /back|rear|environment/gi.test(device.label)
    );
    this.selectedDevice = rearCamera || devices[0];
  }

  onCodeResult(resultString: string): void {
    let ticketIds: string[] = [];

    try {
      // Try to parse as JSON array
      const parsed = JSON.parse(resultString);
      if (Array.isArray(parsed)) {
        ticketIds = parsed;
      } else if (typeof parsed === 'string') {
        ticketIds = [parsed];
      } else if (parsed.ticketId) {
        ticketIds = [parsed.ticketId];
      }
    } catch (e) {
      // Not JSON, try delimited
      if (resultString.includes('|')) {
        ticketIds = resultString.split('|');
      } else {
        ticketIds = [resultString.replace(/^"|"$/g, '')];
      }
    }

    // Validate each ticket ID
    ticketIds.forEach((ticketId) => {
      this.validateTicket(ticketId.trim());
    });
    this.stopScanner(); 
  }

  private async showSuccessMessage(message: string): Promise<void> {
    await Swal.fire({
      icon: 'success',
      title: 'Success',
      html: message.replace(/\n/g, '<br>'), // Use html and convert newlines to <br>
      showConfirmButton: true,
      confirmButtonText: 'Close',
    });
  }

  private async showErrorMessage(message: string): Promise<void> {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      confirmButtonText: 'OK',
    });
  }

  private async showInfoMessage(message: string): Promise<void> {
    await Swal.fire({
      icon: 'info',
      title: 'Info',
      text: message,
      confirmButtonText: 'OK',
    });
  }

  private async confirmAction(message: string): Promise<boolean> {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirm',
      text: message,
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    });
    return result.isConfirmed;
  }

  // Add this method to be called after booking a ticket (from booking response)
  addBookedTicketToDashboard(response: any) {
    const newTicket = {
      id: response.ticketId,
      event: response.eventId,
      name: response.name,
      category: response.category,
      status: response.status,
      selected: false,
      quantity: response.quantity,
      seatRange: response.seatRange, // Add seat range from booking response
    };
    this.tickets.push(newTicket);
    this.updateStatsAfterChange();
  }
}
