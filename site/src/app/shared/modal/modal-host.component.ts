import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService, MODAL_DATA } from './modal.service';

@Component({
  selector: 'app-modal-host',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (modalSvc.isOpen()) {
      <div
        class="fixed top-0 left-0 z-[100] flex items-center justify-center w-screen h-screen bg-slate-300/20 backdrop-blur-sm"
        (click)="modalSvc.close()"
        >
        <div
          [ngClass]="{'bg-white':noBackdrop, 'bg-transparent': !noBackdrop}"
          class="flex max-h-[90vh] w-11/12 max-w-xl flex-col gap-6 overflow-hidden rounded p-6 text-slate-500 shadow-xl shadow-slate-700/10"
          (click)="$event.stopPropagation()"
          >
          @if (modalSvc.content(); as component) {
            @if (modalSvc.injector(); as inj) {
              <ng-container
                [ngComponentOutlet]="component"
                [ngComponentOutletInjector]="inj"
              ></ng-container>
            }
          }
        </div>
      </div>
    }
    `,
})
export class ModalHostComponent {
  constructor(public modalSvc: ModalService) {}
  private data = inject(MODAL_DATA, { optional: true });

  get noBackdrop(): boolean {
    if(this.data && this.data.hasOwnProperty('noBackdrop')){
      return false
    }
    return true;
    // return !!this.data?.noBackdrop;
  }
}
