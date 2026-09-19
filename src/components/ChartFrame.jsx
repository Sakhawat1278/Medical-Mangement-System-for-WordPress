import React from 'react'

const ChartFrame = ({ height = 240, minHeight, className = '', style, children, render }) => {
  const ref = React.useRef(null)
  const [size, setSize] = React.useState({ width: 0, height: 0 })

  React.useLayoutEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const update = () => {
      const rect = node.getBoundingClientRect()
      setSize({
        width: Math.max(0, Math.floor(rect.width)),
        height: Math.max(0, Math.floor(rect.height))
      })
    }

    update()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }

    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const resolvedHeight = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      ref={ref}
      className={`ecare-chart-frame ${className}`.trim()}
      style={{
        width: '100%',
        height: resolvedHeight,
        minHeight: minHeight || resolvedHeight,
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      {size.width > 0 && size.height > 0
        ? typeof render === 'function'
          ? render(size)
          : typeof children === 'function'
            ? children(size)
            : children
        : null}
    </div>
  )
}

export default ChartFrame
