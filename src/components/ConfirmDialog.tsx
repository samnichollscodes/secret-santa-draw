import { type ReactNode, useEffect, useId, useRef } from 'react'

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
      className="dialog"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      // Escape key: treat it as cancelling.
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
    >
      <h2 id={titleId} className="dialog__title">
        {title}
      </h2>
      <div id={bodyId} className="dialog__body">
        {children}
      </div>
      <div className="row row--end">
        <button ref={cancelRef} type="button" className="btn btn--ghost" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className="btn" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
