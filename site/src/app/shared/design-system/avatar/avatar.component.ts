import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type OwAvatarColor = 'orange' | 'blue' | 'green' | 'red' | 'gray';
export type OwRoleBadge = 'tank' | 'damage' | 'support' | 'flex';

const COLOR_MAP: Record<OwAvatarColor, string> = {
  orange: 'bg-[#f06314]',
  blue: 'bg-[#00c3ff]',
  green: 'bg-[#34a853]',
  red: 'bg-[#ea4335]',
  gray: 'bg-[#f1f3f4] text-[#5f6368] text-[0.7rem]',
};

/* ─── Avatar Individual ─── */
@Component({
  selector: 'ow-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="classes()">
      @if (src()) {
        <img [src]="src()" [alt]="initials()" class="w-full h-full object-cover rounded-full" />
      } @else {
        {{ initials() }}
      }
    </div>
  `,
  host: { class: 'contents' },
})
export class AvatarComponent {
  readonly initials = input('?');
  readonly src = input<string | undefined>(undefined);
  readonly color = input<OwAvatarColor>('orange');
  /** quando true, aplica margem negativa para avatar-group */
  readonly grouped = input(false);

  readonly classes = computed(() => {
    const colorCls = COLOR_MAP[this.color()] ?? COLOR_MAP.orange;
    const margin = this.grouped() ? '-ml-[10px] first:ml-0' : '';
    return [
      'w-11 h-11 rounded-full border-2 border-white',
      'flex items-center justify-center',
      'font-extrabold text-[0.78rem] text-white shrink-0',
      colorCls,
      margin,
    ]
      .filter(Boolean)
      .join(' ');
  });
}

/* ─── Avatar Group ─── */
@Component({
  selector: 'ow-avatar-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="flex"><ng-content /></div>`,
  host: { class: 'contents' },
})
export class AvatarGroupComponent {}

/* ─── Player Avatar (com borda laranja) ─── */
@Component({
  selector: 'ow-player-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="w-14 h-14 rounded-full border-2 border-[#f06314] bg-[#f1f3f4] flex items-center justify-center font-extrabold text-[#f06314] text-[1.2rem]"
    >
      @if (src()) {
        <img [src]="src()" [alt]="initials()" class="w-full h-full object-cover rounded-full" />
      } @else {
        {{ initials() }}
      }
    </div>
  `,
  host: { class: 'contents' },
})
export class PlayerAvatarComponent {
  readonly initials = input('?');
  readonly src = input<string | undefined>(undefined);
}

/* ─── Role Badge ─── */
@Component({
  selector: 'ow-role-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="classes()"><ng-content /></span>`,
  host: { class: 'contents' },
})
export class RoleBadgeComponent {
  readonly role = input.required<OwRoleBadge>();

  private readonly ROLE_VARIANTS: Record<OwRoleBadge, string> = {
    tank: 'bg-[#00c3ff] text-white',
    damage: 'bg-[#ea4335] text-white',
    support: 'bg-[#34a853] text-white',
    flex: 'bg-[#fbbc04] text-[#202124]',
  };

  readonly classes = computed(
    () =>
      `inline-flex items-center py-[3px] px-[10px] text-[0.68rem] font-extrabold uppercase tracking-[0.1em] rounded-[2px] ${this.ROLE_VARIANTS[this.role()]}`,
  );
}
