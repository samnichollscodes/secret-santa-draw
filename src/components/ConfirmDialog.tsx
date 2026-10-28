import { type ReactNode, useEffect, useId, useRef } from 'react'
import Button from './ui/Button'
import { buttonRow, cardTitle } from './ui/classes'
import { cn } from './ui/cn'

type ConfirmDialogProps = {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

// An on-page confirmation. We don't use window.confirm: some embedded and
// in-app browsers (e.g. links opened inside WhatsApp or Instagram) silently
// answer "Cancel" without ever showing it.
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const bodyId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // Start on the safe choice, so a stray Enter doesn't confirm.
      cancelRef.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-[min(440px,calc(100vw-32px))] rounded-[18px] bg-cream p-6 text-ink scheme-light shadow-dialog backdrop:bg-[rgb(5_18_13/0.7)]"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      // Escape key: treat it as cancelling.
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
    >
      <h2 id={titleId} className={cardTitle}>
        {title}
      </h2>
      <div id={bodyId} className="[&_p]:mb-3 [&_p]:leading-normal">
        {children}
      </div>
      <div className={cn(buttonRow, 'mt-2')}>
        <Button ref={cancelRef} variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </dialog>
  )
}
