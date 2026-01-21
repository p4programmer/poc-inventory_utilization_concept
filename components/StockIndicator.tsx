interface StockIndicatorProps {
  currentStock: number;
  reorderLevel: number;
  unit?: string;
}

export default function StockIndicator({
  currentStock,
  reorderLevel,
  unit = '',
}: StockIndicatorProps) {
  const getStatus = () => {
    if (currentStock === 0) return 'out';
    if (currentStock <= reorderLevel) return 'low';
    if (currentStock <= reorderLevel * 2) return 'medium';
    return 'good';
  };

  const status = getStatus();

  const styles = {
    out: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-800 dark:text-red-200',
      dot: 'bg-red-500',
    },
    low: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-800 dark:text-orange-200',
      dot: 'bg-orange-500',
    },
    medium: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-800 dark:text-yellow-200',
      dot: 'bg-yellow-500',
    },
    good: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-800 dark:text-green-200',
      dot: 'bg-green-500',
    },
  };

  const currentStyle = styles[status];

  return (
    <div className="flex items-center space-x-2">
      <span className={`flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currentStyle.bg} ${currentStyle.text}`}>
        <span className={`w-2 h-2 rounded-full ${currentStyle.dot} mr-1.5`}></span>
        {currentStock} {unit}
      </span>
      {status === 'out' && <span className="text-xs text-red-600 dark:text-red-400 font-semibold">Out of Stock</span>}
      {status === 'low' && <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold">Low Stock</span>}
    </div>
  );
}
