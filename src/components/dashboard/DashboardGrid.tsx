import type { ReactNode } from 'react'
import { Responsive, WidthProvider, type Layout, type Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGrid = WidthProvider(Responsive)

interface DashboardGridProps {
  children: ReactNode
  layouts: Layouts
  rowHeight: number
  editMode: boolean
  onLayoutChange: (_layout: Layout[], all: Layouts) => void
}

/** Loaded only for wide screens so the dashboard shell and mobile view do not pay for the grid engine. */
export function DashboardGrid({ children, layouts, rowHeight, editMode, onLayoutChange }: DashboardGridProps) {
  return <ResponsiveGrid
    className="dashboard-grid"
    layouts={layouts}
    breakpoints={{ lg: 1200, md: 900, sm: 768, xs: 0 }}
    cols={{ lg: 12, md: 8, sm: 6, xs: 4 }}
    rowHeight={rowHeight}
    margin={[16, 16]}
    containerPadding={[0, 0]}
    compactType="vertical"
    isDraggable={editMode}
    isResizable={editMode}
    draggableHandle=".drag-handle"
    resizeHandles={['se']}
    onLayoutChange={onLayoutChange}
    useCSSTransforms
  >{children}</ResponsiveGrid>
}
