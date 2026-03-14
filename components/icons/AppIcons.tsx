/**
 * Custom SVG icon components for AmuseMe.
 * All paths use fill="currentColor" so they respond to Tailwind text-* classes.
 * Size via className: e.g. "h-5 w-auto" (icons are not square, so w-auto preserves aspect ratio).
 */

interface IconProps {
  className?: string
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 57 49" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M26.9756 0.518555C27.8742 -0.172686 29.1258 -0.172661 30.0244 0.518555L56.0244 20.5186C57.1187 21.3604 57.3233 22.9301 56.4815 24.0244C55.6396 25.1186 54.0699 25.3232 52.9756 24.4814L51 22.9609V46.5C51 47.8807 49.8807 49 48.5 49H8.50001C7.11934 49 6.00001 47.8807 6.00001 46.5V22.9609L4.02443 24.4814C2.93009 25.3232 1.36042 25.1187 0.518569 24.0244C-0.323183 22.9301 -0.118606 21.3604 0.9756 20.5186L12 12.0381V2.5C12 1.11931 13.1193 4.2005e-05 14.5 0C15.8807 0 17 1.11929 17 2.5V8.19141L26.9756 0.518555ZM34 21C31.9168 21 30.25 22.227 29 23.8633C27.75 22.227 26.0833 21 24 21C21.5 21 19 22.6365 19 25.9092C19.0001 31.6364 27.3334 37.3636 29 39C30.6667 37.3636 38.9999 31.6364 39 25.9092C39 22.6365 36.5 21 34 21Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function LibraryIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 60 54" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22 0C22.5304 0 23.039 0.210865 23.4141 0.585938C23.7891 0.96101 24 1.46957 24 2V50H27V8C27 6.89543 27.8954 6 29 6H43C44.1046 6 45 6.89543 45 8V50H49V12C49 10.8954 49.8954 10 51 10H54C55.1046 10 56 10.8954 56 12V50H59C59.5523 50 60 50.8954 60 52C60 53.1046 59.5523 54 59 54H1C0.447715 54 0 53.1046 0 52C0 50.8954 0.447715 50 1 50H3V2C3 1.46957 3.21086 0.96101 3.58594 0.585938C3.96101 0.210865 4.46957 0 5 0H22ZM9 49H17V41H9V49ZM31 49H41V41H31V49ZM9.5 24C8.67157 24 8 24.6716 8 25.5C8 26.3284 8.67157 27 9.5 27H16.5C17.3284 27 18 26.3284 18 25.5C18 24.6716 17.3284 24 16.5 24H9.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function AddIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M39 0C46.1797 0 52 5.8203 52 13V39C52 46.1797 46.1797 52 39 52H13C5.8203 52 0 46.1797 0 39V13C0 5.8203 5.8203 0 13 0H39ZM26 12C24.3431 12 23 13.3431 23 15V22H16C14.3431 22 13 23.3431 13 25C13 26.6569 14.3431 28 16 28H23V35C23 36.6569 24.3431 38 26 38C27.6569 38 29 36.6569 29 35V28H36C37.6569 28 39 26.6569 39 25C39 23.3431 37.6569 22 36 22H29V15C29 13.3431 27.6569 12 26 12Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function GoalIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path
        d="M27 13C30.8228 13 34.287 14.5329 36.8135 17.0166L26.9365 27.6016L23.1934 23.5898C22.0631 22.3785 20.1646 22.3131 18.9531 23.4434C17.7421 24.5737 17.6766 26.4713 18.8066 27.6826L24.7441 34.0469C25.3115 34.6548 26.1059 35 26.9375 35C27.7691 35 28.5635 34.6548 29.1309 34.0469L40.1631 22.2227C40.7043 23.7135 41 25.3222 41 27C41 34.732 34.732 41 27 41C19.268 41 13 34.732 13 27C13 19.268 19.268 13 27 13Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M27 0C41.9117 0 54 12.0883 54 27C54 41.9117 41.9117 54 27 54C12.0883 54 0 41.9117 0 27C0 12.0883 12.0883 0 27 0ZM27 6C15.402 6 6 15.402 6 27C6 38.598 15.402 48 27 48C38.598 48 48 38.598 48 27C48 15.402 38.598 6 27 6Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function HeartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 44" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path
        d="M24 44C20 40 0 26 0 12C0 4 6 0 12 0C17 0 21 3 24 7C27 3 31 0 36 0C42 0 48 4 48 12C48 26 28 40 24 44Z"
        fill="currentColor"
      />
    </svg>
  )
}
