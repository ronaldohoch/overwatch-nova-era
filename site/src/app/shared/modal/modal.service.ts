import { Injectable, Injector, Type, EnvironmentInjector, inject, signal } from '@angular/core';
import { ModalRef } from './modal-ref';

import { InjectionToken } from '@angular/core';

export const MODAL_DATA = new InjectionToken<any>('MODAL_DATA');

@Injectable({ providedIn: 'root' })
export class ModalService {
  private _isOpen = signal(false);
  isOpen = this._isOpen.asReadonly();

  private _content = signal<Type<any> | null>(null);
  content = this._content.asReadonly();

  private _injector = signal<Injector | null>(null);
  injector = this._injector.asReadonly();

  private _modalRef?: ModalRef<any>;

  private envInjector = inject(EnvironmentInjector);

  open<T, R = any>(component: Type<T>, data?: any): ModalRef<R> {
    this._modalRef = new ModalRef<R>();

    const modalRef = this._modalRef;
    const injector = Injector.create({
      providers: [
        { provide: ModalRef, useValue: modalRef },
        { provide: MODAL_DATA, useValue: data },
      ],
      parent: this.envInjector,
    });

    this._content.set(component);
    this._injector.set(injector);
    this._isOpen.set(true);

    modalRef.afterClosed().then(() => {
      this._isOpen.set(false);
      this._content.set(null);
      this._injector.set(null);
    });

    return modalRef;
  }

  close() {
    this._modalRef?.close(null);
  }
}
