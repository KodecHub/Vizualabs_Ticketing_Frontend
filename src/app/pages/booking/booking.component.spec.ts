import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BookingComponent } from './booking.component';

describe('BookingComponent', () => {
  let component: BookingComponent;
  let fixture: ComponentFixture<BookingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, BookingComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate convenience fee as 1% of ticket price per ticket', () => {
    component.ticketPrice = 3500;
    component.quantity = 2;
    expect(component.calculateConvenienceFee()).toBe(70); // 3500 * 2 * 0.01
  });

  it('should calculate total correctly with dynamic convenience fee', () => {
    component.ticketPrice = 3500;
    component.quantity = 2;
    const total = component.calculateTotal();
    expect(total).toBe(7070); // (3500 * 2) + (3500 * 2 * 0.01)
  });

  it('should decrease quantity but not below 1', () => {
    component.quantity = 3;
    component.decreaseQuantity();
    expect(component.quantity).toBe(2);
    
    component.quantity = 1;
    component.decreaseQuantity();
    expect(component.quantity).toBe(1);
  });

  it('should increase quantity', () => {
    component.quantity = 1;
    component.increaseQuantity();
    expect(component.quantity).toBe(2);
  });

  it('should update ticket price when selecting different ticket', () => {
    component.selectTicket('VIP');
    expect(component.ticketPrice).toBe(5000);
    
    component.selectTicket('VVIP');
    expect(component.ticketPrice).toBe(7500);
    
    component.selectTicket('GENERAL');
    expect(component.ticketPrice).toBe(3500);

    component.selectTicket('VVIP TABLE');
    expect(component.ticketPrice).toBe(75000);
  });
});