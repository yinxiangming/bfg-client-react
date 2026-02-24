'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  Divider,
} from '@mui/material'
import { Icon } from '@iconify/react'
import { PageRenderer } from '@/views/common/blocks'
import type {
  BlockConfig,
  BlockDefinition,
  BlockComponent,
  BlockSettingsComponent,
} from '@/views/common/blocks'
import type { DashboardLayout } from './defaultLayout'

type ColumnKey = 'left' | 'right'

interface DashboardLayoutEditorProps {
  initialLayout: DashboardLayout
  onLayoutChange?: (layout: DashboardLayout) => void
  locale?: string
  getBlocksByCategory: () => Record<string, BlockDefinition[]>
  getBlockDefinition: (type: string) => BlockDefinition | null
  getBlockComponent: (type: string) => BlockComponent | null
  getBlockSettingsEditor?: (type: string) => BlockSettingsComponent | null
}

export function DashboardLayoutEditor({
  initialLayout,
  onLayoutChange,
  locale = 'en',
  getBlocksByCategory,
  getBlockDefinition,
  getBlockComponent,
  getBlockSettingsEditor,
}: DashboardLayoutEditorProps) {
  const [layout, setLayout] = useState<DashboardLayout>(initialLayout)
  useEffect(() => {
    setLayout(initialLayout)
  }, [initialLayout])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [selectedColumn, setSelectedColumn] = useState<ColumnKey | null>(null)
  const [isBlockPickerOpen, setIsBlockPickerOpen] = useState(false)
  const [insertColumn, setInsertColumn] = useState<ColumnKey>('left')
  const [insertIndex, setInsertIndex] = useState<number>(-1)

  const syncLayout = useCallback(
    (next: DashboardLayout) => {
      setLayout(next)
      onLayoutChange?.(next)
    },
    [onLayoutChange]
  )

  const getBlocks = (col: ColumnKey): BlockConfig[] => layout[col]
  const setBlocks = useCallback(
    (col: ColumnKey, blocks: BlockConfig[]) => {
      syncLayout({ ...layout, [col]: blocks })
    },
    [layout, syncLayout]
  )

  const handleAddBlock = useCallback(
    (definition: BlockDefinition) => {
      const newBlock: BlockConfig = {
        id: `block_${Date.now()}`,
        type: definition.type,
        settings: { ...definition.defaultSettings },
        data: { ...definition.defaultData },
      }
      const col = insertColumn
      const blocks = [...getBlocks(col)]
      const idx = insertIndex >= 0 && insertIndex < blocks.length ? insertIndex + 1 : blocks.length
      blocks.splice(idx, 0, newBlock)
      setBlocks(col, blocks)
      setIsBlockPickerOpen(false)
      setSelectedBlockId(newBlock.id)
      setSelectedColumn(col)
    },
    [insertColumn, insertIndex, getBlocks, setBlocks]
  )

  const openPicker = (col: ColumnKey, index: number) => {
    setInsertColumn(col)
    setInsertIndex(index)
    setIsBlockPickerOpen(true)
  }

  const handleMoveBlock = useCallback(
    (blockId: string, direction: 'up' | 'down') => {
      const col = selectedColumn ?? (layout.left.some((b) => b.id === blockId) ? 'left' : 'right')
      const blocks = getBlocks(col)
      const index = blocks.findIndex((b) => b.id === blockId)
      if (index === -1) return
      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= blocks.length) return
      const newBlocks = [...blocks]
      ;[newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]]
      setBlocks(col, newBlocks)
    },
    [selectedColumn, layout.left, getBlocks, setBlocks]
  )

  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      const col = selectedColumn ?? (layout.left.some((b) => b.id === blockId) ? 'left' : 'right')
      const newBlocks = getBlocks(col).filter((b) => b.id !== blockId)
      setBlocks(col, newBlocks)
      if (selectedBlockId === blockId) {
        setSelectedBlockId(null)
        setSelectedColumn(null)
      }
    },
    [selectedBlockId, selectedColumn, layout.left, getBlocks, setBlocks]
  )

  const handleBlockClick = useCallback((blockId: string, col: ColumnKey) => {
    setSelectedBlockId(blockId)
    setSelectedColumn(col)
  }, [])

  const handleSettingsChange = useCallback(
    (newSettings: Record<string, unknown>) => {
      if (!selectedBlockId || !selectedColumn) return
      const blocks = getBlocks(selectedColumn).map((b) =>
        b.id === selectedBlockId ? { ...b, settings: newSettings } : b
      )
      setBlocks(selectedColumn, blocks)
    },
    [selectedBlockId, selectedColumn, getBlocks, setBlocks]
  )

  const handleDataChange = useCallback(
    (newData: Record<string, unknown>) => {
      if (!selectedBlockId || !selectedColumn) return
      const blocks = getBlocks(selectedColumn).map((b) =>
        b.id === selectedBlockId ? { ...b, data: newData } : b
      )
      setBlocks(selectedColumn, blocks)
    },
    [selectedBlockId, selectedColumn, getBlocks, setBlocks]
  )

  const selectedBlock =
    selectedBlockId && selectedColumn
      ? getBlocks(selectedColumn).find((b) => b.id === selectedBlockId)
      : null
  const selectedDefinition = selectedBlock ? getBlockDefinition(selectedBlock.type) : null
  const blocksByCategory = getBlocksByCategory()

  const renderColumn = (col: ColumnKey, label: string) => {
    const blocks = getBlocks(col)
    return (
      <Paper key={col} sx={{ overflow: 'auto', p: 0, flex: col === 'left' ? 2 : 1, minWidth: 0 }}>
        <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" color="text.secondary">
            {label}
          </Typography>
        </Box>
        <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <PageRenderer
            blocks={blocks}
            locale={locale}
            isEditing
            onBlockClick={(id) => handleBlockClick(id, col)}
            getBlockComponent={getBlockComponent}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<Icon icon="mdi:plus" />}
            onClick={() => openPicker(col, blocks.length - 1)}
          >
            Add block
          </Button>
        </Box>
      </Paper>
    )
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 200px)', gap: 2 }}>
      <Box sx={{ flex: 1, display: 'flex', gap: 2, minWidth: 0 }}>
        {renderColumn('left', 'Left (wide)')}
        {renderColumn('right', 'Right (narrow)')}
      </Box>

      <Paper sx={{ width: 360, overflow: 'auto', flexShrink: 0 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">
            {selectedBlock ? 'Block Settings' : 'Dashboard Blocks'}
          </Typography>
        </Box>
        {selectedBlock && selectedDefinition ? (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">{selectedDefinition.name}</Typography>
              <Box>
                <IconButton
                  size="small"
                  onClick={() => handleMoveBlock(selectedBlock.id, 'up')}
                  disabled={
                    selectedColumn
                      ? getBlocks(selectedColumn).indexOf(selectedBlock) === 0
                      : true
                  }
                >
                  <Icon icon="mdi:arrow-up" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleMoveBlock(selectedBlock.id, 'down')}
                  disabled={
                    selectedColumn
                      ? getBlocks(selectedColumn).indexOf(selectedBlock) ===
                        getBlocks(selectedColumn).length - 1
                      : true
                  }
                >
                  <Icon icon="mdi:arrow-down" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteBlock(selectedBlock.id)}
                >
                  <Icon icon="mdi:delete" />
                </IconButton>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Block ID: {selectedBlock.id}
            </Typography>
            {getBlockSettingsEditor?.(selectedBlock.type) ? (
              <Box sx={{ mb: 2 }}>
                {React.createElement(getBlockSettingsEditor(selectedBlock.type)!, {
                  block: selectedBlock,
                  settings: selectedBlock.settings ?? {},
                  data: selectedBlock.data ?? {},
                  onSettingsChange: handleSettingsChange,
                  onDataChange: handleDataChange,
                  locale,
                })}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No settings for this block.
              </Typography>
            )}
            <Box sx={{ mt: 2 }}>
              <Button variant="text" size="small" onClick={() => setSelectedBlockId(null)}>
                Back to Block List
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Left column
            </Typography>
            <List dense>
              {getBlocks('left').map((block, index) => {
                const def = getBlockDefinition(block.type)
                return (
                  <ListItemButton
                    key={block.id}
                    onClick={() => handleBlockClick(block.id, 'left')}
                    sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}
                  >
                    <ListItemIcon>
                      <Typography variant="caption" color="text.secondary">
                        {index + 1}
                      </Typography>
                    </ListItemIcon>
                    <ListItemText primary={def?.name ?? block.type} secondary={block.type} />
                  </ListItemButton>
                )
              })}
            </List>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 2 }}>
              Right column
            </Typography>
            <List dense>
              {getBlocks('right').map((block, index) => {
                const def = getBlockDefinition(block.type)
                return (
                  <ListItemButton
                    key={block.id}
                    onClick={() => handleBlockClick(block.id, 'right')}
                    sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}
                  >
                    <ListItemIcon>
                      <Typography variant="caption" color="text.secondary">
                        {index + 1}
                      </Typography>
                    </ListItemIcon>
                    <ListItemText primary={def?.name ?? block.type} secondary={block.type} />
                  </ListItemButton>
                )
              })}
            </List>
            {layout.left.length === 0 && layout.right.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No blocks. Use &quot;Add block&quot; in left or right column.
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      <Drawer anchor="right" open={isBlockPickerOpen} onClose={() => setIsBlockPickerOpen(false)}>
        <Box sx={{ width: 400, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Add Block
          </Typography>
          {Object.entries(blocksByCategory).map(([category, defs]) => (
            <Box key={category} sx={{ mb: 3 }}>
              <Typography variant="overline" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                {category}
              </Typography>
              <Grid container spacing={1} sx={{ mt: 1 }}>
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
                        <Typography variant="body2" noWrap>
                          {def.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {def.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Box>
      </Drawer>
    </Box>
  )
}
