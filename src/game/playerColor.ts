export interface PlayerColor {
  id: string;
  name: string;
  hex: number;
  css: string;
}

export const PLAYER_COLORS: PlayerColor[] = [
  {
    id: 'default',
    name: 'DEFAULT',
    hex: 0x6f9e8b,
    css: '#6f9e8b',
  },
  {
    id: 'red',
    name: 'RED',
    hex: 0xff4d5e,
    css: '#ff4d5e',
  },
  {
    id: 'orange',
    name: 'ORANGE',
    hex: 0xff914d,
    css: '#ff914d',
  },
  {
    id: 'yellow',
    name: 'YELLOW',
    hex: 0xffe34d,
    css: '#ffe34d',
  },
  {
    id: 'lime',
    name: 'LIME',
    hex: 0xa8e64c,
    css: '#a8e64c',
  },
  {
    id: 'green',
    name: 'GREEN',
    hex: 0x4dff91,
    css: '#4dff91',
  },
  {
    id: 'cyan',
    name: 'CYAN',
    hex: 0x4de8ff,
    css: '#4de8ff',
  },
  {
    id: 'blue',
    name: 'BLUE',
    hex: 0x4d7cff,
    css: '#4d7cff',
  },
  {
    id: 'purple',
    name: 'PURPLE',
    hex: 0xb14dff,
    css: '#b14dff',
  },
  {
    id: 'pink',
    name: 'PINK',
    hex: 0xff4da6,
    css: '#ff4da6',
  },
  {
    id: 'brown',
    name: 'BROWN',
    hex: 0x9a6a4a,
    css: '#9a6a4a',
  },
  {
    id: 'white',
    name: 'WHITE',
    hex: 0xd9e6e1,
    css: '#d9e6e1',
  },
];

const STORAGE_KEY =
  'tagpole-player-color';

export function getPlayerColor(): PlayerColor {
  const savedId =
    localStorage.getItem(
      STORAGE_KEY
    );

  return getPlayerColorById(
    savedId ?? 'default'
  );
}

export function setPlayerColor(
  id: string
): PlayerColor {
  const color =
    getPlayerColorById(id);

  localStorage.setItem(
    STORAGE_KEY,
    color.id
  );

  return color;
}

export function getPlayerColorById(
  id: string
): PlayerColor {
  return (
    PLAYER_COLORS.find(
      (color: PlayerColor) =>
        color.id === id
    ) ??
    PLAYER_COLORS[0]
  );
}

export function isPlayerColorId(
  id: string
): boolean {
  return PLAYER_COLORS.some(
    (color: PlayerColor) =>
      color.id === id
  );
}