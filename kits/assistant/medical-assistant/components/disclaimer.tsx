import { AlertTriangle } from "lucide-react"

export function Disclaimer() {
    return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Medical Disclaimer:</strong> This tool provides general medical information only.
                It is <strong>NOT</strong> a substitute for professional medical advice, diagnosis, or treatment.
                Always seek the advice of a qualified healthcare provider with any questions regarding a medical condition.
            </p>
        </div>
    )
}

export function MiniDisclaimer() {
    return (
        <p className="text-xs text-muted-foreground mt-2 italic opacity-70">
            ⚕️ This is general information only — please consult a healthcare professional for personal medical advice.
        </p>
    )
}
