'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress
} from '@mui/material'
import { createWorkspace } from '@/services/platform-api'
import { getPlatformToken } from '@/utils/authTokens'

export default function NewWorkspacePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    region: 'us-east'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'name' && !prev.slug ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') } : {})
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = getPlatformToken()
      if (!token) throw new Error('Not authenticated')

      await createWorkspace(formData, token)
      router.push('/admin/platform/workspaces')
    } catch (err: any) {
      setError(err.message || 'Failed to create workspace')
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Workspace</h1>
      
      <Box sx={{ maxWidth: 600 }}>
        <Card>
          <CardContent>
            {error && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
                <Typography>{error}</Typography>
              </Box>
            )}
            
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
                <TextField
                  required
                  label="Workspace Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  disabled={loading}
                />
                
                <TextField
                  required
                  label="URL Slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  fullWidth
                  disabled={loading}
                  helperText="This will be used for your workspace URL"
                />
                
                <TextField
                  label="Custom Domain (Optional)"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  fullWidth
                  disabled={loading}
                  placeholder="e.g. store.yourcompany.com"
                />
                
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary" 
                    disabled={loading || !formData.name || !formData.slug}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Workspace'}
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    </div>
  )
}
