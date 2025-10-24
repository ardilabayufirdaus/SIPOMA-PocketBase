import React, { useState, useCallback, useMemo } from 'react';

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'kpi' | 'table' | 'text';
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: {
    chartType?: 'line' | 'bar' | 'area' | 'pie';
    dataSource?: string;
    metrics?: string[];
    filters?: Record<string, string | number | boolean>;
    refreshInterval?: number;
    content?: string;
    value?: string | number;
    metric?: string;
    trend?: string;
  };
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
  };
}

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout: {
    columns: number;
    gap: number;
  };
  settings: {
    autoRefresh: boolean;
    refreshInterval: number;
    theme: 'light' | 'dark' | 'auto';
  };
}

interface CustomDashboardBuilderProps {
  dashboard: DashboardLayout;
  onChange: (dashboard: DashboardLayout) => void;
  onSave?: (dashboard: DashboardLayout) => void;
  availableWidgets: Array<{
    type: DashboardWidget['type'];
    name: string;
    icon: React.ReactNode;
    defaultConfig: DashboardWidget['config'];
  }>;
  isEditing?: boolean;
}

const CustomDashboardBuilder: React.FC<CustomDashboardBuilderProps> = ({
  dashboard,
  onChange,
  onSave,
  availableWidgets,
  isEditing = false,
}) => {
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [showWidgetPanel, setShowWidgetPanel] = useState(false);

  // Add new widget
  const addWidget = useCallback(
    (widgetType: DashboardWidget['type']) => {
      const widgetTemplate = availableWidgets.find((w) => w.type === widgetType);
      if (!widgetTemplate) return;

      const newWidget: DashboardWidget = {
        id: `widget-${Date.now()}`,
        type: widgetType,
        title: `New ${widgetTemplate.name}`,
        position: {
          x: 0,
          y: dashboard.widgets.length,
          width: widgetType === 'kpi' ? 1 : 2,
          height: widgetType === 'text' ? 1 : 2,
        },
        config: { ...widgetTemplate.defaultConfig },
        style: {
          backgroundColor: '#ffffff',
          borderColor: '#e2e8f0',
          textColor: '#1e293b',
        },
      };

      onChange({
        ...dashboard,
        widgets: [...dashboard.widgets, newWidget],
      });
    },
    [dashboard, onChange, availableWidgets]
  );

  // Update widget
  const updateWidget = useCallback(
    (widgetId: string, updates: Partial<DashboardWidget>) => {
      const updatedWidgets = dashboard.widgets.map((widget) =>
        widget.id === widgetId ? { ...widget, ...updates } : widget
      );

      onChange({
        ...dashboard,
        widgets: updatedWidgets,
      });
    },
    [dashboard, onChange]
  );

  // Delete widget
  const deleteWidget = useCallback(
    (widgetId: string) => {
      const updatedWidgets = dashboard.widgets.filter((widget) => widget.id !== widgetId);
      onChange({
        ...dashboard,
        widgets: updatedWidgets,
      });

      if (selectedWidget === widgetId) {
        setSelectedWidget(null);
      }
    },
    [dashboard, onChange, selectedWidget]
  );

  // Move widget up/down
  const moveWidget = useCallback(
    (widgetId: string, direction: 'up' | 'down') => {
      const currentIndex = dashboard.widgets.findIndex((w) => w.id === widgetId);
      if (currentIndex === -1) return;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= dashboard.widgets.length) return;

      const items = [...dashboard.widgets];
      const [movedItem] = items.splice(currentIndex, 1);
      items.splice(newIndex, 0, movedItem);

      onChange({
        ...dashboard,
        widgets: items,
      });
    },
    [dashboard, onChange]
  );

  // Grid system
  const gridStyle = useMemo(
    () => ({
      display: 'grid',
      gridTemplateColumns: `repeat(${dashboard.layout.columns}, 1fr)`,
      gap: `${dashboard.layout.gap}px`,
      padding: '20px',
    }),
    [dashboard.layout.columns, dashboard.layout.gap]
  );

  // Widget components
  const renderWidget = useCallback(
    (widget: DashboardWidget, isDragging = false) => {
      const baseClasses = `
      relative border-2 rounded-lg p-4 transition-all duration-200
      ${selectedWidget === widget.id ? 'border-blue-500 shadow-lg' : 'border-slate-200 hover:border-slate-300'}
      ${isDragging ? 'opacity-50 transform rotate-2' : ''}
    `;

      const style = {
        gridColumn: `span ${widget.position.width}`,
        gridRow: `span ${widget.position.height}`,
        backgroundColor: widget.style?.backgroundColor || '#ffffff',
        borderColor:
          selectedWidget === widget.id ? '#3b82f6' : widget.style?.borderColor || '#e2e8f0',
        color: widget.style?.textColor || '#1e293b',
        minHeight: '120px',
      };

      return (
        <div className={baseClasses} style={style} onClick={() => setSelectedWidget(widget.id)}>
          {/* Widget Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm truncate">{widget.title}</h3>
            {isEditing && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Open widget settings
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  ⚙️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteWidget(widget.id);
                  }}
                  className="p-1 text-red-400 hover:text-red-600 rounded"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>

          {/* Widget Content */}
          <div className="widget-content h-full">{renderWidgetContent(widget)}</div>

          {/* Resize handles (when editing) */}
          {isEditing && selectedWidget === widget.id && (
            <>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded cursor-se-resize" />
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded cursor-nw-resize" />
            </>
          )}
        </div>
      );
    },
    [selectedWidget, isEditing, deleteWidget]
  );

  // Render widget content based on type
  const renderWidgetContent = useCallback((widget: DashboardWidget) => {
    switch (widget.type) {
      case 'chart':
        return (
          <div className="h-full flex items-center justify-center bg-slate-50 rounded">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm text-slate-600">
                {widget.config.chartType || 'line'} Chart
              </div>
            </div>
          </div>
        );

      case 'kpi':
        return (
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {widget.config.value || '0'}
            </div>
            <div className="text-sm text-slate-600">{widget.config.metric || 'Metric'}</div>
            <div className="text-xs text-green-500 mt-1">{widget.config.trend || '+5.2%'}</div>
          </div>
        );

      case 'table':
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 text-xs font-medium text-slate-600 border-b pb-1">
              <div>Column 1</div>
              <div>Column 2</div>
              <div>Column 3</div>
            </div>
            {[1, 2, 3].map((row) => (
              <div key={row} className="grid grid-cols-3 gap-2 text-xs text-slate-700">
                <div>Data {row}</div>
                <div>Value {row}</div>
                <div>Status {row}</div>
              </div>
            ))}
          </div>
        );

      case 'text':
        return (
          <div className="text-sm text-slate-700">
            {widget.config.content || 'Add your text content here...'}
          </div>
        );

      default:
        return (
          <div className="h-full flex items-center justify-center text-slate-400">
            Unknown widget type
          </div>
        );
    }
  }, []);

  return (
    <div className="h-full flex">
      {/* Main Dashboard Area */}
      <div className="flex-1 bg-slate-50">
        {/* Dashboard Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{dashboard.name}</h1>
              {dashboard.description && (
                <p className="text-sm text-slate-600 mt-1">{dashboard.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {isEditing && (
                <button
                  onClick={() => setShowWidgetPanel(!showWidgetPanel)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Add Widget
                </button>
              )}
              {onSave && (
                <button
                  onClick={() => onSave(dashboard)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save Dashboard
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div style={gridStyle} className="min-h-screen">
          {dashboard.widgets.map((widget) => (
            <div key={widget.id}>{renderWidget(widget, false)}</div>
          ))}
        </div>
      </div>

      {/* Widget Panel */}
      {showWidgetPanel && isEditing && (
        <div className="w-80 bg-white border-l border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Add Widget</h2>
            <button
              onClick={() => setShowWidgetPanel(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {availableWidgets.map((widget) => (
              <button
                key={widget.type}
                onClick={() => addWidget(widget.type)}
                className="w-full p-4 text-left border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{widget.icon}</div>
                  <div>
                    <div className="font-medium text-slate-900">{widget.name}</div>
                    <div className="text-sm text-slate-600">Add a {widget.name.toLowerCase()}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Widget Settings Panel */}
      {selectedWidget && isEditing && (
        <div className="w-80 bg-white border-l border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Widget Settings</h2>

          {/* Widget settings form would go here */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Widget Title</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={dashboard.widgets.find((w) => w.id === selectedWidget)?.title || ''}
                onChange={(e) => updateWidget(selectedWidget, { title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Width (columns)
              </label>
              <input
                type="number"
                min="1"
                max={dashboard.layout.columns}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={dashboard.widgets.find((w) => w.id === selectedWidget)?.position.width || 1}
                onChange={(e) => {
                  const widget = dashboard.widgets.find((w) => w.id === selectedWidget);
                  if (widget) {
                    updateWidget(selectedWidget, {
                      position: {
                        ...widget.position,
                        width: parseInt(e.target.value),
                      },
                    });
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDashboardBuilder;
