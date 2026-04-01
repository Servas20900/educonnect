import { useRef, useState } from 'react'

/**
 * @param {Object} props
 * @param {(file: File) => void} props.onFile
 * @param {string} [props.accept='*']
 * @param {string} [props.label='Subir archivo']
 * @param {string} [props.hint='PDF, Excel, Word — máx. 10MB']
 * @param {string} [props.currentFile]
 * @param {boolean} [props.disabled=false]
 */
export default function FileUpload({
  onFile,
  accept = '*',
  label = 'Subir archivo',
  hint = 'PDF, Excel, Word \u2014 máx. 10MB',
  currentFile,
  disabled = false,
}) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = (file) => {
    if (file && !disabled) {
      onFile(file)
    }
  }

  const handleInputChange = (event) => {
    const file = event.target.files?.[0]
    handleFile(file)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    handleFile(file)
  }

  const openFilePicker = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click()
    }
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      <button
        type="button"
        onClick={openFilePicker}
        onDragEnter={(event) => {
          event.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setIsDragging(false)
        }}
        onDrop={handleDrop}
        disabled={disabled}
        className={`w-full rounded-xl border-2 border-dashed px-5 py-8 text-center transition-colors ${
          isDragging
            ? 'border-[#185fa5] bg-[#e6f1fb]'
            : 'border-slate-300 bg-white hover:border-[#378add]'
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <p className="text-sm font-semibold text-[#0b2545]">{label}</p>
        <p className="mt-1 text-xs text-slate-600">{hint}</p>

        {currentFile ? (
          <div className="mt-4 rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-700">
            Archivo actual: <span className="font-medium">{currentFile}</span>
            <span className="ml-2 text-[#185fa5]">(clic para cambiar)</span>
          </div>
        ) : null}
      </button>
    </div>
  )
}
