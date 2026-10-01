import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function make(paths: string, fill = false) {
  return function Icon({ size = 20, ...rest }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={fill ? 'currentColor' : 'none'}
        stroke={fill ? 'none' : 'currentColor'}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        {...rest}
      >
        <path d={paths} />
      </svg>
    );
  };
}

export const IconStar = make('M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z', true);
export const IconPin = make('M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21zM12 7a2.5 2.5 0 100 5 2.5 2.5 0 000-5z');
export const IconCalendar = make('M5.5 5h13a2 2 0 012 2v11a2 2 0 01-2 2h-13a2 2 0 01-2-2V7a2 2 0 012-2zM3.5 10h17M8 3v4M16 3v4');
export const IconUsers = make('M10 4.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM3.5 20v-1.5A3.5 3.5 0 017 15h6a3.5 3.5 0 013.5 3.5V20M16 4.6a3.5 3.5 0 010 6.8M20.5 20v-1.5a3.5 3.5 0 00-2.5-3.3');
export const IconGear = make('M6 4a2 2 0 100 4 2 2 0 000-4zM12 4a2 2 0 100 4 2 2 0 000-4zM18 4a2 2 0 100 4 2 2 0 000-4zM6 16a2 2 0 100 4 2 2 0 000-4zM12 16a2 2 0 100 4 2 2 0 000-4zM6 8v8M12 8v8M18 8v4H6');
export const IconFuel = make('M4 20V5a2 2 0 012-2h6a2 2 0 012 2v15M3 20h12M4 10h10M14 8l3 3v6a1.5 1.5 0 003 0V9l-3-3');
export const IconDoor = make('M4 20V10l6-6h10v16zM4 12h16M14 15h2');
export const IconRoad = make('M6 20L10 4M18 20L14 4M12 6v2M12 11v2M12 16v2');
export const IconFlagStart = make('M5 21V4M5 4h13l-2.5 4L18 12H5M9.3 4v8M13.6 4v8M5 8h11.5');
export const IconFlagEnd = make('M5 21V4M5 4h13l-2.5 4L18 12H5');
export const IconCheck = make('M5 12.5l4.5 4.5L19 7.5');
export const IconX = make('M6 6l12 12M18 6L6 18');
export const IconInfo = make('M12 3a9 9 0 100 18 9 9 0 000-18zM12 11v5M12 8h.01');
export const IconClock = make('M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2');
export const IconTimer = make('M12 5a8 8 0 100 16 8 8 0 000-16zM12 9v4l2.5 2M9.5 2.5h5');
export const IconExternal = make('M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5');
export const IconAlert = make('M12 3l9.5 17h-19zM12 10v4M12 17h.01');
export const IconShield = make('M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6zM8.5 12l2.5 2.5 4.5-4.5');
export const IconBolt = make('M13 3L5 13.5h6L10 21l8-10.5h-6z');
export const IconLink = make('M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1');
export const IconMoney = make('M12 3a9 9 0 100 18 9 9 0 000-18zM15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.6-.6-3-1.6M12 6.5v11');
export const IconChevronLeft = make('M15 6l-6 6 6 6');
export const IconChevronRight = make('M9 6l6 6-6 6');
export const IconSearch = make('M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4');
export const IconPlug = make('M9 3v5M15 3v5M6 8h12v3a6 6 0 01-12 0zM12 17v4');
export const IconStop = make('M12 3a9 9 0 100 18 9 9 0 000-18zM9 9l6 6M15 9l-6 6');
export const IconQuestion = make('M12 3a9 9 0 100 18 9 9 0 000-18zM9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.2M12 17h.01');
export const IconExtension = make('M4 12h12M12 6l6 6-6 6M20 5v14');
export const IconCar = make('M3 15.5v-3.5l2.5-5h11l3.5 5h1v3.5h-1.5M7 14.5a2 2 0 100 4 2 2 0 000-4zM17 14.5a2 2 0 100 4 2 2 0 000-4zM9 16.5h6M4 12h17');

export function Isotipo({ size = 20 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 43.236 49.5" width={size} height={size * 1.145} aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M20.7,20.014l0.001,3.975c0,1.087-0.881,1.968-1.967,1.968c-1.087,0-1.968-0.881-1.968-1.968l-0.001-9.099 c0-1.087,0.881-1.968,1.967-1.968l9.099-0.002c1.087,0,1.968,0.881,1.968,1.968s-0.881,1.968-1.968,1.968l-4.769,0.001 l11.551,12.859c3.435-2.929,5.62-7.281,5.62-12.15c0-8.823-7.152-15.975-15.975-15.975H5.356v0.006 c-1.517,0-3.314,1.389-3.314,3.425l0,0v9.395l19.696,21.926l-0.001-3.975c0-1.087,0.881-1.968,1.967-1.968 c1.087,0,1.968,0.881,1.968,1.968l0.001,9.099c0,1.087-0.881,1.968-1.967,1.968l-9.099,0.002c-1.087,0-1.968-0.881-1.968-1.968 c0-1.087,0.881-1.968,1.967-1.968l4.769-0.001L2.042,20.203v24.795L2.048,45c0.058,1.705,1.357,3.093,3.024,3.288l0.4,0.025l0,0 h0.001h32.953h0.001c1.895,0,3.431-1.536,3.431-3.431c0-1.218-0.78-2.177-0.78-2.177C41.047,42.668,20.7,20.014,20.7,20.014z"
      />
    </svg>
  );
}
