export const SERVING_TIMES = [
  'breakfast',
  'lunch',
  'supper',
  'snack',
  'dessert',
  'any',
] as const;

export type ServingTime = (typeof SERVING_TIMES)[number];

export const DEFAULT_SERVING_TIME: ServingTime = 'any';
