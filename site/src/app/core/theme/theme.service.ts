import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export type OwTheme = 'light' | 'dark';

/** Tema padrao do site: escuro, por conta da identidade da STG. */
export const DEFAULT_THEME: OwTheme = 'dark';

const STORAGE_KEY = 'ow-theme';

const THEME_COLOR: Record<OwTheme, string> = {
  dark: '#111111',
  light: '#ffffff',
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly _theme = signal<OwTheme>(this.readInitialTheme());

  readonly theme = this._theme.asReadonly();
  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    effect(() => this.applyTheme(this._theme()));
  }

  toggle(): void {
    this.set(this._theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: OwTheme): void {
    this._theme.set(theme);
  }

  /**
   * No servidor nao existe localStorage, entao o SSR sempre renderiza o
   * padrao. O script inline do index.html corrige antes do primeiro paint.
   */
  private readInitialTheme(): OwTheme {
    if (!this.isBrowser) return DEFAULT_THEME;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // localStorage pode estar bloqueado (aba anonima, cookies desativados)
    }

    return DEFAULT_THEME;
  }

  private applyTheme(theme: OwTheme): void {
    this.document.documentElement.setAttribute('data-theme', theme);

    if (!this.isBrowser) return;

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // persistencia e opcional; o tema da sessao continua valendo
    }

    const meta = this.document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', THEME_COLOR[theme]);
  }
}
