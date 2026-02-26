import { NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  DestroyRef,
  QueryList,
  TemplateRef,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

let tabsInstanceCounter = 0;

@Component({
  selector: 'app-tab, ow-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabs.item.component.html',
})
export class TabsItemComponent {
  readonly label = input.required<string>();
  readonly id = input<string | undefined>(undefined);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly tabClass = input('');
  readonly panelClass = input('');

  readonly panelTemplate = viewChild.required<TemplateRef<unknown>>('panelTemplate');
}

@Component({
  selector: 'app-tabs, ow-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './tabs.component.html',
  host: {
    class: 'block w-full',
  },
})
export class TabsComponent implements AfterContentInit {
  @ContentChildren(TabsItemComponent) private readonly projectedTabs!: QueryList<TabsItemComponent>;

  private readonly destroyRef = inject(DestroyRef);
  private readonly instanceId = `ow-tabs-${++tabsInstanceCounter}`;
  private readonly tabsState = signal<readonly TabsItemComponent[]>([]);
  readonly activeIndex = signal(0);

  readonly tabs = computed(() => this.tabsState());
  readonly hasTabs = computed(() => this.tabs().length > 0);
  readonly activeTab = computed(() => this.tabs()[this.activeIndex()] ?? null);

  readonly tablistClass = [
    'border-b-2 border-[color:var(--ow-gray-200)]',
    'flex gap-0',
    'overflow-x-auto',
  ].join(' ');

  readonly tabButtonBaseClass = [
    'py-[14px] px-6',
    'text-[0.82rem] font-extrabold uppercase tracking-[0.1em]',
    'cursor-pointer',
    'border-b-[3px] border-b-transparent',
    '-mb-0.5',
    'transition-all duration-200 ease-out',
    'bg-transparent border-t-0 border-l-0 border-r-0',
    '[font-family:inherit]',
    'shrink-0 whitespace-nowrap',
    'focus-visible:outline-none',
    'focus-visible:ring-2 focus-visible:ring-[color:var(--ow-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-white',
  ].join(' ');

  readonly tabButtonActiveClass = 'text-[color:var(--ow-orange)] border-b-[color:var(--ow-orange)]';
  readonly tabButtonInactiveClass = 'text-[color:var(--ow-gray-500)] hover:text-[color:var(--ow-orange)]';
  readonly tabButtonDisabledClass =
    'opacity-40 cursor-not-allowed hover:text-[color:var(--ow-gray-500)]';

  readonly panelBaseClass = 'py-6 text-[0.9rem] text-[color:var(--ow-gray-600)]';

  ngAfterContentInit(): void {
    this.syncTabs();

    this.projectedTabs.changes
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncTabs());
  }

  tabButtonId(index: number): string {
    const tab = this.tabs()[index];
    const customId = tab?.id()?.trim();
    const suffix = customId ? this.normalizeToken(customId) : String(index);
    return `${this.instanceId}-tab-${suffix}`;
  }

  panelId(index: number): string {
    const tab = this.tabs()[index];
    const customId = tab?.id()?.trim();
    const suffix = customId ? this.normalizeToken(customId) : String(index);
    return `${this.instanceId}-panel-${suffix}`;
  }

  isActive(index: number): boolean {
    return this.activeIndex() === index;
  }

  tabIndex(index: number): 0 | -1 {
    return this.isActive(index) ? 0 : -1;
  }

  tabButtonClass(index: number, tab: TabsItemComponent): string {
    const stateClass = this.isActive(index) ? this.tabButtonActiveClass : this.tabButtonInactiveClass;
    const disabledClass = tab.disabled() ? this.tabButtonDisabledClass : '';
    const extraClass = tab.tabClass().trim();

    return [this.tabButtonBaseClass, stateClass, disabledClass, extraClass].filter(Boolean).join(' ');
  }

  panelClass(tab: TabsItemComponent): string {
    const extraClass = tab.panelClass().trim();
    return extraClass ? `${this.panelBaseClass} ${extraClass}` : this.panelBaseClass;
  }

  selectTab(index: number): void {
    const tab = this.tabs()[index];
    if (!tab || tab.disabled()) return;
    this.activeIndex.set(index);
  }

  onTabKeydown(event: KeyboardEvent, currentIndex: number): void {
    const key = event.key;

    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      this.selectTab(currentIndex);
      return;
    }

    const firstEnabled = this.firstEnabledIndex();
    if (firstEnabled === -1) return;

    let targetIndex = -1;

    if (key === 'ArrowRight') targetIndex = this.findNextEnabledIndex(currentIndex, 1);
    if (key === 'ArrowLeft') targetIndex = this.findNextEnabledIndex(currentIndex, -1);
    if (key === 'Home') targetIndex = firstEnabled;
    if (key === 'End') targetIndex = this.lastEnabledIndex();

    if (targetIndex === -1) return;

    event.preventDefault();
    this.activeIndex.set(targetIndex);
    this.focusTab(targetIndex);
  }

  private syncTabs(): void {
    this.tabsState.set(this.projectedTabs.toArray());
    this.ensureValidActiveIndex();
  }

  private ensureValidActiveIndex(): void {
    const tabs = this.tabs();
    if (tabs.length === 0) {
      this.activeIndex.set(0);
      return;
    }

    const firstEnabled = this.firstEnabledIndex();
    if (firstEnabled === -1) {
      this.activeIndex.set(0);
      return;
    }

    const current = this.activeIndex();
    if (current < 0 || current >= tabs.length || tabs[current]?.disabled()) {
      this.activeIndex.set(firstEnabled);
    }
  }

  private findNextEnabledIndex(from: number, direction: 1 | -1): number {
    const tabs = this.tabs();
    if (tabs.length === 0) return -1;

    let cursor = from;

    for (let i = 0; i < tabs.length; i += 1) {
      cursor += direction;
      if (cursor >= tabs.length) cursor = 0;
      if (cursor < 0) cursor = tabs.length - 1;
      if (!tabs[cursor]?.disabled()) return cursor;
    }

    return -1;
  }

  private firstEnabledIndex(): number {
    return this.tabs().findIndex((tab) => !tab.disabled());
  }

  private lastEnabledIndex(): number {
    const tabs = this.tabs();
    for (let i = tabs.length - 1; i >= 0; i -= 1) {
      if (!tabs[i]?.disabled()) return i;
    }
    return -1;
  }

  private focusTab(index: number): void {
    if (typeof document === 'undefined') return;

    queueMicrotask(() => {
      const target = document.getElementById(this.tabButtonId(index));
      if (target instanceof HTMLButtonElement) target.focus();
    });
  }

  private normalizeToken(value: string): string {
    const normalized = value
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return normalized || 'tab';
  }
}
