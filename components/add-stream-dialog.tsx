"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AddStreamDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (streamUrl: string) => boolean
}

export default function AddStreamDialog({ isOpen, onClose, onAdd }: AddStreamDialogProps) {
  const [streamUrl, setStreamUrl] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleAdd = () => {
    if (!streamUrl.trim()) {
      setError("Please enter a valid stream URL")
      return
    }

    // Basic URL validation
    try {
      new URL(streamUrl)
    } catch (e) {
      setError("Please enter a valid URL")
      return
    }

    const success = onAdd(streamUrl)

    if (success) {
      setStreamUrl("")
      setError(null)
      onClose()
    } else {
      setError("No empty cells available. Please remove a stream first.")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Stream</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="stream-url">WebRTC Stream URL</Label>
            <Input
              id="stream-url"
              placeholder="http://example.com/stream"
              value={streamUrl}
              onChange={(e) => {
                setStreamUrl(e.target.value)
                setError(null)
              }}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>Add Stream</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
