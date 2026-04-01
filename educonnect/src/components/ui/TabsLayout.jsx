import { useState } from 'react'

/**
 * @typedef {Object} TabItem
 * @property {string} label
 * @property {import('react').ReactNode} content
 */

/**
 * @param {Object} props
 * @param {TabItem[]} props.tabs
 * @param {number} [props.defaultTab=0]
 * @param {(index: number) => void} [props.onChange]
 */
export default function TabsLayout({ tabs, defaultTab = 0, onChange }) {
  const initial = Math.max(0, Math.min(defaultTab, Math.max(tabs.length - 1, 0)))
  const [activeTab, setActiveTab] = useState(initial)

  const handleTabClick = (index) => {
    setActiveTab(index)
    if (onChange) onChange(index)
  }

  if (!tabs.length) {
    return null
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap border-b border-slate-200">
        {tabs.map((tab, index) => {
          const isActive = index === activeTab
          return (
            <button
              key={`${tab.label}-${index}`}
              type="button"
              onClick={() => handleTabClick(index)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-[#185fa5] text-[#185fa5]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="pt-4">{tabs[activeTab]?.content}</div>
    </div>
  )
}
