// https://github.com/microsoft/TypeScript/pull/12253#issuecomment-353494273
export function keys<T>(object: T): (keyof T)[] {
  return Object.keys(object) as (keyof T)[];
}
