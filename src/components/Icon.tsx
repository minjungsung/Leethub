import React from 'react'

type IconName = 'code' | 'settings' | 'arrow' | 'repository' | 'check' | 'lock'
const paths: Record<IconName, React.ReactNode> = {
  code: <><path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18" /></>,
  settings: <><path d="m9 3-.6 2.2-1.9 1.1-2.2-.6-2 3.4 1.6 1.6v2.2l-1.6 1.6 2 3.4 2.2-.6 1.9 1.1L9 21h4l.6-2.2 1.9-1.1 2.2.6 2-3.4-1.6-1.6v-2.2l1.6-1.6-2-3.4-2.2.6-1.9-1.1L13 3Z" /><circle cx="11" cy="12" r="3" /></>,
  arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
  repository: <><path d="M5 4h14v16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 0v12m-2 2a2 2 0 0 1 2-2h14M9 8h6" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  lock: <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>
}
export default function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return <svg className={`icon ${className}`} width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.7' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>{paths[name]}</svg>
}
