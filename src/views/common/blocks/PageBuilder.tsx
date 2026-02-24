'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Popover,
  Typography,
  Divider,
  TextField,
} from '@mui/material'
import { Icon } from '@iconify/react'

import { PageRenderer } from './PageRenderer'
import type { BlockConfig, BlockDefinition, BlockComponent } from './types'

interface PageBuilderProps {
  initialBlocks?: BlockConfig[]
  onBlocksChange?: (blocks: BlockConfig[]) => void
  pageSlug?: string
  locale?: string
  locales?: string[]

  /** Block registry – required (no default). Pass e.g. storefront or dashboard registry getters. */
  getBlocksByCategory: () => Record<string, BlockDefinition[]>
  getBlockDefinition: (type: string) => BlockDefinition | null
  getBlockComponent: (type: string) => BlockComponent | null
}

/**
 * Generic block-based page builder. Registry (getBlocksByCategory, getBlockDefinition, getBlockComponent)
 * must be provided by the caller (storefront blocks, dashboard blocks, etc.).
 */
export function PageBuilder({
  initialBlocks = [],
  onBlocksChange,
  locale = 'en',
  locales = ['en', 'zh'],
  getBlocksByCategory,
  getBlockDefinition,
  getBlockComponent,
}: PageBuilderProps) {
  const [blocks, setBlocks] = useState<BlockConfig[]>(initialBlocks)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [blockPickerAnchor, setBlockPickerAnchor] = useState<HTMLElement | null>(null)
  const [currentLocale, setCurrentLocale] = useState(locale)
  const [blockJson, setBlockJson] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)

  // Sync from parent when initialBlocks changes (e.g. dialog opened with page blocks)
  useEffect(() => {
    if (Array.isArray(initialBlocks) && initialBlocks.length >= 0) {
      setBlocks(initialBlocks)
    }
  }, [initialBlocks])

  const blocksByCategory = getBlocksByCategory()

  const handleAddBlock = useCallback(
    (definition: BlockDefinition) => {
      const newBlock: BlockConfig = {
        id: `block_${Date.now()}`,
        type: definition.type,
        settings: { ...definition.defaultSettings },
        data: { ...definition.defaultData },
      }
      const newBlocks = [...blocks, newBlock]
      setBlocks(newBlocks)
      onBlocksChange?.(newBlocks)
      setBlockPickerAnchor(null)
      setSelectedBlockId(newBlock.id)
    },
    [blocks, onBlocksChange]
  )

  const handleMoveBlock = useCallback(
    (blockId: string, direction: 'up' | 'down') => {
      const index = blocks.findIndex((b) => b.id === blockId)
      if (index === -1) return
      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= blocks.length) return
      const newBlocks = [...blocks]
      ;[newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]]
      setBlocks(newBlocks)
      onBlocksChange?.(newBlocks)
    },
    [blocks, onBlocksChange]
  )

  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      const newBlocks = blocks.filter((b) => b.id !== blockId)
      setBlocks(newBlocks)
      onBlocksChange?.(newBlocks)
      if (selectedBlockId === blockId) {
        setSelectedBlockId(null)
        setBlockJson('')
        setJsonError(null)
      }
    },
    [blocks, selectedBlockId, onBlocksChange]
  )

  const handleBlockClick = useCallback((blockId: string) => {
    setSelectedBlockId(blockId)
  }, [])

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId)
  const selectedDefinition = selectedBlock ? getBlockDefinition(selectedBlock.type) : null

  // When selection changes, update JSON editor content
  useEffect(() => {
    if (selectedBlock) {
      setBlockJson(JSON.stringify({ settings: selectedBlock.settings ?? {}, data: selectedBlock.data ?? {} }, null, 2))
      setJsonError(null)
    } else {
      setBlockJson('')
      setJsonError(null)
    }
  }, [selectedBlock?.id])

  const handleApplyBlockJson = useCallback(() => {
    if (!selectedBlock) return
    try {
      const parsed = JSON.parse(blockJson) as { settings?: Record<string, unknown>; data?: Record<string, unknown> }
      const updated: BlockConfig = {
        ...selectedBlock,
        settings: parsed.settings ?? selectedBlock.settings ?? {},
        data: parsed.data ?? selectedBlock.data ?? {},
      }
      const newBlocks = blocks.map((b) => (b.id === selectedBlock.id ? updated : b))
      setBlocks(newBlocks)
      onBlocksChange?.(newBlocks)
      setJsonError(null)
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }, [selectedBlock, blockJson, blocks, onBlocksChange])

  const isBlockPickerOpen = Boolean(blockPickerAnchor)

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 200px)', gap: 2 }}>
      {/* Left: Preview only */}
      <Paper sx={{ flex: 1, overflow: 'auto', p: 0, minHeight: 0 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='h6'>Page Preview</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {locales.map((loc) => (
                <Button
                  key={loc}
                  size='small'
                  variant={currentLocale === loc ? 'contained' : 'outlined'}
                  onClick={() => setCurrentLocale(loc)}
                >
                  {loc.toUpperCase()}
                </Button>
              ))}
            </Box>
          </Box>
        </Box>
        <Box sx={{ p: 2, minHeight: 400, overflow: 'auto' }}>
          <PageRenderer
            key={blocks.length}
            blocks={blocks}
            locale={currentLocale}
            isEditing={true}
            onBlockClick={handleBlockClick}
            getBlockComponent={getBlockComponent}
          />
        </Box>
      </Paper>

      {/* Right: Add Block button (top), then Page Blocks list, then Block Settings (JSON) when selected */}
      <Paper sx={{ width: 380, overflow: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
          <Button
            variant='outlined'
            fullWidth
            startIcon={<Icon icon='mdi:plus' />}
            onClick={(e) => setBlockPickerAnchor(e.currentTarget)}
          >
            Add Block
          </Button>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
            Page Blocks
          </Typography>
          {blocks.length === 0 ? (
            <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', py: 3 }}>
              No blocks. Click &quot;Add Block&quot; above to choose a block type.
            </Typography>
          ) : (
            <List disablePadding sx={{ mb: 2 }}>
              {blocks.map((block, index) => {
                const def = getBlockDefinition(block.type)
                return (
                  <ListItemButton
                    key={block.id}
                    selected={selectedBlockId === block.id}
                    onClick={() => setSelectedBlockId(block.id)}
                    sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Typography variant='caption' color='text.secondary'>
                        {index + 1}
                      </Typography>
                    </ListItemIcon>
                    <ListItemText primary={def?.name || block.type} secondary={block.type} />
                  </ListItemButton>
                )
              })}
            </List>
          )}

          {selectedBlock && selectedDefinition && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
                Block Settings (JSON)
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant='body2'>{selectedDefinition.name}</Typography>
                <Box>
                  <IconButton
                    size='small'
                    onClick={() => handleMoveBlock(selectedBlock.id, 'up')}
                    disabled={blocks.indexOf(selectedBlock) === 0}
                    title='Move up'
                  >
                    <Icon icon='mdi:arrow-up' />
                  </IconButton>
                  <IconButton
                    size='small'
                    onClick={() => handleMoveBlock(selectedBlock.id, 'down')}
                    disabled={blocks.indexOf(selectedBlock) === blocks.length - 1}
                    title='Move down'
                  >
                    <Icon icon='mdi:arrow-down' />
                  </IconButton>
                  <IconButton size='small' color='error' onClick={() => handleDeleteBlock(selectedBlock.id)} title='Delete'>
                    <Icon icon='mdi:delete' />
                  </IconButton>
                </Box>
              </Box>
              <TextField
                fullWidth
                multiline
                minRows={8}
                maxRows={16}
                value={blockJson}
                onChange={(e) => setBlockJson(e.target.value)}
                error={Boolean(jsonError)}
                helperText={jsonError}
                placeholder='{"settings": {}, "data": {}}'
                sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 12 } }}
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button size='small' variant='contained' onClick={handleApplyBlockJson}>
                  Apply JSON
                </Button>
                <Button size='small' variant='text' onClick={() => setSelectedBlockId(null)}>
                  Back to list
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Paper>

      {/* Block type picker: Popover above the Add Block button */}
      <Popover
        open={isBlockPickerOpen}
        anchorEl={blockPickerAnchor}
        onClose={() => setBlockPickerAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{ paper: { sx: { maxHeight: 360 } } }}
        sx={{ zIndex: 1400 }}
      >
        <Box sx={{ width: 400, p: 2 }}>
          <Typography variant='h6' sx={{ mb: 2 }}>
            Add Block
          </Typography>
          {Object.entries(blocksByCategory).map(([category, defs]) => (
            <Box key={category} sx={{ mb: 2 }}>
              <Typography variant='overline' color='text.secondary' sx={{ textTransform: 'capitalize' }}>
                {category}
              </Typography>
              <Grid container spacing={1} sx={{ mt: 0.5 }}>
                {defs.map((def) => (
                  <Grid size={6} key={def.type}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 3 },
                        transition: 'box-shadow 0.2s',
                      }}
                      onClick={() => handleAddBlock(def)}
                    >
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant='body2' noWrap>
                          {def.name}
                        </Typography>
                        <Typography variant='caption' color='text.secondary' noWrap display='block'>
                          {def.description || def.type}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Box>
      </Popover>
    </Box>
  )
}

export default PageBuilder
