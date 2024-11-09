import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { Router } from '@angular/router';
import { account } from '../../lib/appwrite'; // Adjust the import according to your structure
import { of, throwError } from 'rxjs';

class MockRouter {
  navigate = jasmine.createSpy('navigate');
}

class MockAccount {
  get() {
    return Promise.resolve({}); // Mock user account
  }
  deleteSession() {
    return Promise.resolve();
  }
}

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let mockRouter: MockRouter;
  let mockAccount: MockAccount;

  beforeEach(async () => {
    mockRouter = new MockRouter();
    mockAccount = new MockAccount();

    await TestBed.configureTestingModule({
      declarations: [NavbarComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: account, useValue: mockAccount }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should check login status and set loggedInUser to true if user is logged in', async () => {
    await component.checkLoginStatus();
    expect(component.loggedInUser).toBeTrue();
  });

  it('should set loggedInUser to false if user is not logged in', async () => {
    spyOn(mockAccount, 'get').and.returnValue(Promise.reject('User not logged in'));
    await component.checkLoginStatus();
    expect(component.loggedInUser).toBeFalse();
  });

  it('should logout the user and navigate to home', async () => {
    await component.logout();
    expect(component.loggedInUser).toBeFalse();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should login the user and navigate to userlogin', async () => {
    await component.login();
    expect(component.loggedInUser).toBeTrue();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/userlogin']);
  });

  it('should toggle the menu state', () => {
    const initialMenuState = component.menuOpen;
    component.toggleMenu();
    expect(component.menuOpen).toBe(!initialMenuState);
  });
});
