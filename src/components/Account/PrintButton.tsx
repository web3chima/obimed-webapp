'use client'
import React from 'react'
import { PrinterIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

export const PrintButton: React.FC<{ label?: string }> = ({ label = 'Print / save as PDF' }) => (
  <Button className="print:hidden" onClick={() => window.print()} size="lg">
    <PrinterIcon />
    {label}
  </Button>
)
