// Joins class lists, skipping any that are switched off:
//   cn('px-4', isActive && 'bg-berry')
// Biome is told about `cn` (biome.jsonc → tailwind.mergeFunctions), so its
// Tailwind rules check every class string passed to it, including the shared
// constants in ./classes.ts that are wrapped in it for that reason.
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
