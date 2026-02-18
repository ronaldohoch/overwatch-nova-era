import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

@Component({
  selector: 'ow-overwatch-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
  template: `
    <div
      class="ow-loader-wrap"
      [class.inline-block]="inline()"
      [class.flex]="center()"
      [class.items-center]="center()"
      [class.justify-center]="center()"
      role="status"
      aria-live="polite"
    >
      <span class="sr-only">{{ ariaLabel() }}</span>

      <div
        class="ow-overwatch-loader"
        [style.--ow-loader-size]="size()"
        [style.--ow-loader-bg]="background()"
      >
        <!-- Logo -->
        <svg class="overwatch-logo" viewBox="0 0 750 750" aria-hidden="true" focusable="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" x="75" y="75">
            <defs>
              <linearGradient id="a">
                <stop offset="0" />
                <stop offset="1" stop-color="#fff" />
              </linearGradient>
            </defs>

            <path
              d="M296.704.004c-66.766.428-132.772 24.23-184.63 66.083l56.662 65.786c47.82-37.74 112.256-53.118 172.018-41.237 32.844 6.318 64.096 20.74 90.464 41.237l56.66-65.786C434.242 22.804 365.77-1.03 296.705.004z"
              color="#000"
              [attr.fill]="accentColor()"
              overflow="visible"
            />

            <path
              d="M93.628 82.253C33.924 138.343-1.082 219.877.026 302.123c.035 85.37 38.978 169.23 103.652 224.696 59.78 52.283 141.085 78.917 220.46 72.18 86.01-6.405 167.65-52.345 218.118-122.143 49.125-66.33 68.37-153.797 52.064-234.91-11.987-62.09-44.54-119.634-90.837-162.405l-56.662 65.786c45.657 43.034 70.586 106.557 65.886 169.224-2.056 31.05-11.074 61.69-26.314 88.96L370.92 291.974 312.66 166.39l-.088 190.18 116.695 112.926c-52.002 40.402-123.353 53.802-186.578 35.894-25.744-7.18-50.122-19.23-71.31-35.398L288.87 356.57c-.206-61.831.717-128.578 0-190.383L230.52 291.974 114.058 404.437c-35.53-62.024-36.38-142.21-2.182-204.927 10.69-20.092 24.84-38.428 41.257-54.182L96.47 79.542l-2.842 2.71z"
              color="#000"
              [attr.fill]="ringColor()"
              overflow="visible"
            />
          </svg>
        </svg>

        <!-- Rings -->
        <svg class="circular" viewBox="0 0 750 750" aria-hidden="true" focusable="false">
          <circle class="path" cx="375" cy="375" r="325" [attr.stroke]="accentColor()" fill="none" />
        </svg>

        <svg class="circular2" viewBox="0 0 750 750" aria-hidden="true" focusable="false">
          <circle class="path2" cx="375" cy="375" r="360" [attr.stroke]="ringColor()" fill="none" />
        </svg>

        <svg class="circular2" viewBox="0 0 750 750" aria-hidden="true" focusable="false">
          <circle class="path3" cx="375" cy="375" r="360" [attr.stroke]="ringColor()" fill="none" />
        </svg>
      </div>
    </div>
  `,
  styles: [
    `
      .ow-loader-wrap {
        width: 100%;
      }

      /* Container (equivalente ao .overwatch-loader do pen) */
      .ow-overwatch-loader {
        width: var(--ow-loader-size, 25%);
        aspect-ratio: 1 / 1;
        position: relative;
        margin: 0 auto;
        background: var(--ow-loader-bg, transparent);
      }

      .overwatch-logo {
        filter: drop-shadow(0 0 120px rgba(255, 255, 255, 0.15))
          drop-shadow(0 0 16px rgba(255, 255, 255, 0.05));
      }

      .circular,
      .circular2 {
        height: 100%;
        transform-origin: center center;
        width: 100%;
        position: absolute;
        inset: 0;
        margin: auto;
      }

      .circular {
        animation: rotate 2s linear infinite;
      }

      .circular2 {
        animation: rotate-reverse 4s linear infinite;
      }

      .path,
      .path2,
      .path3 {
        stroke-linecap: square;
        stroke-width: 22;
      }

      .path {
        stroke-dasharray: 20, 2600;
        stroke-dashoffset: 0;
        animation: dash 1.5s ease-in-out infinite;
      }

      .path2 {
        stroke-dasharray: 200, 2600;
        stroke-dashoffset: 0;
      }

      .path3 {
        stroke-dasharray: 200, 2600;
        stroke-dashoffset: 1700;
      }

      @keyframes rotate {
        100% {
          transform: rotate(360deg);
        }
      }

      @keyframes rotate-reverse {
        100% {
          transform: rotate(-360deg);
        }
      }

      @keyframes dash {
        0% {
          stroke-dasharray: 20, 2600;
          stroke-dashoffset: 0;
        }
        50% {
          stroke-dasharray: 2100, 2600;
          stroke-dashoffset: -800px;
        }
        100% {
          stroke-dasharray: 2100, 2600;
          stroke-dashoffset: -2000px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .circular,
        .circular2,
        .path {
          animation: none !important;
        }
      }
    `,
  ],
})
export class OwOverwatchLoaderComponent {
  /** Ex: '25%', '240px', '18rem' */
  readonly size = input<string>('25%');

  /** Centraliza com flex no wrapper */
  readonly center = input(false, { transform: booleanAttribute });

  /** Se true, não força block (bom pra usar inline em botões/etc) */
  readonly inline = input(false, { transform: booleanAttribute });

  /** Acessibilidade */
  readonly ariaLabel = input<string>('Carregando');

  /** Cores (pode passar var(--ow-orange) etc) */
  readonly accentColor = input<string>('#fa9c1e');
  readonly ringColor = input<string>('#ffffff');

  /** Fundo opcional só do “quadrado” do loader (não mexe no body) */
  readonly background = input<string>('transparent');
}
