import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { CheckInsComponent } from './check-ins.component';

describe('CheckInsComponent', () => {
  let component: CheckInsComponent;
  let fixture: ComponentFixture<CheckInsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckInsComponent],
      providers: [provideHttpClientTesting()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckInsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
