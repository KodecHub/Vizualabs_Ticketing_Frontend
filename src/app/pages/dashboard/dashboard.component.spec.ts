import { type ComponentFixture, TestBed } from "@angular/core/testing"
import { FormsModule } from "@angular/forms"
import { By } from "@angular/platform-browser"

import { DashboardComponent } from "./dashboard.component"

describe("DashboardComponent", () => {
  let component: DashboardComponent
  let fixture: ComponentFixture<DashboardComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent, FormsModule],
    }).compileComponents()

    fixture = TestBed.createComponent(DashboardComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  describe("Component Initialization", () => {
    it("should create", () => {
      expect(component).toBeTruthy()
    })

    it("should initialize with dashboard tab active", () => {
      expect(component.activeTab).toBe("dashboard")
    })

    it("should initialize with default event data", () => {
      expect(component.currentEvent.name).toBe("Wenas Nights")
      expect(component.currentEvent.id).toBe("EV001")
      expect(component.currentEvent.totalCount).toBe(600)
    })

    it("should initialize with default stats", () => {
      expect(component.dashboardStats.totalRevenue).toBe("LKR 152,000")
      expect(component.dashboardStats.ticketSales).toBe(121)
      expect(component.dashboardStats.availableTickets).toBe(322)
    })

    it("should initialize with sample tickets", () => {
      expect(component.tickets.length).toBe(6)
      expect(component.validationTickets.length).toBe(4)
    })
  })

  describe("Tab Navigation", () => {
    it("should switch to tickets tab", () => {
      component.setActiveTab("tickets")
      expect(component.activeTab).toBe("tickets")
    })

    it("should switch to validation tab", () => {
      component.setActiveTab("validation")
      expect(component.activeTab).toBe("validation")
    })

    it("should switch back to dashboard tab", () => {
      component.setActiveTab("tickets")
      component.setActiveTab("dashboard")
      expect(component.activeTab).toBe("dashboard")
    })

    it("should display correct tab content", () => {
      component.setActiveTab("tickets")
      fixture.detectChanges()

      const ticketsContent = fixture.debugElement.query(By.css('[role="tabpanel"]'))
      expect(ticketsContent).toBeTruthy()
    })
  })

  describe("Modal Management", () => {
    it("should open generate ticket modal", () => {
      expect(component.showGenerateModal).toBeFalsy()

      component.openGenerateTicketModal()
      expect(component.showGenerateModal).toBeTruthy()
      expect(component.generateForm.category).toBe("")
      expect(component.generateForm.count).toBeNull()
    })

    it("should close generate ticket modal", () => {
      component.openGenerateTicketModal()
      component.closeGenerateModal()
      expect(component.showGenerateModal).toBeFalsy()
    })

    it("should open create event modal", () => {
      expect(component.showCreateEventModal).toBeFalsy()

      component.openCreateEventModal()
      expect(component.showCreateEventModal).toBeTruthy()
      expect(component.eventForm.name).toBe("")
      expect(component.eventForm.categories.length).toBe(1)
    })

    it("should close create event modal", () => {
      component.openCreateEventModal()
      component.closeCreateEventModal()
      expect(component.showCreateEventModal).toBeFalsy()
    })
  })

  describe("Ticket Generation", () => {
    beforeEach(() => {
      spyOn(window, "alert")
    })

    it("should generate tickets successfully", () => {
      const initialTicketCount = component.tickets.length
      const initialSales = component.ticketStats.sales

      component.generateForm = {
        category: "VIP",
        count: 5,
      }

      component.generateTickets()

      expect(component.tickets.length).toBe(initialTicketCount + 5)
      expect(component.ticketStats.sales).toBe(initialSales + 5)
      expect(component.showGenerateModal).toBeFalsy()
      expect(window.alert).toHaveBeenCalledWith("Successfully generated 5 VIP tickets!")
    })

    it("should not generate tickets with invalid data", () => {
      const initialTicketCount = component.tickets.length

      component.generateForm = {
        category: "",
        count: null,
      }

      component.generateTickets()

      expect(component.tickets.length).toBe(initialTicketCount)
      expect(window.alert).not.toHaveBeenCalled()
    })

    it("should update stats correctly after ticket generation", () => {
      const initialAvailable = component.ticketStats.available
      const initialDashboardAvailable = component.dashboardStats.availableTickets

      component.generateForm = {
        category: "General",
        count: 3,
      }

      component.generateTickets()

      expect(component.ticketStats.available).toBe(initialAvailable - 3)
      expect(component.dashboardStats.availableTickets).toBe(initialDashboardAvailable - 3)
    })
  })

  describe("Event Management", () => {
    beforeEach(() => {
      spyOn(window, "alert")
    })

    it("should create event successfully", () => {
      component.eventForm = {
        name: "Test Event",
        categories: [
          { name: "General", price: 100, count: 50 },
          { name: "VIP", price: 200, count: 25 },
        ],
      }

      component.createEvent()

      expect(component.currentEvent.name).toBe("Test Event")
      expect(component.currentEvent.totalCount).toBe(75)
      expect(component.dashboardStats.availableTickets).toBe(75)
      expect(component.dashboardStats.ticketSales).toBe(0)
      expect(component.tickets.length).toBe(0)
      expect(window.alert).toHaveBeenCalledWith("Successfully created event: Test Event!")
    })

    it("should not create event with empty name", () => {
      const originalEvent = { ...component.currentEvent }

      component.eventForm = {
        name: "",
        categories: [{ name: "General", price: 100, count: 50 }],
      }

      component.createEvent()

      expect(component.currentEvent.name).toBe(originalEvent.name)
      expect(window.alert).not.toHaveBeenCalled()
    })

    it("should delete event with confirmation", () => {
      spyOn(window, "confirm").and.returnValue(true)

      component.deleteEvent()

      expect(window.confirm).toHaveBeenCalledWith("Are you sure you want to delete this event?")
      expect(component.currentEvent.name).toBe("No Event Selected")
      expect(window.alert).toHaveBeenCalledWith("Event deleted successfully!")
    })

    it("should not delete event without confirmation", () => {
      spyOn(window, "confirm").and.returnValue(false)
      const originalEventName = component.currentEvent.name

      component.deleteEvent()

      expect(component.currentEvent.name).toBe(originalEventName)
      expect(window.alert).not.toHaveBeenCalledWith("Event deleted successfully!")
    })
  })

  describe("Event Form Management", () => {
    it("should add category to event form", () => {
      const initialCategoryCount = component.eventForm.categories.length

      component.addCategory()

      expect(component.eventForm.categories.length).toBe(initialCategoryCount + 1)
      expect(component.eventForm.categories[component.eventForm.categories.length - 1]).toEqual({
        name: "",
        price: null,
        count: null,
      })
    })

    it("should remove category from event form", () => {
      component.eventForm.categories = [
        { name: "General", price: 100, count: 50 },
        { name: "VIP", price: 200, count: 25 },
      ]

      component.removeCategory(1)

      expect(component.eventForm.categories.length).toBe(1)
      expect(component.eventForm.categories[0].name).toBe("General")
    })

    it("should not remove last category", () => {
      component.eventForm.categories = [{ name: "General", price: 100, count: 50 }]

      component.removeCategory(0)

      expect(component.eventForm.categories.length).toBe(1)
    })
  })

  describe("Ticket Validation", () => {
    beforeEach(() => {
      spyOn(window, "alert")
    })

    it("should validate existing ticket", () => {
      component.ticketIdToValidate = "EV001"
      component.validateTicket()

      expect(window.alert).toHaveBeenCalledWith("Ticket EV001 is valid!")
      expect(component.ticketIdToValidate).toBe("")
    })

    it("should handle non-existing ticket", () => {
      component.ticketIdToValidate = "INVALID"
      component.validateTicket()

      expect(window.alert).toHaveBeenCalledWith("Ticket INVALID not found!")
      expect(component.ticketIdToValidate).toBe("")
    })

    it("should handle empty ticket ID", () => {
      component.ticketIdToValidate = ""
      component.validateTicket()

      expect(window.alert).not.toHaveBeenCalled()
    })

    it("should handle whitespace-only ticket ID", () => {
      component.ticketIdToValidate = "   "
      component.validateTicket()

      expect(window.alert).not.toHaveBeenCalled()
    })
  })

  describe("Ticket Selection", () => {
    it("should select all tickets", () => {
      component.tickets.forEach((ticket) => (ticket.selected = false))

      component.selectAllTickets()

      expect(component.tickets.every((ticket) => ticket.selected)).toBeTruthy()
    })

    it("should deselect all tickets when all are selected", () => {
      component.tickets.forEach((ticket) => (ticket.selected = true))

      component.selectAllTickets()

      expect(component.tickets.every((ticket) => !ticket.selected)).toBeTruthy()
    })

    it("should get correct selected tickets count", () => {
      component.tickets[0].selected = true
      component.tickets[1].selected = true

      expect(component.getSelectedTicketsCount()).toBe(2)
    })

    it("should delete selected tickets", () => {
      spyOn(window, "confirm").and.returnValue(true)
      spyOn(window, "alert")

      component.tickets[0].selected = true
      component.tickets[1].selected = true
      const initialCount = component.tickets.length

      component.deleteSelectedTickets()

      expect(component.tickets.length).toBe(initialCount - 2)
      expect(window.alert).toHaveBeenCalledWith("2 tickets deleted successfully!")
    })
  })

  describe("UI Interactions", () => {
    it("should render header with user info", () => {
      const headerElement = fixture.debugElement.query(By.css(".header"))
      const userInfoElement = fixture.debugElement.query(By.css(".user-info h1"))

      expect(headerElement).toBeTruthy()
      expect(userInfoElement.nativeElement.textContent).toContain("Welcome, Admin")
    })

    it("should render navigation tabs", () => {
      const navItems = fixture.debugElement.queryAll(By.css(".nav-item"))

      expect(navItems.length).toBe(3)
      expect(navItems[0].nativeElement.textContent).toContain("Dashboard")
      expect(navItems[1].nativeElement.textContent).toContain("Tickets")
      expect(navItems[2].nativeElement.textContent).toContain("Validation")
    })

    it("should highlight active tab", () => {
      const dashboardTab = fixture.debugElement.query(By.css(".nav-item.active"))

      expect(dashboardTab.nativeElement.textContent).toContain("Dashboard")
    })

    it("should show create event button", () => {
      const createButton = fixture.debugElement.query(By.css(".btn-primary"))

      expect(createButton.nativeElement.textContent).toContain("Create event")
    })
  })

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      component.setActiveTab("validation")
      fixture.detectChanges()

      const ticketInput = fixture.debugElement.query(By.css("#ticketIdInput"))
      expect(ticketInput).toBeTruthy()
    })

    it("should have proper modal attributes", () => {
      component.openGenerateTicketModal()
      fixture.detectChanges()

      const modal = fixture.debugElement.query(By.css('[role="dialog"]'))
      expect(modal).toBeTruthy()
      expect(modal.nativeElement.getAttribute("aria-modal")).toBe("true")
    })

    it("should have proper table structure", () => {
      component.setActiveTab("tickets")
      fixture.detectChanges()

      const table = fixture.debugElement.query(By.css('[role="table"]'))
      const headers = fixture.debugElement.queryAll(By.css('th[scope="col"]'))

      expect(table).toBeTruthy()
      expect(headers.length).toBeGreaterThan(0)
    })
  })

  describe("Error Handling", () => {
    it("should handle modal overlay clicks", () => {
      const mockEvent = {
        target: document.createElement("div"),
        currentTarget: document.createElement("div"),
      }

      component.showGenerateModal = true
      component.onModalOverlayClick(mockEvent)

      expect(component.showGenerateModal).toBeFalsy()
    })

    it("should not close modal on content clicks", () => {
      const mockOverlay = document.createElement("div")
      const mockContent = document.createElement("div")

      const mockEvent = {
        target: mockContent,
        currentTarget: mockOverlay,
        stopPropagation: jasmine.createSpy("stopPropagation"),
      }

      component.showGenerateModal = true
      component.onModalOverlayClick(mockEvent)

      // Should remain open since target !== currentTarget
      expect(component.showGenerateModal).toBeTruthy()
    })
  })

  describe("Data Integrity", () => {
    it("should maintain data consistency after operations", () => {
      const initialTicketCount = component.tickets.length

      // Generate tickets
      component.generateForm = { category: "VIP", count: 2 }
      component.generateTickets()

      expect(component.tickets.length).toBe(initialTicketCount + 2)
      expect(component.validationTickets.length).toBe(4) // Should be updated
    })

    it("should reset forms properly", () => {
      component.generateForm = { category: "VIP", count: 5 }
      component.openGenerateTicketModal()

      expect(component.generateForm.category).toBe("")
      expect(component.generateForm.count).toBeNull()
    })
  })
})
