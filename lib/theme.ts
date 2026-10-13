// Espelha DESIGN.md (Kotta "Jardim") e o src/theme.ts do app mobile.
const leaf = {
  mist: '#F1F4EE',
  field: '#DCEADF',
  line: '#DCE3DC',
  lineStrong: '#BFCBC1',
  muted: '#56665C',
  ink: '#18211C',
} as const;

const garden = {
  green: '#2F6B4F',
  greenDeep: '#234F3B',
  terracotta: '#A4492A',
  sandRose: '#F6E6DE',
  white: '#FFFFFF',
} as const;

export const colors = {
  primary: garden.green,
  primaryPressed: garden.greenDeep,
  field: garden.green,
  onField: garden.white,
  onFieldMuted: '#CFE3D5',
  onFieldDanger: '#FFD9CC',
  tonal: leaf.field,
  background: leaf.mist,
  surface: garden.white,
  onSurface: leaf.ink,
  onSurfaceMuted: leaf.muted,
  border: leaf.line,
  borderStrong: leaf.lineStrong,
  success: garden.green,
  successBg: leaf.field,
  danger: garden.terracotta,
  dangerBg: garden.sandRose,
  reviewBg: '#F3ECD8',
  review: '#6B5317',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  card: 16,
  control: 12,
  pill: 999,
  sweep: 96,
} as const;

// Cores de avatar; todas com iniciais brancas em contraste >= 4.5:1.
export const avatarColors = [
  '#2F6B4F',
  '#A4492A',
  '#3D5A80',
  '#7A5C1E',
  '#6B4C7A',
  '#2E6E6A',
  '#18211C',
  '#8A4F5C',
] as const;
