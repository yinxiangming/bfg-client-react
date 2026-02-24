'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import { alpha } from '@mui/material/styles'

// Component Imports
import CustomTextField from '@components/ui/TextField'
import ChangePassword from './ChangePassword'
import Information from './Information'

// Utils Imports
import { meApi } from '@/utils/meApi'
import { useAppDialog } from '@/contexts/AppDialogContext'

const Settings = () => {
  const t = useTranslations('account.settings')
  const { confirm } = useAppDialog()

  // States
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [me, setMe] = useState<{ email?: string; phone?: string } | null>(null)

  const [settings, setSettings] = useState({
    // Notification preferences
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    
    // Notification types
    order_updates: true,
    promotions: true,
    product_updates: false,
    support_replies: true,
    
    // Privacy settings
    profile_visibility: 'public',
    show_email: false,
    show_phone: false,
    
    // Display preferences
    theme: 'auto',
    items_per_page: 10,
  })

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await meApi.getSettings()
        setSettings({
          email_notifications: data.email_notifications ?? true,
          sms_notifications: data.sms_notifications ?? false,
          push_notifications: data.push_notifications ?? true,
          order_updates: data.order_updates ?? true,
          promotions: data.promotions ?? true,
          product_updates: data.product_updates ?? false,
          support_replies: data.support_replies ?? true,
          profile_visibility: data.profile_visibility || 'public',
          show_email: data.show_email ?? false,
          show_phone: data.show_phone ?? false,
          theme: data.theme || 'auto',
          items_per_page: data.items_per_page || 10,
        })
      } catch (err: any) {
        setError(err.message || t('failedLoad'))
        console.error('Failed to fetch settings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Fetch basic user info for display (email/phone)
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const data = await meApi.getMe()
        setMe({ email: data?.email, phone: data?.phone })
      } catch {
        // Ignore errors; UI will fall back to placeholders
      }
    }

    fetchMe()
  }, [])

  const handleSettingChange = (field: string, value: any) => {
    setSettings({ ...settings, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)
      
      await meApi.updateSettings(settings)
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || t('failedUpdate'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Tabs
          value={activeTab}
          onChange={(e, value) => setActiveTab(value)}
          variant='scrollable'
          scrollButtons='auto'
          sx={{ borderBottom: theme => `1px solid ${theme.palette.divider}` }}
        >
          <Tab label={t('profile')} icon={<i className='tabler-user' />} iconPosition='start' />
          <Tab label={t('security')} icon={<i className='tabler-lock' />} iconPosition='start' />
          <Tab label={t('preferences')} icon={<i className='tabler-settings' />} iconPosition='start' />
          <Tab label={t('privacy')} icon={<i className='tabler-shield-lock' />} iconPosition='start' />
        </Tabs>
      </Grid>
      
      <Grid size={{ xs: 12 }}>
        {activeTab === 0 && (
          <Box>
            <Information />
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <form onSubmit={handleSubmit}>
              {error && (
                <Alert severity='error' className='mbe-6' onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity='success' className='mbe-6' onClose={() => setSuccess(false)}>
                  {t('updateSuccess')}
                </Alert>
              )}
              
              <Grid container spacing={4}>
                {/* Communication Channels Card */}
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box className='mbe-4'>
                        <Typography variant='h6' className='mbe-1'>
                          {t('communicationChannels.title')}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {t('communicationChannels.subtitle')}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2.25 }}>
                          <Typography variant='body2' fontWeight={500}>
                            {t('communicationChannels.email')}
                          </Typography>
                          <Switch
                            checked={settings.email_notifications}
                            onChange={e => handleSettingChange('email_notifications', e.target.checked)}
                          />
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2.25 }}>
                          <Typography variant='body2' fontWeight={500}>
                            {t('communicationChannels.sms')}
                          </Typography>
                          <Switch
                            checked={settings.sms_notifications}
                            onChange={e => handleSettingChange('sms_notifications', e.target.checked)}
                          />
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2.25 }}>
                          <Typography variant='body2' fontWeight={500}>
                            {t('communicationChannels.push')}
                          </Typography>
                          <Switch
                            checked={settings.push_notifications}
                            onChange={e => handleSettingChange('push_notifications', e.target.checked)}
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Notification Topics Card */}
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box className='mbe-4'>
                        <Typography variant='h6' className='mbe-1'>
                          {t('notificationTopics.title')}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {t('notificationTopics.subtitle')}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2.25 }}>
                          <Typography variant='body2' fontWeight={500}>
                            {t('notificationTopics.orderUpdates')}
                          </Typography>
                          <Switch
                            checked={settings.order_updates}
                            onChange={e => handleSettingChange('order_updates', e.target.checked)}
                          />
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2.25 }}>
                          <Typography variant='body2' fontWeight={500}>
                            {t('notificationTopics.promotions')}
                          </Typography>
                          <Switch
                            checked={settings.promotions}
                            onChange={e => handleSettingChange('promotions', e.target.checked)}
                          />
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2.25 }}>
                          <Typography variant='body2' fontWeight={500}>
                            {t('notificationTopics.productUpdates')}
                          </Typography>
                          <Switch
                            checked={settings.product_updates}
                            onChange={e => handleSettingChange('product_updates', e.target.checked)}
                          />
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2.25 }}>
                          <Typography variant='body2' fontWeight={500}>
                            {t('notificationTopics.supportReplies')}
                          </Typography>
                          <Switch
                            checked={settings.support_replies}
                            onChange={e => handleSettingChange('support_replies', e.target.checked)}
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Display Settings Card */}
                <Grid size={{ xs: 12 }}>
                  <Card>
                    <CardContent>
                      <Box className='mbe-6'>
                        <Typography variant='h6' className='mbe-1'>
                          {t('displaySettings.title')}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {t('displaySettings.subtitle')}
                        </Typography>
                      </Box>
                      
                      <Grid container spacing={6}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant='body2' fontWeight={500} className='mbe-3'>
                            {t('displaySettings.themeSelection')}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                            {(['light', 'dark', 'auto'] as const).map(option => {
                              const isSelected = settings.theme === option

                              return (
                                <Box key={option} sx={{ width: 92 }}>
                                  <Box
                                    onClick={() => handleSettingChange('theme', option)}
                                    sx={{
                                      cursor: 'pointer',
                                      borderRadius: 2,
                                      border: '2px solid',
                                      borderColor: isSelected ? 'primary.main' : 'divider',
                                      boxShadow: isSelected ? theme => `0 0 0 4px ${alpha(theme.palette.primary.main, 0.12)}` : 'none',
                                      transition: 'all 0.2s',
                                      p: 1,
                                      '&:hover': {
                                        borderColor: 'primary.main'
                                      }
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        height: 56,
                                        borderRadius: 1.5,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        overflow: 'hidden',
                                        ...(option === 'light'
                                          ? { bgcolor: 'background.paper' }
                                          : option === 'dark'
                                            ? { bgcolor: 'grey.900' }
                                            : { background: 'linear-gradient(135deg, #F3F4F6 0%, #9CA3AF 55%, #374151 100%)' })
                                      }}
                                    >
                                      {option === 'light' && (
                                        <Box sx={{ p: 1 }}>
                                          <Box sx={{ height: 6, bgcolor: 'grey.200', borderRadius: 1, mb: 1 }} />
                                          <Box sx={{ height: 6, bgcolor: 'grey.200', borderRadius: 1, width: '70%', mb: 1.5 }} />
                                          <Box sx={{ height: 18, bgcolor: 'grey.100', borderRadius: 1 }} />
                                        </Box>
                                      )}
                                      {option === 'dark' && (
                                        <Box sx={{ p: 1 }}>
                                          <Box sx={{ height: 6, bgcolor: 'grey.800', borderRadius: 1, mb: 1 }} />
                                          <Box sx={{ height: 6, bgcolor: 'grey.800', borderRadius: 1, width: '70%', mb: 1.5 }} />
                                          <Box sx={{ height: 18, bgcolor: 'grey.850', borderRadius: 1 }} />
                                        </Box>
                                      )}
                                      {option === 'auto' && (
                                        <Box
                                          sx={{
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'text.secondary',
                                            opacity: 0.4
                                          }}
                                        >
                                          {/* Intentionally minimal preview for auto */}
                                          <Box
                                            sx={{
                                              width: 28,
                                              height: 28,
                                              borderRadius: '50%',
                                              bgcolor: 'action.hover'
                                            }}
                                          />
                                        </Box>
                                      )}
                                    </Box>
                                  </Box>
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                    sx={{ display: 'block', textAlign: 'center', mt: 1, textTransform: 'capitalize' }}
                                  >
                                    {t(`displaySettings.${option}`)}
                                  </Typography>
                                </Box>
                              )
                            })}
                          </Box>
                        </Grid>
                        
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant='body2' fontWeight={500} className='mbe-3'>
                            {t('displaySettings.dataDensity')}
                          </Typography>
                          <CustomTextField
                            select
                            fullWidth
                            value={settings.items_per_page}
                            onChange={e => handleSettingChange('items_per_page', parseInt(e.target.value))}
                          >
                            <MenuItem value={10}>{t('displaySettings.items', { count: 10 })}</MenuItem>
                            <MenuItem value={20}>{t('displaySettings.items', { count: 20 })}</MenuItem>
                            <MenuItem value={50}>{t('displaySettings.items', { count: 50 })}</MenuItem>
                            <MenuItem value={100}>{t('displaySettings.items', { count: 100 })}</MenuItem>
                          </CustomTextField>
                          <Typography variant='caption' color='text.secondary' className='mbs-1' display='block'>
                            {t('displaySettings.densityHint')}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Actions */}
                <Grid
                  size={{ xs: 12 }}
                  sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-end' }}
                >
                  <Button
                    variant='outlined'
                    type='button'
                    disabled={saving || loading}
                    onClick={() => window.location.reload()}
                  >
                    {t('resetChanges')}
                  </Button>
                  <Button variant='contained' type='submit' disabled={saving || loading} disableElevation>
                    {saving ? t('saving') : t('saveChanges')}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Box>
        )}
        
        {activeTab === 3 && (
          <Box>
            <form onSubmit={handleSubmit}>
              {error && (
                <Alert severity='error' className='mbe-6' onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity='success' className='mbe-6' onClose={() => setSuccess(false)}>
                  {t('updateSuccess')}
                </Alert>
              )}
              
              <Grid container spacing={4}>
                {/* Profile Visibility */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant='h6' className='mbe-1'>
                        {t('profileVisibility.title')}
                      </Typography>
                      <Typography variant='body2' color='text.secondary' className='mbe-6'>
                        {t('profileVisibility.subtitle')}
                      </Typography>

                      <CustomTextField
                        select
                        fullWidth
                        value={settings.profile_visibility}
                        onChange={e => handleSettingChange('profile_visibility', e.target.value)}
                        size='small'
                      >
                        <MenuItem value='private'>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <i className='tabler-lock text-xl text-textSecondary' />
                            <Typography variant='body2'>{t('profileVisibility.private')}</Typography>
                          </Box>
                        </MenuItem>
                        <MenuItem value='friends'>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <i className='tabler-users text-xl text-textSecondary' />
                            <Typography variant='body2'>{t('profileVisibility.friends')}</Typography>
                          </Box>
                        </MenuItem>
                        <MenuItem value='public'>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <i className='tabler-world text-xl text-textSecondary' />
                            <Typography variant='body2'>{t('profileVisibility.public')}</Typography>
                          </Box>
                        </MenuItem>
                      </CustomTextField>

                      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 2 }}>
                        {settings.profile_visibility === 'private'
                          ? t('profileVisibility.currentlyPrivate')
                          : settings.profile_visibility === 'friends'
                            ? t('profileVisibility.currentlyFriends')
                            : t('profileVisibility.currentlyPublic')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Contact Information */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 0 }}>
                      <Box sx={{ p: 6 }}>
                        <Typography variant='h6' className='mbe-1'>
                          {t('contactInfo.title')}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {t('contactInfo.subtitle')}
                        </Typography>
                      </Box>

                      <Divider />

                      <Box sx={{ px: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 4 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                            <i className='tabler-mail text-xl text-textSecondary' />
                            <Box>
                              <Typography variant='body2' fontWeight={600}>
                                {t('contactInfo.emailAddress')}
                              </Typography>
                              <Typography variant='caption' color='text.secondary'>
                                {me?.email || '—'}
                              </Typography>
                            </Box>
                          </Box>
                          <Switch
                            checked={settings.show_email}
                            onChange={e => handleSettingChange('show_email', e.target.checked)}
                            size='small'
                          />
                        </Box>

                        <Divider />

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 4 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                            <i className='tabler-phone text-xl text-textSecondary' />
                            <Box>
                              <Typography variant='body2' fontWeight={600}>
                                {t('contactInfo.phoneNumber')}
                              </Typography>
                              <Typography variant='caption' color='text.secondary'>
                                {me?.phone || '—'}
                              </Typography>
                            </Box>
                          </Box>
                          <Switch
                            checked={settings.show_phone}
                            onChange={e => handleSettingChange('show_phone', e.target.checked)}
                            size='small'
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Data Management */}
                <Grid size={{ xs: 12 }}>
                  <Card>
                    <CardContent sx={{ p: 0 }}>
                      <Box sx={{ p: 6 }}>
                        <Typography variant='h6' className='mbe-1'>
                          {t('dataManagement.title')}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {t('dataManagement.subtitle')}
                        </Typography>
                      </Box>

                      <Divider />

                      <Grid container>
                        <Grid size={{ xs: 12, md: 6 }} sx={{ p: 6 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <i className='tabler-download text-xl text-textSecondary' />
                            <Typography variant='body2' fontWeight={600}>
                              {t('dataManagement.downloadData')}
                            </Typography>
                          </Box>
                          <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
                            {t('dataManagement.downloadHint')}
                          </Typography>
                          <Button
                            variant='outlined'
                            startIcon={<i className='tabler-download' />}
                            onClick={() => {
                              // TODO: Implement GDPR data download
                              alert(t('dataManagement.exportAlert'))
                            }}
                            disabled={loading || saving}
                            fullWidth
                            sx={{ borderRadius: 2 }}
                          >
                            {t('dataManagement.requestExport')}
                          </Button>
                        </Grid>

                        <Grid
                          size={{ xs: 12, md: 6 }}
                          sx={{
                            p: 6,
                            borderTop: { xs: '1px solid', md: 'none' },
                            borderLeft: { xs: 'none', md: '1px solid' },
                            borderColor: 'divider',
                            bgcolor: theme => alpha(theme.palette.error.main, 0.06)
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, color: 'error.main' }}>
                            <i className='tabler-alert-triangle text-xl' />
                            <Typography variant='body2' fontWeight={600} color='error'>
                              {t('dataManagement.deleteAccount')}
                            </Typography>
                          </Box>
                          <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
                            {t('dataManagement.deleteHint')}
                          </Typography>
                          <Button
                            variant='outlined'
                            color='error'
                            startIcon={<i className='tabler-trash' />}
                            onClick={async () => {
                              if (await confirm(t('dataManagement.deleteConfirm'), { danger: true })) {
                                // TODO: Implement account deletion
                                alert(t('dataManagement.deleteAlert'))
                              }
                            }}
                            disabled={loading || saving}
                            fullWidth
                            sx={{ borderRadius: 2 }}
                          >
                            {t('dataManagement.deleteAccount')}
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Actions (same position as other tabs) */}
                <Grid
                  size={{ xs: 12 }}
                  sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-end' }}
                >
                  <Button
                    variant='outlined'
                    type='button'
                    disabled={saving || loading}
                    onClick={() => window.location.reload()}
                  >
                    {t('resetChanges')}
                  </Button>
                  <Button variant='contained' type='submit' disabled={saving || loading} disableElevation>
                    {saving ? t('saving') : t('saveChanges')}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Box>
        )}
        
        {activeTab === 1 && (
          <Box>
            <ChangePassword />
          </Box>
        )}
      </Grid>
    </Grid>
  )
}

export default Settings
