import type { PaymentQrRow } from '@/lib/supabase/queries'

interface PaymentQrCardProps {
  qr: PaymentQrRow | null
}

export function PaymentQrCard({ qr }: PaymentQrCardProps) {
  if (!qr) return null

  return (
    <div className="rounded-xl border bg-card p-5 space-y-3 text-center">
      <h2 className="font-semibold text-left">ช่องทางรับเงิน</h2>
      {qr.bank_info && (
        <p className="text-sm text-muted-foreground">{qr.bank_info}</p>
      )}
      <img
        src={qr.qr_url}
        alt="QR Code รับเงิน"
        className="mx-auto w-48 h-48 object-contain rounded-lg border"
      />
      <p className="text-xs text-muted-foreground">สแกน QR เพื่อโอนเงิน</p>
    </div>
  )
}
