'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { Severity } from '@/lib/types'

interface SideEffect {
  id: string
  treatmentName: string
  sideEffectName: string
  severity: Severity | null
  description: string | null
  managementAdvice: string | null
  citation: string | null
}

export function TreatmentLibrary() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sideEffects, setSideEffects] = useState<SideEffect[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    setLoading(true)
    try {
      const response = await fetch(`/api/treatments/${encodeURIComponent(searchTerm)}/side-effects`)
      const data = await response.json()
      setSideEffects(data.sideEffects || [])
      setSelectedTreatment(searchTerm)
    } catch (error) {
      console.error('Error searching treatments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityIcon = (severity: Severity | null) => {
    switch (severity) {
      case 'emergency':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'concerning':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />
      case 'common':
        return <Info className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  const getSeverityLabel = (severity: Severity | null) => {
    switch (severity) {
      case 'emergency':
        return 'Emergency - Seek immediate medical care'
      case 'concerning':
        return 'Concerning - Contact your healthcare provider'
      case 'common':
        return 'Common - Usually manageable'
      default:
        return 'Unknown severity'
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <div className="widget-header">
        <CardHeader>
          <CardTitle>Treatment & Side Effects Library</CardTitle>
          <CardDescription>
            Information about treatments and their side effects
          </CardDescription>
        </CardHeader>
      </div>
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search treatment name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            disabled={loading}
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {selectedTreatment && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium">Treatment: {selectedTreatment}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : sideEffects.length === 0 && selectedTreatment ? (
          <div className="text-center py-8 text-muted-foreground">
            No side effects found for this treatment.
          </div>
        ) : (
          <div className="space-y-4">
            {sideEffects.map((effect) => (
              <div key={effect.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  {getSeverityIcon(effect.severity)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{effect.sideEffectName}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getSeverityLabel(effect.severity)}
                    </p>
                  </div>
                </div>
                {effect.description && (
                  <p className="text-xs text-muted-foreground">{effect.description}</p>
                )}
                {effect.managementAdvice && (
                  <div className="mt-2 p-2 bg-gray-50 rounded">
                    <p className="text-xs font-medium mb-1">Management:</p>
                    <p className="text-xs text-muted-foreground">{effect.managementAdvice}</p>
                  </div>
                )}
                {effect.citation && (
                  <p className="text-xs text-muted-foreground italic">
                    Source: {effect.citation}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {sideEffects.some(e => e.severity === 'emergency') && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <p className="text-xs text-red-800 font-medium">
                If you experience any emergency-level side effects, seek immediate medical attention 
                or call emergency services.
              </p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t text-xs text-muted-foreground">
          <p className="italic">
            This information is for educational purposes only. Always consult your healthcare provider 
            about side effects and treatment management. Seek immediate medical care for emergency symptoms.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

