'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Card,
  CardContent,
  Button,
  Box,
  CircularProgress
} from '@mui/material'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import CustomTextField from '@/components/ui/TextField'
import { SettingsActionBar } from '@/components/admin/settings/SettingsSection'
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
    <Box>
      <AdminPageHeader title='Create New Workspace' />

      <Box sx={{ maxWidth: 600 }}>
        <Card>
          {/* The form wraps the action bar too, so the docked submit button
              still belongs to it. */}
          <form onSubmit={handleSubmit}>
            <CardContent>
              {error && (
                <Alert severity='error' sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
                <CustomTextField
                  required
                  label="Workspace Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  disabled={loading}
                />

                <CustomTextField
                  required
                  label="URL Slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  fullWidth
                  disabled={loading}
                  helperText="This will be used for your workspace URL"
                />

                <CustomTextField
                  label="Custom Domain (Optional)"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  fullWidth
                  disabled={loading}
                  placeholder="e.g. store.yourcompany.com"
                />
              </Box>
            </CardContent>

            <SettingsActionBar>
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
                color="secondary"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </SettingsActionBar>
          </form>
        </Card>
      </Box>
    </Box>
  )
}
